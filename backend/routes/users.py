from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from app import socketio

users_bp = Blueprint("users", __name__)

# In-memory online users: { user_id: {username, status} }
online_users: dict[str, dict] = {}

@users_bp.get("/search")
@jwt_required()
def search_users():
    user_id = get_jwt_identity()
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    users = (
        User.query.filter(User.username.ilike(f"%{q}%"), User.id != user_id)
        .limit(10)
        .all()
    )
    return jsonify([
        {"id": u.id, "username": u.username, "avatar_url": u.avatar_url, "status": u.status or ""}
        for u in users
    ])

@users_bp.get("/online")
@jwt_required()
def get_online_users():
    return jsonify([
        {"id": uid, "username": info["username"], "status": info.get("status", "")}
        for uid, info in online_users.items()
    ])

@users_bp.put("/status")
@jwt_required()
def update_status():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    status = request.json.get("status", "").strip()[:100]
    user.status = status
    db.session.commit()
    if user_id in online_users:
        online_users[user_id]["status"] = status
        socketio.emit("online_users", [
            {"id": uid, "username": info["username"], "status": info.get("status", "")}
            for uid, info in online_users.items()
        ])
    return jsonify({"status": status})
