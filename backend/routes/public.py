from flask import Blueprint, jsonify

from database import fetch_all, fetch_one

bp = Blueprint("public", __name__)


@bp.get("/")
def health_check():
    return jsonify({"status": "ok", "message": "CleanWash API is running"})


@bp.get("/api/locations")
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


@bp.get("/api/plans")
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


@bp.get("/api/dashboard")
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
