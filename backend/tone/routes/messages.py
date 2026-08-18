from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from tone.models import Message, ConversationMember, Conversation


def _msg_dict(msg):
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
        } if msg.sender_id else None,
    }


def _emit(room, event_type, data):
    layer = get_channel_layer()
    async_to_sync(layer.group_send)(f"conv_{room}", {"type": event_type, "data": data})


@api_view(["GET", "POST"])
def conversation_messages(request, conv_id):
    user_id = request.user.id
    if not ConversationMember.objects.filter(conversation_id=conv_id, user_id=user_id).exists():
        return Response({"error": "Forbidden"}, status=403)

    if request.method == "GET":
        msgs = Message.objects.filter(conversation_id=conv_id).select_related("sender").order_by("created_at")
        return Response([_msg_dict(m) for m in msgs])

    # POST
    msg = Message.objects.create(
        conversation_id=conv_id,
        sender=request.user,
        content=request.data.get("content", ""),
        toxicity_score=request.data.get("toxicity_score"),
        toxicity_label=request.data.get("toxicity_label", "safe"),
        is_flagged=request.data.get("is_flagged", False),
        attachment_url=request.data.get("attachment_url"),
        attachment_name=request.data.get("attachment_name"),
        attachment_type=request.data.get("attachment_type"),
    )
    Conversation.objects.filter(id=conv_id).update(updated_at=timezone.now())
    payload = _msg_dict(msg)
    _emit(conv_id, "chat.message", payload)
    return Response(payload, status=201)


@api_view(["PUT", "DELETE"])
def message_detail(request, msg_id):
    try:
        msg = Message.objects.select_related("sender").get(id=msg_id)
    except Message.DoesNotExist:
        return Response(status=404)
    if msg.sender_id != request.user.id:
        return Response({"error": "Forbidden"}, status=403)

    if request.method == "PUT":
        msg.content = request.data.get("content", msg.content)
        msg.save()
        payload = _msg_dict(msg)
        _emit(msg.conversation_id, "chat.message_updated", payload)
        return Response(payload)

    conv_id = msg.conversation_id
    msg.delete()
    _emit(conv_id, "chat.message_deleted", {"id": msg_id})
    return Response({"ok": True})


@api_view(["GET"])
def search_messages(request):
    user_id = request.user.id
    query = request.query_params.get("q", "").strip()
    conv_id = request.query_params.get("conversation_id")
    if not query:
        return Response([])

    qs = Message.objects.filter(content__icontains=query).select_related("sender")
    if conv_id:
        qs = qs.filter(conversation_id=conv_id)
    else:
        member_conv_ids = ConversationMember.objects.filter(user_id=user_id).values_list("conversation_id", flat=True)
        qs = qs.filter(conversation_id__in=member_conv_ids)

    return Response([_msg_dict(m) for m in qs.order_by("-created_at")[:50]])


from django.urls import path
urlpatterns = [
    path("search", search_messages),
    path("conversation/<str:conv_id>", conversation_messages),
    path("<str:msg_id>", message_detail),
]
