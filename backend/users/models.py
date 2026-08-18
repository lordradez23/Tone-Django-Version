from tone.models import User

# Proxy so the users app has its own admin section without a second table
class UserProxy(User):
    class Meta:
        proxy = True
        app_label = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
