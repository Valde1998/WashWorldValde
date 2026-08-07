import secrets
import uuid
from html import escape
from urllib.parse import urlencode

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from mysql.connector import Error as MySQLError
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config
from database import execute, fetch_all, fetch_one, run_transaction
from email_service import EmailDeliveryError, send_email
from washworld_locations import SOURCE_CHECKED_ON, location_records
from validators import (
    ValidationError,
    email,
    license_plate,
    optional_text,
    password,
    positive_int,
    required_text,
    verification_token,
)

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY

CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})
JWTManager(app)


def get_profile(user_id):
    return fetch_one(
        """
        SELECT
            users.user_id,
            users.first_name,
            users.email,
            users.license_plate,
            users.phone,
            locations.location_id,
            locations.name AS location_name,
            locations.city AS location_city,
            plans.plan_id,
            plans.name AS plan_name,
            plans.monthly_price
        FROM users
        JOIN locations ON locations.location_id = users.location_id
        JOIN plans ON plans.plan_id = users.plan_id
        WHERE users.user_id = %s
        """,
        (user_id,),
    )


def create_session_response(user_id, status_code=200):
    token = create_access_token(identity=user_id)
    return jsonify({"token": token, "user": get_profile(user_id)}), status_code


def ensure_runtime_schema():
    table_statements = (
        """
        CREATE TABLE IF NOT EXISTS locations (
            location_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(80) NOT NULL,
            city VARCHAR(80) NOT NULL,
            address VARCHAR(120) NOT NULL,
            opening_hours VARCHAR(80) NOT NULL,
            queue_minutes INT NOT NULL,
            image VARCHAR(120) NOT NULL,
            slug VARCHAR(180),
            postal_code VARCHAR(10),
            latitude DECIMAL(11, 8),
            longitude DECIMAL(11, 8),
            location_type VARCHAR(20) NOT NULL DEFAULT 'washhall',
            halls_count INT NOT NULL DEFAULT 1,
            self_wash_count INT NOT NULL DEFAULT 0,
            source_url VARCHAR(255),
            source_checked_on DATE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS plans (
            plan_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(80) NOT NULL,
            description VARCHAR(255) NOT NULL,
            monthly_price DECIMAL(8, 2) NOT NULL,
            single_wash_price DECIMAL(8, 2) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS users (
            user_id CHAR(32) PRIMARY KEY,
            first_name VARCHAR(80) NOT NULL,
            email VARCHAR(120) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            license_plate VARCHAR(20) NOT NULL,
            phone VARCHAR(30),
            location_id INT NOT NULL,
            plan_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (location_id) REFERENCES locations(location_id),
            FOREIGN KEY (plan_id) REFERENCES plans(plan_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS wash_history (
            wash_id CHAR(32) PRIMARY KEY,
            user_id CHAR(32) NOT NULL,
            location_id INT NOT NULL,
            wash_type VARCHAR(80) NOT NULL,
            washed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (location_id) REFERENCES locations(location_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            reset_id CHAR(32) PRIMARY KEY,
            user_id CHAR(32) NOT NULL,
            reset_key CHAR(32) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            used_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
            verification_id CHAR(32) PRIMARY KEY,
            user_id CHAR(32) NOT NULL UNIQUE,
            token_hash VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            last_sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            verified_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
        """,
    )
    for statement in table_statements:
        execute(statement)

    location_columns = {
        "slug": "slug VARCHAR(180)",
        "postal_code": "postal_code VARCHAR(10)",
        "latitude": "latitude DECIMAL(11, 8)",
        "longitude": "longitude DECIMAL(11, 8)",
        "location_type": "location_type VARCHAR(20) NOT NULL DEFAULT 'washhall'",
        "halls_count": "halls_count INT NOT NULL DEFAULT 1",
        "self_wash_count": "self_wash_count INT NOT NULL DEFAULT 0",
        "source_url": "source_url VARCHAR(255)",
        "source_checked_on": "source_checked_on DATE",
    }
    existing_columns = {
        row["COLUMN_NAME"]
        for row in fetch_all(
            """
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'locations'
            """,
            (Config.DB_NAME,),
        )
    }
    for name, definition in location_columns.items():
        if name not in existing_columns:
            execute(f"ALTER TABLE locations ADD COLUMN {definition}")

    plans = (
        (1, "Basis", "Til dig der vasker bilen et par gange om maaneden.", 99.00, 79.00),
        (2, "Plus", "Den mest brugte pakke med fri vask i din faste vaskehal.", 149.00, 99.00),
        (3, "Premium", "Fri vask i alle vaskehaller og ekstra lakbeskyttelse.", 199.00, 129.00),
    )
    for plan in plans:
        execute(
            """
            INSERT INTO plans (plan_id, name, description, monthly_price, single_wash_price)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = VALUES(description),
                monthly_price = VALUES(monthly_price),
                single_wash_price = VALUES(single_wash_price)
            """,
            plan,
        )


