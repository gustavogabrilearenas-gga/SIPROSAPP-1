#!/usr/bin/env python
"""
Script para crear usuarios de prueba específicos para SIPROSA MES
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from backend.usuarios.models import UserProfile

def create_test_users():
    """Crear usuarios específicos para testing"""
    print("🏭 Creando usuarios de prueba específicos...")

    users_data = [
        {
            'username': 'admin',
            'email': 'admin@siprosa.com.ar',
            'password': 'sand234@',
            'first_name': 'Administrador',
            'last_name': 'Sistema',
            'is_staff': True,
            'is_superuser': True,
        },
        {
            'username': 'operario1',
            'email': 'operario1@siprosa.com.ar',
            'password': 'sand234@',
            'first_name': 'Operario',
            'last_name': 'Uno',
            'is_staff': False,
            'is_superuser': False,
        },
        {
            'username': 'supervisor1',
            'email': 'supervisor1@siprosa.com.ar',
            'password': 'sand234@',
            'first_name': 'Supervisor',
            'last_name': 'Uno',
            'is_staff': False,
            'is_superuser': False,
        },
    ]

    for user_data in users_data:
        username = user_data['username']

        # Crear usuario si no existe
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                is_staff=user_data['is_staff'],
                is_superuser=user_data['is_superuser']
            )

            # Crear perfil de usuario
            profile_data = {
                'legajo': f'EMP-{username.upper()}-001',
                'area': 'PRODUCCION' if 'operario' in username else ('ADMINISTRACION' if 'admin' in username else 'PRODUCCION'),
                'telefono': '+54 381 123-4567',
                'activo': True,
            }

            UserProfile.objects.update_or_create(
                user=user,
                defaults=profile_data
            )

            print(f"✅ Usuario creado: {username}")
            print(f"   📧 Email: {user_data['email']}")
            print(f"   🔑 Contraseña: {user_data['password']}")
            print(f"   👤 Nombre: {user_data['first_name']} {user_data['last_name']}")
            print(f"   🏢 Área: {profile_data['area']}")
            print(f"   📋 Legajo: {profile_data['legajo']}")
            print()
        else:
            # Actualizar contraseña si el usuario ya existe
            user = User.objects.get(username=username)
            user.set_password(user_data['password'])
            user.save()

            # Actualizar perfil
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'legajo': f'EMP-{username.upper()}-001',
                    'area': 'PRODUCCION' if 'operario' in username else ('ADMINISTRACION' if 'admin' in username else 'PRODUCCION'),
                    'telefono': '+54 381 123-4567',
                    'activo': True,
                }
            )

            print(f"✅ Usuario actualizado: {username}")
            print(f"   📧 Email: {user_data['email']}")
            print(f"   🔑 Contraseña: {user_data['password']}")
            print(f"   👤 Nombre: {user_data['first_name']} {user_data['last_name']}")
            print()

if __name__ == '__main__':
    create_test_users()
    print("🎉 ¡Usuarios de prueba creados exitosamente!")
