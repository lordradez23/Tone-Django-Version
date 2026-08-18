from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from tone.models import User
from tone.consumers import online_users, _online_list


@api_view(["GET"])
def search_users(request):
    q = request.query_params.get("q", "").strip()
    if not q:
        return Response([])
    users = User.objects.filter(username__icontains=q).exclude(id=request.user.id)[:10]
    return Response([{"id": u.id, "username": u.username, "avatar_url": u.avatar_url, "status": u.status or ""} for u in users])


@api_view(["GET"])
def get_online_users(request):
    return Response(_online_list())


@api_view(["PUT"])
def update_status(request):
    user = request.user
    status = request.data.get("status", "").strip()[:100]
    user.status = status
    user.save()
    if user.id in online_users:
        online_users[user.id]["status"] = status
        layer = get_channel_layer()
        async_to_sync(layer.group_send)("presence", {"type": "presence.update", "users": _online_list()})
    return Response({"status": status})


from django.urls import path
urlpatterns = [
    path("search", search_users),
    path("online", get_online_users),
    path("status", update_status),
]