def sync_washworld_locations():
    records = list(location_records())
    records_by_slug = {record["slug"]: record for record in records}
    preserved_ids = {
        1: "tilst-blomstervej",
        2: "viby-gunnar-clausens-vej",
        3: "hojbjerg-bjodstrupvej",
    }

    def values(record):
        return (
            record["name"],
            record["city"],
            record["address"],
            record["opening_hours"],
            0,
            record["image"],
            record["slug"],
            record["postal_code"],
            record["latitude"],
            record["longitude"],
            record["location_type"],
            record["halls_count"],
            record["self_wash_count"],
            record["source_url"],
            SOURCE_CHECKED_ON,
        )

    update_sql = """
        UPDATE locations
        SET
            name = %s,
            city = %s,
            address = %s,
            opening_hours = %s,
            queue_minutes = %s,
            image = %s,
            slug = %s,
            postal_code = %s,
            latitude = %s,
            longitude = %s,
            location_type = %s,
            halls_count = %s,
            self_wash_count = %s,
            source_url = %s,
            source_checked_on = %s
        WHERE location_id = %s
    """

    def sync(cursor):
        for location_id, slug in preserved_ids.items():
            cursor.execute(update_sql, (*values(records_by_slug[slug]), location_id))

        for record in records:
            cursor.execute("SELECT location_id FROM locations WHERE slug = %s LIMIT 1", (record["slug"],))
            existing = cursor.fetchone()
            if existing:
                cursor.execute(update_sql, (*values(record), existing[0]))
                continue

            cursor.execute(
                """
                INSERT INTO locations (
                    name,
                    city,
                    address,
                    opening_hours,
                    queue_minutes,
                    image,
                    slug,
                    postal_code,
                    latitude,
                    longitude,
                    location_type,
                    halls_count,
                    self_wash_count,
                    source_url,
                    source_checked_on
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                values(record),
            )

    run_transaction(sync)


def ensure_demo_user():
    if fetch_one("SELECT user_id FROM users WHERE email = %s", ("demo@washworld.dk",)):
        return

    location = fetch_one("SELECT location_id FROM locations ORDER BY location_id LIMIT 1")
    plan = fetch_one("SELECT plan_id FROM plans WHERE plan_id = %s", (2,))
    if not location or not plan:
        return

    execute(
        """
        INSERT INTO users (
            user_id, first_name, email, password_hash, license_plate, phone, location_id, plan_id
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            uuid.uuid4().hex,
            "Demo",
            "demo@washworld.dk",
            generate_password_hash("kodeord123"),
            "WW 2026",
            "+45 20 26 20 26",
            location["location_id"],
            plan["plan_id"],
        ),
    )


def prepare_application():
    ensure_runtime_schema()
    sync_washworld_locations()
    ensure_demo_user()


def make_verification_token():
    return secrets.token_urlsafe(32)


