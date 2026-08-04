from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, PushSubscription
import json, os

push_bp = Blueprint("push", __name__)

def get_vapid_claims():
    return {"sub": os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@tone.app")}

@push_bp.get("/push/vapid-public-key")
def vapid_public_key():
    return jsonify({"publicKey": os.getenv("VAPID_PUBLIC_KEY", "")})

@push_bp.post("/push/subscribe")
@jwt_required()
def subscribe():
    user_id = get_jwt_identity()
    data = request.json
    endpoint = data.get("endpoint")
    keys = data.get("keys", {})
    p256dh = keys.get("p256dh")
    auth = keys.get("auth")
    if not endpoint or not p256dh or not auth:
        return jsonify({"error": "Invalid subscription"}), 400
    sub = PushSubscription.query.filter_by(endpoint=endpoint).first()
    if sub:
        sub.user_id = user_id
        sub.p256dh = p256dh
        sub.auth = auth
    else:
        sub = PushSubscription(user_id=user_id, endpoint=endpoint, p256dh=p256dh, auth=auth)
        db.session.add(sub)
    db.session.commit()
    return jsonify({"ok": True}), 201

@push_bp.delete("/push/unsubscribe")
@jwt_required()
def unsubscribe():
    user_id = get_jwt_identity()
    endpoint = request.json.get("endpoint")
    PushSubscription.query.filter_by(user_id=user_id, endpoint=endpoint).delete()
    db.session.commit()
    return jsonify({"ok": True})

def send_push_to_user(user_id: str, title: str, body: str, tag: str = ""):
    from pywebpush import webpush, WebPushException
    subs = PushSubscription.query.filter_by(user_id=user_id).all()
    private_key = os.getenv("VAPID_PRIVATE_KEY", "")
    claims = get_vapid_claims()
    payload = json.dumps({"title": title, "body": body, "tag": tag})
    dead = []
    for sub in subs:
        try:
            webpush(
                subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
                data=payload,
                vapid_private_key=private_key,
                vapid_claims=claims,
            )
        except WebPushException as e:
            if e.response and e.response.status_code in (404, 410):
                dead.append(sub)
    for sub in dead:
        db.session.delete(sub)
    if dead:
        db.session.commit()
