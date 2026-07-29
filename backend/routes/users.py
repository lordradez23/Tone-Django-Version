from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User
from app import socketio

users_bp = Blueprint("users", __name__)

# In-memory online users: { user_id: username }
online_users: dict[str, str] = {}

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
        {"id": u.id, "username": u.username, "avatar_url": u.avatar_url}
        for u in users
    ])

@users_bp.get("/online")
@jwt_required()
def get_online_users():
    return jsonify([
        {"id": uid, "username": uname}
        for uid, uname in online_users.items()
    ])
