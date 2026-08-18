import sys
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

if __name__ == "__main__":
    from daphne.cli import CommandLineInterface
    sys.exit(CommandLineInterface().run(["-p", "8000", "asgi:application"]))