def verification_email(first_name, user_email, token):
    query = urlencode({"email": user_email, "token": token})
    verification_url = f"{Config.FRONTEND_URL}/bekraeft-email?{query}"
    subject = "Bekræft din email til WashWorld"
    body = (
        f"Hej {first_name}.\n\n"
        "Åbn linket nedenfor og tryk på knappen 'Bekræft email':\n\n"
        f"{verification_url}\n\n"
        f"Linket udløber om {Config.EMAIL_VERIFICATION_TTL_MINUTES} minutter. "
        "Hvis du ikke har oprettet en WashWorld-konto, kan du ignorere denne email."
    )
    safe_name = escape(first_name)
    safe_url = escape(verification_url, quote=True)
    html_body = f"""\
<!doctype html>
<html lang="da">
  <body style="margin:0;background:#f4f5f4;font-family:Arial,sans-serif;color:#111111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:18px;padding:36px;">
            <tr><td style="font-size:13px;font-weight:700;letter-spacing:3px;color:#008b3d;">WASHWORLD</td></tr>
            <tr><td style="padding-top:24px;font-size:28px;font-weight:700;">Bekræft din email</td></tr>
            <tr><td style="padding-top:16px;font-size:16px;line-height:1.6;">Hej {safe_name}. Tryk på knappen nedenfor for at bekræfte din email og aktivere dit medlemskab.</td></tr>
            <tr>
              <td align="center" style="padding:28px 0;">
                <a href="{safe_url}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 28px;border-radius:8px;">Bekræft email</a>
              </td>
            </tr>
            <tr><td style="font-size:13px;line-height:1.5;color:#666666;">Knappen virker i {Config.EMAIL_VERIFICATION_TTL_MINUTES} minutter. Hvis du ikke har oprettet en WashWorld-konto, kan du ignorere denne email.</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""
    return subject, body, html_body


def deliver_email(email_to, subject, body, html_body=None):
    try:
        send_email(email_to, subject, body, html_body)
        return True
    except EmailDeliveryError as error:
        print(f"Email delivery failed: {error}", flush=True)
        return False


def allow_immediate_verification_resend(user_id):
    execute(
        """
        UPDATE email_verification_tokens
        SET last_sent_at = DATE_SUB(NOW(), INTERVAL 1 HOUR)
        WHERE user_id = %s
          AND verified_at IS NULL
        """,
        (user_id,),
    )


def validate_location_and_plan(location_id, plan_id):
    if not fetch_one("SELECT location_id FROM locations WHERE location_id = %s", (location_id,)):
        raise ValidationError("Location does not exist")

    if not fetch_one("SELECT plan_id FROM plans WHERE plan_id = %s", (plan_id,)):
        raise ValidationError("Plan does not exist")


@app.get("/")
def health_check():
    return jsonify({"status": "ok", "message": "WashWorld API is running"})


@app.get("/api/locations")
def locations():
    rows = fetch_all(
        """
        SELECT
            location_id,
            name,
            city,
            address,
            opening_hours,
            queue_minutes,
            image,
            slug,
            postal_code,
            latitude,
            longitude,
            location_type,
            halls_count,
            self_wash_count,
            source_url,
            source_checked_on
        FROM locations
        ORDER BY city
        """
    )

    return jsonify(rows)


@app.get("/api/plans")
def plans():
    rows = fetch_all(
        """
        SELECT
            plan_id,
            name,
            description,
            monthly_price,
            single_wash_price
        FROM plans
        ORDER BY monthly_price
        """
    )

    return jsonify(rows)


@app.get("/api/dashboard")
def dashboard():
    totals = fetch_one(
        """
        SELECT
            (SELECT COUNT(*) FROM locations) AS locations,
            (SELECT COUNT(*) FROM plans) AS plans,
            (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM wash_history) AS washes,
            (SELECT ROUND(AVG(queue_minutes), 0) FROM locations) AS average_queue
        """
    )

    washes_per_day = fetch_all(
        """
        SELECT
            DATE(washed_at) AS day,
            COUNT(*) AS washes
        FROM wash_history
        WHERE washed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(washed_at)
        ORDER BY day
        """
    )

    return jsonify({"totals": totals, "washes_per_day": washes_per_day})


@app.post("/api/sign-up/validate")
def validate_sign_up():
    data = request.get_json(silent=True) or {}

    required_text(data, "first_name", "First name", min_length=2, max_length=80)
    user_email = email(data)
    password(data)
    license_plate(data)
    optional_text(data, "phone", max_length=30)
    location_id = positive_int(data, "location_id", "Location")

    if not fetch_one("SELECT location_id FROM locations WHERE location_id = %s", (location_id,)):
        raise ValidationError("Den valgte vaskehal findes ikke")

    if fetch_one("SELECT user_id FROM users WHERE email = %s", (user_email,)):
        return jsonify({"error": "Emailen er allerede i brug"}), 409

    return jsonify({"message": "Oplysningerne er gyldige"}), 200


@app.post("/api/sign-up")
@app.post("/api/signup")
def sign_up():
    data = request.get_json(silent=True) or {}

    first_name = required_text(data, "first_name", "First name", min_length=2, max_length=80)
    user_email = email(data)
    user_password = password(data)
    user_license_plate = license_plate(data)
    phone = optional_text(data, "phone", max_length=30)
    location_id = positive_int(data, "location_id", "Location")
    plan_id = positive_int(data, "plan_id", "Plan")

    existing_user = fetch_one(
        """
        SELECT
            users.user_id,
            email_verification_tokens.verification_id,
            email_verification_tokens.verified_at
        FROM users
        LEFT JOIN email_verification_tokens
          ON email_verification_tokens.user_id = users.user_id
        WHERE users.email = %s
        """,
        (user_email,),
    )

    if existing_user:
        if existing_user["verification_id"] and not existing_user["verified_at"]:
            return jsonify(
                {
                    "error": "Emailen mangler stadig at blive bekræftet",
                    "verification_required": True,
                    "email": user_email,
                }
            ), 409

        return jsonify({"error": "Email is already in use"}), 409

    validate_location_and_plan(location_id, plan_id)

    user_id = uuid.uuid4().hex
    password_hash = generate_password_hash(user_password)
    token = make_verification_token()
    token_hash = generate_password_hash(token)
    verification_subject, verification_body, verification_html = verification_email(first_name, user_email, token)

    def create_user(cursor):
        cursor.execute(
            """
            INSERT INTO users (
                user_id,
                first_name,
                email,
                password_hash,
                license_plate,
                phone,
                location_id,
                plan_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                first_name,
                user_email,
                password_hash,
                user_license_plate,
                phone,
                location_id,
                plan_id,
            ),
        )
        cursor.execute(
            """
            INSERT INTO email_verification_tokens (
                verification_id,
                user_id,
                token_hash,
                expires_at
            )
            VALUES (%s, %s, %s, DATE_ADD(NOW(), INTERVAL %s MINUTE))
            """,
            (
                uuid.uuid4().hex,
                user_id,
                token_hash,
                Config.EMAIL_VERIFICATION_TTL_MINUTES,
            ),
        )

    run_transaction(create_user)

    email_sent = deliver_email(user_email, verification_subject, verification_body, verification_html)
    if not email_sent:
        allow_immediate_verification_resend(user_id)

    return jsonify(
        {
            "verification_required": True,
            "email": user_email,
            "email_sent": email_sent,
            "message": (
                "Vi har sendt et bekræftelseslink til din email"
                if email_sent
                else "Kontoen er oprettet, men emailen kunne ikke sendes. Kontrollér SMTP og prøv igen."
            ),
        }
    ), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}

    user_email = email(data)
    user_password = password(data)
    user = fetch_one(
        """
        SELECT
            users.user_id,
            users.password_hash,
            email_verification_tokens.verification_id,
            email_verification_tokens.verified_at
        FROM users
        LEFT JOIN email_verification_tokens
          ON email_verification_tokens.user_id = users.user_id
        WHERE users.email = %s
        """,
        (user_email,),
    )

    if not user or not check_password_hash(user["password_hash"], user_password):
        return jsonify({"error": "Email or password is wrong"}), 401

    if user["verification_id"] and not user["verified_at"]:
        return jsonify(
            {
                "error": "Bekræft din email, før du logger ind",
                "verification_required": True,
                "email": user_email,
            }
        ), 403

    return create_session_response(user["user_id"])


