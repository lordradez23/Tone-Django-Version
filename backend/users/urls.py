from django.urls import path
from .views import RegisterView, UserListView, UserDetailView, MeView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("me/", MeView.as_view()),
    path("", UserListView.as_view()),
    path("<str:id>/", UserDetailView.as_view()),
]
