from rest_framework import generics, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.views import APIView
from tone.models import User
from .serializers import UserSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/users/register — create a new user, returns token + user."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = str(RefreshToken.for_user(user).access_token)
        return Response({"token": token, "user": UserSerializer(user).data}, status=201)


class UserListView(generics.ListAPIView):
    """GET /api/users/ — list all users (admin only)."""
    queryset = User.objects.all().order_by("created_at")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/users/<id>/ — retrieve, update or delete a user."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


class MeView(APIView):
    """GET /api/users/me/ — return the authenticated user's full profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
