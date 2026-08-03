import uuid

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from database import execute, fetch_all, fetch_one
from validators import positive_int, required_text

bp = Blueprint("washes", __name__, url_prefix="/api")


@bp.get("/wash-history")
@bp.get("/washes")
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


@bp.post("/wash-history")
@bp.post("/washes")
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
