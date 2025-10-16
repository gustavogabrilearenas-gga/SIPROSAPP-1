"""
Comando Django para crear superusuario automáticamente si no existe
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Crea un superusuario admin si no existe ninguno'

    def handle(self, *args, **options):
        # Credenciales configurables desde variables de entorno
        username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@siprosa.com.ar')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'Admin123456')
        
        # Verificar si ya existe algún superusuario
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.WARNING('⚠️  Ya existe al menos un superusuario'))
            return
        
        # Crear el superusuario
        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Superusuario creado exitosamente'))
            self.stdout.write(self.style.SUCCESS(f'   Usuario: {username}'))
            self.stdout.write(self.style.SUCCESS(f'   Email: {email}'))
            self.stdout.write(self.style.SUCCESS(f'   Contraseña: {password}'))
            self.stdout.write(self.style.WARNING('   ⚠️  CAMBIA LA CONTRASEÑA INMEDIATAMENTE'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error al crear superusuario: {str(e)}'))
