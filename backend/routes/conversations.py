from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Conversation, ConversationMember, Message, User
from datetime import datetime, timezone

conv_bp = Blueprint("conversations", __name__)

def conv_to_dict(conv, user_id):
    last_msg = (
        Message.query.filter_by(conversation_id=conv.id)
        .order_by(Message.created_at.desc())
        .first()
    )
    membership = ConversationMember.query.filter_by(
        conversation_id=conv.id, user_id=user_id
    ).first()
    has_unread = (
        last_msg and membership and membership.last_read_at
        and last_msg.created_at > membership.last_read_at
    )
    other_user = None
    if not conv.is_group:
        other_member = ConversationMember.query.filter(
            ConversationMember.conversation_id == conv.id,
            ConversationMember.user_id != user_id
        ).first()
        if other_member:
            u = User.query.get(other_member.user_id)
            if u:
                other_user = {"id": u.id, "username": u.username, "avatar_url": u.avatar_url}
    return {
        "id": conv.id,
        "name": conv.name,
        "is_group": conv.is_group,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
        "last_message": last_msg.content if last_msg else None,
        "last_message_at": last_msg.created_at.isoformat() if last_msg else None,
        "has_unread": bool(has_unread),
        "other_user": other_user,
    }

@conv_bp.get("")
@jwt_required()
def list_conversations():
    user_id = get_jwt_identity()
    memberships = ConversationMember.query.filter_by(user_id=user_id).all()
    conv_ids = [m.conversation_id for m in memberships]
    convs = (
        Conversation.query.filter(Conversation.id.in_(conv_ids))
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return jsonify([conv_to_dict(c, user_id) for c in convs])

@conv_bp.post("")
@jwt_required()
def create_conversation():
    user_id = get_jwt_identity()
    data = request.json
    is_group = data.get("is_group", False)
    member_ids = data.get("member_ids", [])
    name = data.get("name")

    if not is_group and len(member_ids) == 1:
        other_id = member_ids[0]
        # Check if DM already exists
        my_convs = {m.conversation_id for m in ConversationMember.query.filter_by(user_id=user_id).all()}
        other_convs = {m.conversation_id for m in ConversationMember.query.filter_by(user_id=other_id).all()}
        shared = my_convs & other_convs
        for cid in shared:
            c = Conversation.query.get(cid)
            if c and not c.is_group:
                return jsonify(conv_to_dict(c, user_id)), 200

    conv = Conversation(is_group=is_group, name=name, created_by=user_id)
    db.session.add(conv)
    db.session.flush()

    all_members = list({user_id} | set(member_ids))
    for uid in all_members:
        db.session.add(ConversationMember(conversation_id=conv.id, user_id=uid))

    db.session.commit()
    return jsonify(conv_to_dict(conv, user_id)), 201

@conv_bp.post("/<conv_id>/read")
@jwt_required()
def mark_read(conv_id):
    user_id = get_jwt_identity()
    m = ConversationMember.query.filter_by(conversation_id=conv_id, user_id=user_id).first()
    if m:
        m.last_read_at = datetime.now(timezone.utc)
        db.session.commit()
    return jsonify({"ok": True})
