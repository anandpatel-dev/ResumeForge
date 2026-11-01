import os
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from dotenv import load_dotenv
from datetime import timedelta
from models import db, User  # tumhare models.py me User model hona chahiye

load_dotenv()

auth_bp = Blueprint("auth", __name__)

# ---------- SIGNUP ----------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not full_name or not email or not password:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email already registered"}), 400

    hashed_pw = generate_password_hash(password)

    new_user = User(full_name=full_name, email=email, password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    token = create_access_token(identity=new_user.id, expires_delta=timedelta(days=7))

    return jsonify({
        "success": True,
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email
        }
    }), 201

# ---------- LOGIN ----------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    token = create_access_token(identity=user.id, expires_delta=timedelta(days=7))

    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email
        }
    }), 200
