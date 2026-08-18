from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from tone.models import Conversation, ConversationMember, Message, User


def _conv_dict(conv, user_id):
    last_msg = conv.messages.order_by("-created_at").first()
    membership = conv.members.filter(user_id=user_id).first()
    has_unread = bool(
        last_msg and membership and membership.last_read_at
        and last_msg.created_at > membership.last_read_at
    )
    other_user = None
    if not conv.is_group:
        other_member = conv.members.exclude(user_id=user_id).first()
        if other_member:
            u = other_member.user
            other_user = {"id": u.id, "username": u.username, "avatar_url": u.avatar_url}
    return {
        "id": conv.id,
        "name": conv.name,
        "is_group": conv.is_group,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
        "last_message": last_msg.content if last_msg else None,
        "last_message_at": last_msg.created_at.isoformat() if last_msg else None,
        "has_unread": has_unread,
        "other_user": other_user,
    }


@api_view(["GET", "POST"])
def conversations(request):
    user_id = request.user.id

    if request.method == "GET":
        conv_ids = ConversationMember.objects.filter(user_id=user_id).values_list("conversation_id", flat=True)
        convs = Conversation.objects.filter(id__in=conv_ids).order_by("-updated_at")
        return Response([_conv_dict(c, user_id) for c in convs])

    # POST
    is_group = request.data.get("is_group", False)
    member_ids = request.data.get("member_ids", [])
    name = request.data.get("name")

    if not is_group and len(member_ids) == 1:
        other_id = member_ids[0]
        my_ids = set(ConversationMember.objects.filter(user_id=user_id).values_list("conversation_id", flat=True))
        other_ids = set(ConversationMember.objects.filter(user_id=other_id).values_list("conversation_id", flat=True))
        for cid in my_ids & other_ids:
            c = Conversation.objects.filter(id=cid, is_group=False).first()
            if c:
                return Response(_conv_dict(c, user_id))

    conv = Conversation.objects.create(is_group=is_group, name=name, created_by=request.user)
    all_members = list({user_id} | set(member_ids))
    ConversationMember.objects.bulk_create([
        ConversationMember(conversation=conv, user_id=uid) for uid in all_members
    ])
    return Response(_conv_dict(conv, user_id), status=201)


@api_view(["POST"])
def mark_read(request, conv_id):
    m = ConversationMember.objects.filter(conversation_id=conv_id, user_id=request.user.id).first()
    if m:
        m.last_read_at = timezone.now()
        m.save()
    return Response({"ok": True})


from django.urls import path
urlpatterns = [
    path("", conversations),
    path("<str:conv_id>/read", mark_read),
]
