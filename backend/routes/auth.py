from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
import bcrypt

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/signup")
def signup():
    data = request.json
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    username = data.get("username", "").strip()

    if not email or not password or not username:
        return jsonify({"error": "All fields are required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(email=email, username=username, password_hash=hashed)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({"token": token, "user": {"id": user.id, "email": user.email, "username": user.username, "avatar_url": user.avatar_url, "status": user.status or "", "created_at": user.created_at.isoformat()}}), 201

@auth_bp.post("/signin")
def signin():
    data = request.json
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=user.id)
    return jsonify({"token": token, "user": {"id": user.id, "email": user.email, "username": user.username, "avatar_url": user.avatar_url, "status": user.status or "", "created_at": user.created_at.isoformat()}}), 200

@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"id": user.id, "email": user.email, "username": user.username, "avatar_url": user.avatar_url, "status": user.status or "", "created_at": user.created_at.isoformat()})

@auth_bp.put("/profile")
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    new_username = data.get("username", "").strip()
    new_email = data.get("email", "").strip().lower()
    new_password = data.get("password", "").strip()

    if new_username and new_username != user.username:
        if User.query.filter(User.username == new_username, User.id != user_id).first():
            return jsonify({"error": "Username already taken"}), 409
        user.username = new_username

    if new_email and new_email != user.email:
        if User.query.filter(User.email == new_email, User.id != user_id).first():
            return jsonify({"error": "Email already registered"}), 409
        user.email = new_email

    if new_password:
        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

    db.session.commit()
    return jsonify({"id": user.id, "email": user.email, "username": user.username, "avatar_url": user.avatar_url, "status": user.status or "", "created_at": user.created_at.isoformat()})

@auth_bp.post("/avatar")
@jwt_required()
def upload_avatar():
    from flask import current_app
    import os, uuid

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    allowed = {"png", "jpg", "jpeg", "gif", "webp"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        return jsonify({"error": "Invalid file type"}), 400

    filename = f"avatar_{user_id}_{uuid.uuid4().hex}.{ext}"
    folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(folder, exist_ok=True)
    file.save(os.path.join(folder, filename))

    user.avatar_url = f"/api/uploads/{filename}"
    db.session.commit()
    return jsonify({"avatar_url": user.avatar_url})
