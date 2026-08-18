import os, json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from tone.models import PushSubscription


@api_view(["GET"])
@permission_classes([AllowAny])
def vapid_public_key(request):
    return Response({"publicKey": os.getenv("VAPID_PUBLIC_KEY", "")})


@api_view(["POST"])
def subscribe(request):
    endpoint = request.data.get("endpoint")
    keys = request.data.get("keys", {})
    p256dh = keys.get("p256dh")
    auth = keys.get("auth")
    if not endpoint or not p256dh or not auth:
        return Response({"error": "Invalid subscription"}, status=400)

    sub, _ = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={"user": request.user, "p256dh": p256dh, "auth": auth},
    )
    return Response({"ok": True}, status=201)


@api_view(["DELETE"])
def unsubscribe(request):
    endpoint = request.data.get("endpoint")
    PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    return Response({"ok": True})


def send_push_to_user(user_id, title, body, tag=""):
    from pywebpush import webpush, WebPushException
    subs = PushSubscription.objects.filter(user_id=user_id)
    private_key = os.getenv("VAPID_PRIVATE_KEY", "")
    claims = {"sub": os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@tone.app")}
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
                dead.append(sub.id)
    if dead:
        PushSubscription.objects.filter(id__in=dead).delete()


from django.urls import path
urlpatterns = [
    path("push/vapid-public-key", vapid_public_key),
    path("push/subscribe", subscribe),
    path("push/unsubscribe", unsubscribe),
]