@app.post("/api/verify-email")
def verify_email():
    data = request.get_json(silent=True) or {}
    user_email = email(data)
    token = verification_token(data)
    verification = fetch_one(
        """
        SELECT
            email_verification_tokens.verification_id,
            email_verification_tokens.user_id,
            email_verification_tokens.token_hash,
            email_verification_tokens.expires_at,
            email_verification_tokens.verified_at,
            users.first_name,
            users.email
        FROM email_verification_tokens
        JOIN users ON users.user_id = email_verification_tokens.user_id
        WHERE users.email = %s
        LIMIT 1
        """,
        (user_email,),
    )

    if not verification or verification["verified_at"]:
        return jsonify({"error": "Bekræftelseslinket er ugyldigt eller allerede brugt"}), 400

    active_verification = fetch_one(
        """
        SELECT verification_id
        FROM email_verification_tokens
        WHERE verification_id = %s
          AND expires_at > NOW()
        """,
        (verification["verification_id"],),
    )
    if not active_verification:
        return jsonify({"error": "Bekræftelseslinket er udløbet. Send et nyt link."}), 400

    if not check_password_hash(verification["token_hash"], token):
        return jsonify({"error": "Bekræftelseslinket er ugyldigt"}), 400

    welcome_subject = "Velkommen til WashWorld"
    welcome_body = (
        f"Hej {verification['first_name']}. Din email er bekræftet, "
        "og dit WashWorld-medlemskab er nu aktivt."
    )

    def mark_verified(cursor):
        cursor.execute(
            """
            UPDATE email_verification_tokens
            SET verified_at = NOW()
            WHERE verification_id = %s
              AND verified_at IS NULL
              AND expires_at > NOW()
            """,
            (verification["verification_id"],),
        )
        if cursor.rowcount != 1:
            raise ValidationError("Bekræftelseslinket er ugyldigt eller udløbet")

    run_transaction(mark_verified)
    deliver_email(verification["email"], welcome_subject, welcome_body)
    return create_session_response(verification["user_id"])


