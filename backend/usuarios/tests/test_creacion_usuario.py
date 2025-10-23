"""Pruebas para la creación de usuarios."""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.apps import apps
from rest_framework import status
from rest_framework.test import APITestCase

from backend.usuarios.models import UserProfile

Funcion = apps.get_model("catalogos", "Funcion")
Turno = apps.get_model("catalogos", "Turno")


class CrearUsuarioAPITestCase(APITestCase):
    """Verifica que la creación de usuarios admin funcione correctamente."""

    def setUp(self):
        self.admin = get_user_model().objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass",
        )
        self.client.force_authenticate(user=self.admin)

        self.funcion = Funcion.objects.create(codigo="F001", nombre="Operario", activa=True)
        self.turno = Turno.objects.create(
            codigo="M",
            nombre="Mañana",
            hora_inicio="08:00:00",
            hora_fin="16:00:00",
            activo=True,
        )

    def test_crear_usuario_actualiza_perfil_existente(self):
        """El serializer debe actualizar el perfil creado por la señal post_save."""

        url = reverse("usuario-list")
        payload = {
            "username": "nuevo.usuario",
            "email": "nuevo.usuario@example.com",
            "first_name": "Nuevo",
            "last_name": "Usuario",
            "password": "unasegura",
            "password_confirmacion": "unasegura",
            "is_staff": False,
            "is_superuser": False,
            "legajo": "LEG123",
            "dni": "12345678",
            "funcion_id": self.funcion.id,
            "turno_id": self.turno.id,
            "telefono": "+54 9 381 123456",
            "fecha_ingreso": "2024-01-15",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        user = get_user_model().objects.get(username=payload["username"])
        profile = user.user_profile

        self.assertEqual(profile.legajo, payload["legajo"])
        self.assertEqual(profile.dni, payload["dni"])
        self.assertEqual(profile.funcion_id, self.funcion.id)
        self.assertEqual(profile.turno_habitual_id, self.turno.id)
        self.assertEqual(profile.telefono, payload["telefono"])
        self.assertEqual(str(profile.fecha_ingreso), payload["fecha_ingreso"])
        self.assertEqual(UserProfile.objects.filter(user=user).count(), 1)
