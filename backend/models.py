from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import uuid

db = SQLAlchemy()

def gen_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String, primary_key=True, default=gen_uuid)
    email = db.Column(db.String, unique=True, nullable=False)
    username = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    avatar_url = db.Column(db.String, nullable=True)
    status = db.Column(db.String, nullable=True, default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Conversation(db.Model):
    __tablename__ = "conversations"
    id = db.Column(db.String, primary_key=True, default=gen_uuid)
    name = db.Column(db.String, nullable=True)
    is_group = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    members = db.relationship("ConversationMember", backref="conversation", lazy=True)
    messages = db.relationship("Message", backref="conversation", lazy=True)

class ConversationMember(db.Model):
    __tablename__ = "conversation_members"
    id = db.Column(db.String, primary_key=True, default=gen_uuid)
    conversation_id = db.Column(db.String, db.ForeignKey("conversations.id"), nullable=False)
    user_id = db.Column(db.String, db.ForeignKey("users.id"), nullable=False)
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_read_at = db.Column(db.DateTime, nullable=True)

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.String, primary_key=True, default=gen_uuid)
    conversation_id = db.Column(db.String, db.ForeignKey("conversations.id"), nullable=False)
    sender_id = db.Column(db.String, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    toxicity_score = db.Column(db.Float, nullable=True)
    toxicity_label = db.Column(db.String, nullable=True)
    is_flagged = db.Column(db.Boolean, default=False)
    attachment_url = db.Column(db.String, nullable=True)
    attachment_name = db.Column(db.String, nullable=True)
    attachment_type = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    sender = db.relationship("User", foreign_keys=[sender_id])

class PushSubscription(db.Model):
    __tablename__ = "push_subscriptions"
    id = db.Column(db.String, primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String, db.ForeignKey("users.id"), nullable=False)
    endpoint = db.Column(db.Text, nullable=False, unique=True)
    p256dh = db.Column(db.Text, nullable=False)
    auth = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
