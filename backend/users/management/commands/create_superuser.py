from django.core.management.base import BaseCommand
from tone.models import User


class Command(BaseCommand):
    help = "Create a superuser non-interactively"

    def add_arguments(self, parser):
        parser.add_argument("--email", default="lordradez362@gmail.com")
        parser.add_argument("--username", default="admin")
        parser.add_argument("--first_name", default="Lord")
        parser.add_argument("--last_name", default="Radez")
        parser.add_argument("--password", default="Admin@1234")

    def handle(self, *args, **options):
        email = options["email"]
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"Superuser {email} already exists."))
            return
        User.objects.create_superuser(
            email=email,
            username=options["username"],
            password=options["password"],
            first_name=options["first_name"],
            last_name=options["last_name"],
        )
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} created successfully."))
