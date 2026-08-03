from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from mysql.connector import Error as MySQLError

from config import Config
from routes.auth import bp as auth_routes
from routes.public import bp as public_routes
from routes.washes import bp as wash_routes
from validators import ValidationError


def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY

    CORS(app)
    JWTManager(app)

    app.register_blueprint(public_routes)
    app.register_blueprint(auth_routes)
    app.register_blueprint(wash_routes)

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

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
