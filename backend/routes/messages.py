from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Message, ConversationMember, Conversation, User
from app import socketio
from datetime import datetime, timezone

msg_bp = Blueprint("messages", __name__)

def msg_to_dict(msg):
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "toxicity_score": msg.toxicity_score,
        "toxicity_label": msg.toxicity_label,
        "is_flagged": msg.is_flagged,
        "attachment_url": msg.attachment_url,
        "attachment_name": msg.attachment_name,
        "attachment_type": msg.attachment_type,
        "created_at": msg.created_at.isoformat(),
        "sender_profile": {
            "username": msg.sender.username,
            "avatar_url": msg.sender.avatar_url,
        } if msg.sender else None,
    }

@msg_bp.get("/conversation/<conv_id>")
@jwt_required()
def get_messages(conv_id):
    user_id = get_jwt_identity()
    member = ConversationMember.query.filter_by(conversation_id=conv_id, user_id=user_id).first()
    if not member:
        return jsonify({"error": "Forbidden"}), 403
    msgs = Message.query.filter_by(conversation_id=conv_id).order_by(Message.created_at.asc()).all()
    return jsonify([msg_to_dict(m) for m in msgs])

@msg_bp.post("/conversation/<conv_id>")
@jwt_required()
def send_message(conv_id):
    user_id = get_jwt_identity()
    member = ConversationMember.query.filter_by(conversation_id=conv_id, user_id=user_id).first()
    if not member:
        return jsonify({"error": "Forbidden"}), 403

    data = request.json
    msg = Message(
        conversation_id=conv_id,
        sender_id=user_id,
        content=data.get("content", ""),
        toxicity_score=data.get("toxicity_score"),
        toxicity_label=data.get("toxicity_label", "safe"),
        is_flagged=data.get("is_flagged", False),
        attachment_url=data.get("attachment_url"),
        attachment_name=data.get("attachment_name"),
        attachment_type=data.get("attachment_type"),
    )
    db.session.add(msg)

    conv = Conversation.query.get(conv_id)
    conv.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    payload = msg_to_dict(msg)
    socketio.emit("new_message", payload, room=conv_id)
    return jsonify(payload), 201

@msg_bp.put("/<msg_id>")
@jwt_required()
def edit_message(msg_id):
    user_id = get_jwt_identity()
    msg = Message.query.get_or_404(msg_id)
    if msg.sender_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    msg.content = request.json.get("content", msg.content)
    db.session.commit()
    payload = msg_to_dict(msg)
    socketio.emit("message_updated", payload, room=msg.conversation_id)
    return jsonify(payload)

@msg_bp.delete("/<msg_id>")
@jwt_required()
def delete_message(msg_id):
    user_id = get_jwt_identity()
    msg = Message.query.get_or_404(msg_id)
    if msg.sender_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    conv_id = msg.conversation_id
    db.session.delete(msg)
    db.session.commit()
    socketio.emit("message_deleted", {"id": msg_id}, room=conv_id)
    return jsonify({"ok": True})

@msg_bp.get("/search")
@jwt_required()
def search_messages():
    user_id = get_jwt_identity()
    query = request.args.get("q", "").strip()
    conv_id = request.args.get("conversation_id")
    if not query:
        return jsonify([])

    q = Message.query.filter(Message.content.ilike(f"%{query}%"))
    if conv_id:
        q = q.filter_by(conversation_id=conv_id)
    else:
        # Only search conversations the user is a member of
        member_conv_ids = [
            m.conversation_id for m in ConversationMember.query.filter_by(user_id=user_id).all()
        ]
        q = q.filter(Message.conversation_id.in_(member_conv_ids))

    results = q.order_by(Message.created_at.desc()).limit(50).all()
    return jsonify([msg_to_dict(m) for m in results])
