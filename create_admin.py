# create_admin.py
import os
import django
from django.core.management import execute_from_command_line

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Importar modelos
from django.contrib.auth.models import User

def create_admin():
    """Crear usuario administrador por defecto"""
    username = 'admin'
    email = 'admin@siprosa.com.ar'
    password = 'Admin123456'  # ⚠️ CAMBIA ESTA CONTRASEÑA POR UNA SEGURA

    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f"✅ Usuario administrador creado: {username}")
        print(f"📧 Email: {email}")
        print(f"🔑 Contraseña: {password}")
    else:
        print(f"⚠️ Usuario {username} ya existe")

if __name__ == "__main__":
    create_admin()
