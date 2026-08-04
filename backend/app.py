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
from database import execute, fetch_all, fetch_one
from validators import (
    ValidationError,
    email,
    license_plate,
    optional_text,
    password,
    positive_int,
    required_text,
)

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY

CORS(app)
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


def send_email(user_id, email_to, subject, body):
    execute(
        """
        INSERT INTO email_outbox (email_id, user_id, email_to, subject, body)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (uuid.uuid4().hex, user_id, email_to, subject, body),
    )


def validate_location_and_plan(location_id, plan_id):
    if not fetch_one("SELECT location_id FROM locations WHERE location_id = %s", (location_id,)):
        raise ValidationError("Location does not exist")

    if not fetch_one("SELECT plan_id FROM plans WHERE plan_id = %s", (plan_id,)):
        raise ValidationError("Plan does not exist")


@app.get("/")
def health_check():
    return jsonify({"status": "ok", "message": "CleanWash API is running"})


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

    if fetch_one("SELECT user_id FROM users WHERE email = %s", (user_email,)):
        return jsonify({"error": "Email is already in use"}), 409

    validate_location_and_plan(location_id, plan_id)

    user_id = uuid.uuid4().hex

    execute(
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
            generate_password_hash(user_password),
            user_license_plate,
            phone,
            location_id,
            plan_id,
        ),
    )

    send_email(
        user_id,
        user_email,
        "Velkommen til CleanWash",
        f"Hej {first_name}. Din CleanWash-konto er oprettet, og dit abonnement er aktivt.",
    )

    return create_session_response(user_id, 201)


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}

    user_email = email(data)
    user_password = password(data)
    user = fetch_one("SELECT user_id, password_hash FROM users WHERE email = %s", (user_email,))

    if not user or not check_password_hash(user["password_hash"], user_password):
        return jsonify({"error": "Email or password is wrong"}), 401

    return create_session_response(user["user_id"])


@app.post("/api/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    user_email = email(data)
    user = fetch_one("SELECT user_id, first_name, email FROM users WHERE email = %s", (user_email,))

    if user:
        reset_key = uuid.uuid4().hex

        execute(
            """
            INSERT INTO password_reset_tokens (reset_id, user_id, reset_key, expires_at)
            VALUES (%s, %s, %s, DATE_ADD(NOW(), INTERVAL 30 MINUTE))
            """,
            (uuid.uuid4().hex, user["user_id"], reset_key),
        )

        send_email(
            user["user_id"],
            user["email"],
            "Nulstil dit CleanWash kodeord",
            f"Hej {user['first_name']}. Brug denne reset-kode i appen: {reset_key}",
        )

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

    execute(
        """
        UPDATE users
        SET password_hash = %s
        WHERE user_id = %s
        """,
        (generate_password_hash(new_password), reset["user_id"]),
    )

    execute(
        """
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE reset_id = %s
        """,
        (reset["reset_id"],),
    )

    send_email(
        reset["user_id"],
        reset["email"],
        "Dit CleanWash kodeord er ændret",
        "Dit kodeord er nu ændret. Hvis det ikke var dig, skal du kontakte support.",
    )

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
    app.run(host="0.0.0.0", port=5001, debug=True)
