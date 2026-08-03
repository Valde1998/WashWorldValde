import uuid

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from database import execute, fetch_one
from validators import ValidationError, email, license_plate, optional_text, password, positive_int, required_text

bp = Blueprint("auth", __name__, url_prefix="/api")


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


def make_session(user):
    token = create_access_token(identity=user["user_id"])
    return jsonify({"token": token, "user": get_profile(user["user_id"])})


@bp.post("/signup")
def signup():
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

    if not fetch_one("SELECT location_id FROM locations WHERE location_id = %s", (location_id,)):
        raise ValidationError("Location does not exist")

    if not fetch_one("SELECT plan_id FROM plans WHERE plan_id = %s", (plan_id,)):
        raise ValidationError("Plan does not exist")

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

    return make_session({"user_id": user_id}), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}

    user_email = email(data)
    user_password = password(data)
    user = fetch_one("SELECT user_id, password_hash FROM users WHERE email = %s", (user_email,))

    if not user or not check_password_hash(user["password_hash"], user_password):
        return jsonify({"error": "Email or password is wrong"}), 401

    return make_session(user)


@bp.get("/me")
@jwt_required()
def me():
    profile = get_profile(get_jwt_identity())

    if not profile:
        return jsonify({"error": "User was not found"}), 404

    return jsonify(profile)


@bp.put("/me")
@jwt_required()
def update_me():
    data = request.get_json(silent=True) or {}
    user_id = get_jwt_identity()

    first_name = required_text(data, "first_name", "First name", min_length=2, max_length=80)
    user_license_plate = license_plate(data)
    phone = optional_text(data, "phone", max_length=30)
    location_id = positive_int(data, "location_id", "Location")
    plan_id = positive_int(data, "plan_id", "Plan")

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
