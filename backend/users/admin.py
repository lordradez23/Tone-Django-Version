from django.contrib import admin
from .models import UserProxy


@admin.register(UserProxy)
class UserAdmin(admin.ModelAdmin):
    list_display = ["username", "email", "first_name", "last_name", "is_admin", "created_at"]
    list_filter = ["is_admin"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "password"]
    fieldsets = [
        ("Identity", {"fields": ["id", "first_name", "last_name", "username", "email"]}),
        ("Security", {"fields": ["password"]}),
        ("Profile", {"fields": ["avatar_url", "status"]}),
        ("Permissions", {"fields": ["is_admin"]}),
        ("Metadata", {"fields": ["created_at"]}),
    ]

    def save_model(self, request, obj, form, change):
        # If password was changed in admin, hash it
        raw = form.cleaned_data.get("password")
        if raw and not raw.startswith("pbkdf2_"):
            obj.set_password(raw)
        super().save_model(request, obj, form, change)
