import secrets
import uuid

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
from validators import (
    ValidationError,
    email,
    license_plate,
    optional_text,
    password,
    positive_int,
    required_text,
    verification_code,
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


def queue_email(cursor, user_id, email_to, subject, body):
    cursor.execute(
        """
        INSERT INTO email_outbox (email_id, user_id, email_to, subject, body)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (uuid.uuid4().hex, user_id, email_to, subject, body),
    )


def ensure_runtime_schema():
    execute(
        """
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
            verification_id CHAR(32) PRIMARY KEY,
            user_id CHAR(32) NOT NULL UNIQUE,
            code_hash VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
            last_sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            verified_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
        """
    )


def make_verification_code():
    return f"{secrets.randbelow(1_000_000):06d}"


def verification_email(first_name, code):
    subject = "Bekræft din email til WashWorld"
    body = (
        f"Hej {first_name}.\n\n"
        f"Din bekræftelseskode er: {code}\n\n"
        f"Koden udløber om {Config.EMAIL_VERIFICATION_TTL_MINUTES} minutter. "
        "Hvis du ikke har oprettet en WashWorld-konto, kan du ignorere denne email."
    )
    return subject, body


def deliver_email(email_to, subject, body):
    try:
        send_email(email_to, subject, body)
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
            image
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
    code = make_verification_code()
    code_hash = generate_password_hash(code)
    verification_subject, verification_body = verification_email(first_name, code)

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
                code_hash,
                expires_at
            )
            VALUES (%s, %s, %s, DATE_ADD(NOW(), INTERVAL %s MINUTE))
            """,
            (
                uuid.uuid4().hex,
                user_id,
                code_hash,
                Config.EMAIL_VERIFICATION_TTL_MINUTES,
            ),
        )
        queue_email(
            cursor,
            user_id,
            user_email,
            verification_subject,
            verification_body,
        )

    run_transaction(create_user)

    email_sent = deliver_email(user_email, verification_subject, verification_body)
    if not email_sent:
        allow_immediate_verification_resend(user_id)

    return jsonify(
        {
            "verification_required": True,
            "email": user_email,
            "email_sent": email_sent,
            "message": (
                "Vi har sendt en 6-cifret kode til din email"
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
    code = verification_code(data)
    verification = fetch_one(
        """
        SELECT
            email_verification_tokens.verification_id,
            email_verification_tokens.user_id,
            email_verification_tokens.code_hash,
            email_verification_tokens.expires_at,
            email_verification_tokens.attempts,
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
        return jsonify({"error": "Bekræftelseskoden er ugyldig eller allerede brugt"}), 400

    if verification["attempts"] >= 5:
        return jsonify({"error": "For mange forsøg. Send en ny kode."}), 429

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
        return jsonify({"error": "Koden er udløbet. Send en ny kode."}), 400

    if not check_password_hash(verification["code_hash"], code):
        execute(
            """
            UPDATE email_verification_tokens
            SET attempts = attempts + 1
            WHERE verification_id = %s
              AND verified_at IS NULL
            """,
            (verification["verification_id"],),
        )
        return jsonify({"error": "Bekræftelseskoden er forkert"}), 400

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
            raise ValidationError("Bekræftelseskoden er ugyldig eller udløbet")
        queue_email(
            cursor,
            verification["user_id"],
            verification["email"],
            welcome_subject,
            welcome_body,
        )

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
        return jsonify({"message": "Hvis emailen afventer bekræftelse, er der sendt en ny kode"}), 200

    if verification["seconds_since_send"] < Config.EMAIL_VERIFICATION_RESEND_SECONDS:
        seconds_left = Config.EMAIL_VERIFICATION_RESEND_SECONDS - verification["seconds_since_send"]
        return jsonify({"error": f"Vent {seconds_left} sekunder, før du sender igen"}), 429

    code = make_verification_code()
    code_hash = generate_password_hash(code)
    subject, body = verification_email(verification["first_name"], code)

    def replace_code(cursor):
        cursor.execute(
            """
            UPDATE email_verification_tokens
            SET
                code_hash = %s,
                expires_at = DATE_ADD(NOW(), INTERVAL %s MINUTE),
                attempts = 0,
                last_sent_at = NOW()
            WHERE verification_id = %s
              AND verified_at IS NULL
            """,
            (
                code_hash,
                Config.EMAIL_VERIFICATION_TTL_MINUTES,
                verification["verification_id"],
            ),
        )
        queue_email(
            cursor,
            verification["user_id"],
            verification["email"],
            subject,
            body,
        )

    run_transaction(replace_code)
    if not deliver_email(verification["email"], subject, body):
        allow_immediate_verification_resend(verification["user_id"])
        return jsonify({"error": "Emailen kunne ikke sendes. Kontrollér SMTP-opsætningen."}), 503

    return jsonify({"message": "En ny bekræftelseskode er sendt"}), 200


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
            queue_email(
                cursor,
                user["user_id"],
                user["email"],
                reset_subject,
                reset_body,
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
        queue_email(
            cursor,
            reset["user_id"],
            reset["email"],
            changed_subject,
            changed_body,
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
    ensure_runtime_schema()
    app.run(host="0.0.0.0", port=5001, debug=Config.DEBUG)
