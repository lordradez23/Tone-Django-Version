from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("tone.routes.auth")),
    path("api/conversations/", include("tone.routes.conversations")),
    path("api/messages/", include("tone.routes.messages")),
    path("api/users/", include("tone.routes.users")),
    path("api/users/", include("users.urls")),
    path("api/", include("tone.routes.analyze")),
    path("api/", include("tone.routes.upload")),
    path("api/", include("tone.routes.push")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
