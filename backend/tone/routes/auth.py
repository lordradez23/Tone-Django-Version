import uuid, os
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from tone.models import User


def _user_dict(user):
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "status": user.status or "",
        "created_at": user.created_at.isoformat(),
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    first_name = request.data.get("first_name", "").strip()
    last_name  = request.data.get("last_name", "").strip()
    username   = request.data.get("username", "").strip()
    email      = request.data.get("email", "").strip().lower()
    password   = request.data.get("password", "")

    if not all([first_name, last_name, username, email, password]):
        return Response({"error": "All fields are required"}, status=400)
    if len(password) < 6:
        return Response({"error": "Password must be at least 6 characters"}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=409)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=409)

    user = User.objects.create_user(
        email=email,
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    token = str(RefreshToken.for_user(user).access_token)
    return Response({"token": token, "user": _user_dict(user)}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def signin(request):
    email    = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "")

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Invalid email or password"}, status=401)

    if not user.check_password(password):
        return Response({"error": "Invalid email or password"}, status=401)

    token = str(RefreshToken.for_user(user).access_token)
    return Response({"token": token, "user": _user_dict(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(_user_dict(request.user))


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    new_first   = request.data.get("first_name", "").strip()
    new_last    = request.data.get("last_name", "").strip()
    new_username = request.data.get("username", "").strip()
    new_email   = request.data.get("email", "").strip().lower()
    new_password = request.data.get("password", "").strip()

    if new_first:
        user.first_name = new_first
    if new_last:
        user.last_name = new_last

    if new_username and new_username != user.username:
        if User.objects.filter(username=new_username).exclude(id=user.id).exists():
            return Response({"error": "Username already taken"}, status=409)
        user.username = new_username

    if new_email and new_email != user.email:
        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response({"error": "Email already registered"}, status=409)
        user.email = new_email

    if new_password:
        if len(new_password) < 6:
            return Response({"error": "Password must be at least 6 characters"}, status=400)
        user.set_password(new_password)

    user.save()
    return Response(_user_dict(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_avatar(request):
    user = request.user
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "No file provided"}, status=400)

    allowed = {"png", "jpg", "jpeg", "gif", "webp"}
    ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
    if ext not in allowed:
        return Response({"error": "Invalid file type"}, status=400)

    filename = f"avatar_{user.id}_{uuid.uuid4().hex}.{ext}"
    folder = settings.MEDIA_ROOT
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, filename), "wb") as f:
        for chunk in file.chunks():
            f.write(chunk)

    user.avatar_url = f"/api/uploads/{filename}"
    user.save()
    return Response({"avatar_url": user.avatar_url})


from django.urls import path
urlpatterns = [
    path("signup", signup),
    path("signin", signin),
    path("me", me),
    path("profile", update_profile),
    path("avatar", upload_avatar),
]
