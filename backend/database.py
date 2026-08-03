import time
from datetime import date, datetime
from decimal import Decimal

import mysql.connector

from config import Config


def json_value(value):
    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, (date, datetime)):
        return value.isoformat()

    return value


def json_row(row):
    return {key: json_value(value) for key, value in row.items()}


def get_connection():
    # Docker can start Flask before MariaDB is ready, so the first connection retries.
    last_error = None

    for _ in range(20):
        try:
            return mysql.connector.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
            )
        except mysql.connector.Error as error:
            last_error = error
            time.sleep(1)

    raise RuntimeError(f"Could not connect to database: {last_error}")


def fetch_all(sql, params=()):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(sql, params)
        return [json_row(row) for row in cursor.fetchall()]
    finally:
        cursor.close()
        connection.close()


def fetch_one(sql, params=()):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(sql, params)
        row = cursor.fetchone()
        return json_row(row) if row else None
    finally:
        cursor.close()
        connection.close()


def execute(sql, params=()):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(sql, params)
        connection.commit()
        return cursor.rowcount
    finally:
        cursor.close()
        connection.close()