@app.post("/api/resend-verification")
def resend_verification():
    data = request.get_json(silent=True) or {}
    user_email = email(data)
    verification = fetch_one(
        """
        SELECT
            email_verification_tokens.verification_id,
            email_verification_tokens.user_id,
            email_verification_tokens.verified_at,
            TIMESTAMPDIFF(SECOND, email_verification_tokens.last_sent_at, NOW()) AS seconds_since_send,
            users.first_name,
            users.email
        FROM email_verification_tokens
        JOIN users ON users.user_id = email_verification_tokens.user_id
        WHERE users.email = %s
        LIMIT 1
        """,
        (user_email,),
    )

    if not verification or verification["verified_at"]:
        return jsonify({"message": "Hvis emailen afventer bekræftelse, er der sendt et nyt link"}), 200

    if verification["seconds_since_send"] < Config.EMAIL_VERIFICATION_RESEND_SECONDS:
        seconds_left = Config.EMAIL_VERIFICATION_RESEND_SECONDS - verification["seconds_since_send"]
        return jsonify({"error": f"Vent {seconds_left} sekunder, før du sender igen"}), 429

    token = make_verification_token()
    token_hash = generate_password_hash(token)
    subject, body, html_body = verification_email(verification["first_name"], verification["email"], token)

    def replace_token(cursor):
        cursor.execute(
            """
            UPDATE email_verification_tokens
            SET
                token_hash = %s,
                expires_at = DATE_ADD(NOW(), INTERVAL %s MINUTE),
                last_sent_at = NOW()
            WHERE verification_id = %s
              AND verified_at IS NULL
            """,
            (
                token_hash,
                Config.EMAIL_VERIFICATION_TTL_MINUTES,
                verification["verification_id"],
            ),
        )

    run_transaction(replace_token)
    if not deliver_email(verification["email"], subject, body, html_body):
        allow_immediate_verification_resend(verification["user_id"])
        return jsonify({"error": "Emailen kunne ikke sendes. Kontrollér SMTP-opsætningen."}), 503

    return jsonify({"message": "Et nyt bekræftelseslink er sendt"}), 200


