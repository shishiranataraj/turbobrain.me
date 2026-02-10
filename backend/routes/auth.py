from functools import wraps
from flask import Blueprint, request, jsonify, session, current_app

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("authenticated"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("password"):
        return jsonify({"error": "Password required"}), 400

    if data["password"] == current_app.config["ADMIN_PASSWORD"]:
        session["authenticated"] = True
        return jsonify({"message": "Logged in"})

    return jsonify({"error": "Invalid password"}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@auth_bp.route("/check", methods=["GET"])
def check():
    return jsonify({"authenticated": bool(session.get("authenticated"))})
