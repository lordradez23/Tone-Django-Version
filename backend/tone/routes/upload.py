import os, uuid
from django.conf import settings
from django.http import FileResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "pdf", "doc", "docx", "txt"}


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_file(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "No file provided"}, status=400)

    ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
    if ext not in ALLOWED_EXTENSIONS:
        return Response({"error": "File type not allowed"}, status=400)

    filename = f"{request.user.id}_{uuid.uuid4().hex}.{ext}"
    folder = settings.MEDIA_ROOT
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, filename), "wb") as f:
        for chunk in file.chunks():
            f.write(chunk)

    return Response({"url": f"/api/uploads/{filename}", "name": file.name, "type": file.content_type}, status=201)


def serve_file(request, filename):
    folder = settings.MEDIA_ROOT
    return FileResponse(open(os.path.join(folder, filename), "rb"))


from django.urls import path
urlpatterns = [
    path("upload", upload_file),
    path("uploads/<str:filename>", serve_file),
]