@app.post("/api/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    user_email = email(data)
    user = fetch_one("SELECT user_id, first_name, email FROM users WHERE email = %s", (user_email,))

    if user:
        reset_key = uuid.uuid4().hex
        reset_subject = "Nulstil dit WashWorld kodeord"
        reset_body = f"Hej {user['first_name']}. Brug denne reset-kode i appen: {reset_key}"

        def create_reset(cursor):
            cursor.execute(
                """
                INSERT INTO password_reset_tokens (reset_id, user_id, reset_key, expires_at)
                VALUES (%s, %s, %s, DATE_ADD(NOW(), INTERVAL 30 MINUTE))
                """,
                (uuid.uuid4().hex, user["user_id"], reset_key),
            )

        run_transaction(create_reset)
        deliver_email(user["email"], reset_subject, reset_body)

    return jsonify({"message": "Hvis emailen findes, er der sendt en reset-email"}), 200


@app.post("/api/reset-password")
def reset_password():
    data = request.get_json(silent=True) or {}

    reset_key = required_text(data, "reset_key", "Reset key", min_length=32, max_length=32)
    new_password = password(data)
    reset = fetch_one(
        """
        SELECT
            password_reset_tokens.reset_id,
            users.user_id,
            users.email
        FROM password_reset_tokens
        JOIN users ON users.user_id = password_reset_tokens.user_id
        WHERE password_reset_tokens.reset_key = %s
          AND password_reset_tokens.used_at IS NULL
          AND password_reset_tokens.expires_at > NOW()
        LIMIT 1
        """,
        (reset_key,),
    )

    if not reset:
        return jsonify({"error": "Reset key is invalid or expired"}), 400

    new_password_hash = generate_password_hash(new_password)
    changed_subject = "Dit WashWorld kodeord er ændret"
    changed_body = "Dit kodeord er nu ændret. Hvis det ikke var dig, skal du kontakte support."

    def update_password(cursor):
        cursor.execute(
            """
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE reset_id = %s
              AND used_at IS NULL
              AND expires_at > NOW()
            """,
            (reset["reset_id"],),
        )

        if cursor.rowcount != 1:
            raise ValidationError("Reset key is invalid or expired")

        cursor.execute(
            """
            UPDATE users
            SET password_hash = %s
            WHERE user_id = %s
            """,
            (new_password_hash, reset["user_id"]),
        )

    run_transaction(update_password)
    deliver_email(reset["email"], changed_subject, changed_body)

    return jsonify({"message": "Password was reset"}), 200


@app.get("/api/me")
@jwt_required()
def me():
    profile = get_profile(get_jwt_identity())

    if not profile:
        return jsonify({"error": "User was not found"}), 404

    return jsonify(profile)


@app.put("/api/me")
@jwt_required()
def update_me():
    data = request.get_json(silent=True) or {}
    user_id = get_jwt_identity()

    first_name = required_text(data, "first_name", "First name", min_length=2, max_length=80)
    user_license_plate = license_plate(data)
    phone = optional_text(data, "phone", max_length=30)
    location_id = positive_int(data, "location_id", "Location")
    plan_id = positive_int(data, "plan_id", "Plan")

    validate_location_and_plan(location_id, plan_id)

    execute(
        """
        UPDATE users
        SET
            first_name = %s,
            license_plate = %s,
            phone = %s,
            location_id = %s,
            plan_id = %s
        WHERE user_id = %s
        """,
        (first_name, user_license_plate, phone, location_id, plan_id, user_id),
    )

    return jsonify(get_profile(user_id))


@app.get("/api/wash-history")
@app.get("/api/washes")
@jwt_required()
def wash_history():
    rows = fetch_all(
        """
        SELECT
            wash_history.wash_id,
            wash_history.wash_type,
            wash_history.washed_at,
            locations.name AS location_name,
            locations.city AS location_city
        FROM wash_history
        JOIN locations ON locations.location_id = wash_history.location_id
        WHERE wash_history.user_id = %s
        ORDER BY wash_history.washed_at DESC
        LIMIT 20
        """,
        (get_jwt_identity(),),
    )

    return jsonify(rows)


@app.post("/api/wash-history")
@app.post("/api/washes")
@jwt_required()
def create_wash_history():
    data = request.get_json(silent=True) or {}

    location_id = positive_int(data, "location_id", "Location")
    wash_type = required_text(data, "wash_type", "Wash type", min_length=2, max_length=80)

    if not fetch_one("SELECT location_id FROM locations WHERE location_id = %s", (location_id,)):
        return jsonify({"error": "Location was not found"}), 404

    execute(
        """
        INSERT INTO wash_history (wash_id, user_id, location_id, wash_type)
        VALUES (%s, %s, %s, %s)
        """,
        (uuid.uuid4().hex, get_jwt_identity(), location_id, wash_type),
    )

    return jsonify({"message": "Wash was added"}), 201


@app.errorhandler(ValidationError)
def validation_error(error):
    return jsonify({"error": str(error)}), 400


@app.errorhandler(MySQLError)
def database_error(error):
    print(error, flush=True)
    return jsonify({"error": "Database is not ready"}), 503


@app.errorhandler(Exception)
def unknown_error(error):
    print(error, flush=True)
    return jsonify({"error": "Something went wrong"}), 500


if __name__ == "__main__":
    prepare_application()
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
