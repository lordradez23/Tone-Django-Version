import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


def gen_uuid():
    return str(uuid.uuid4())


class UserManager(BaseUserManager):
    def create_user(self, email, username, password, first_name="", last_name=""):
        user = self.model(
            email=email.lower(),
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password, first_name="", last_name=""):
        user = self.create_user(email, username, password, first_name, last_name)
        user.is_admin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    id = models.CharField(primary_key=True, max_length=36, default=gen_uuid, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150, default="", blank=True)
    last_name = models.CharField(max_length=150, default="", blank=True)
    avatar_url = models.CharField(max_length=500, null=True, blank=True)
    status = models.CharField(max_length=100, default="", blank=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    last_login = None

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    objects = UserManager()

    @property
    def is_staff(self):
        return self.is_admin

    @property
    def is_superuser(self):
        return self.is_admin

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return self.is_admin

    class Meta:
        db_table = "users"


class Conversation(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=gen_uuid, editable=False)
    name = models.CharField(max_length=200, null=True, blank=True)
    is_group = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "conversations"


class ConversationMember(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=gen_uuid, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "conversation_members"


class Message(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=gen_uuid, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="+")
    content = models.TextField()
    toxicity_score = models.FloatField(null=True, blank=True)
    toxicity_label = models.CharField(max_length=20, null=True, blank=True)
    is_flagged = models.BooleanField(default=False)
    attachment_url = models.CharField(max_length=500, null=True, blank=True)
    attachment_name = models.CharField(max_length=255, null=True, blank=True)
    attachment_type = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "messages"


class PushSubscription(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=gen_uuid, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "push_subscriptions"
