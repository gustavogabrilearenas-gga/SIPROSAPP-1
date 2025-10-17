"""Comando Django para crear superusuario automáticamente si no existe."""

import os
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    """Crear un superusuario inicial tomando credenciales desde el entorno."""

    help = "Crea un superusuario admin si no existe ninguno"

    def handle(self, *args, **options):
        # Credenciales configurables desde variables de entorno
        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        missing = [
            nombre
            for nombre, valor in (
                ("DJANGO_SUPERUSER_USERNAME", username),
                ("DJANGO_SUPERUSER_EMAIL", email),
                ("DJANGO_SUPERUSER_PASSWORD", password),
            )
            if not valor
        ]

        if missing:
            raise CommandError(
                "Variables de entorno faltantes para crear el superusuario: "
                + ", ".join(missing)
            )

        # Verificar si ya existe algún superusuario
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(
                self.style.WARNING("⚠️  Ya existe al menos un superusuario")
            )
            return

        # Crear el superusuario
        try:
            User.objects.create_superuser(
                username=username, email=email, password=password
            )
            self.stdout.write(
                self.style.SUCCESS("✅ Superusuario creado exitosamente")
            )
            self.stdout.write(self.style.SUCCESS(f"   Usuario: {username}"))
            self.stdout.write(self.style.SUCCESS(f"   Email: {email}"))
            self.stdout.write(
                self.style.SUCCESS("   Credenciales obtenidas desde el entorno")
            )
            self.stdout.write(
                self.style.WARNING("   ⚠️  CAMBIA LA CONTRASEÑA INMEDIATAMENTE")
            )
        except Exception as exc:
            raise CommandError(f"❌ Error al crear superusuario: {exc}")
