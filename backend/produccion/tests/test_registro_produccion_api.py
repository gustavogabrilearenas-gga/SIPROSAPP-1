from datetime import timedelta

from django.apps import apps
from django.conf import settings
from django.urls import reverse
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from backend.catalogos.models import (
    EtapaProduccion,
    Formula,
    FormulaEtapa,
    Maquina,
    Producto,
    Turno,
    Ubicacion,
)

UserModel = apps.get_model(settings.AUTH_USER_MODEL)


class RegistroProduccionApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = UserModel.objects.create_user("operario", password="pass1234")

        self.ubicacion = Ubicacion.objects.create(
            codigo="PLT-TEST",
            nombre="Planta Test",
            descripcion="",
        )
        self.producto = Producto.objects.create(
            codigo="PRD-100",
            nombre="Producto Demo",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="500mg",
            descripcion="",
        )
        self.maquina = Maquina.objects.create(
            codigo="M-100",
            nombre="Mezcladora",
            tipo="MEZCLADO",
            ubicacion=self.ubicacion,
            descripcion="",
        )
        self.turno = Turno.objects.create(
            codigo="M",
            nombre="Mañana",
            hora_inicio="06:00:00",
            hora_fin="14:00:00",
        )
        self.etapa = EtapaProduccion.objects.create(
            codigo="ETP-100",
            nombre="Mezclado",
            descripcion="",
        )
        self.formula = Formula.objects.create(
            codigo="FOR-100",
            version="1.0",
            producto=self.producto,
            descripcion="",
            activa=True,
        )
        FormulaEtapa.objects.create(
            formula=self.formula,
            etapa=self.etapa,
            orden=1,
            descripcion="Mezclar",
        )

        login_response = self.client.post(
            reverse("login"),
            {"username": "operario", "password": "pass1234"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 200)
        token = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_crear_registro_produccion(self):
        url = reverse("registroduccion-list")
        inicio = timezone.now()
        fin = inicio + timedelta(hours=2)
        payload = {
            "producto": self.producto.id,
            "formula": self.formula.id,
            "maquina": self.maquina.id,
            "turno": self.turno.id,
            "hora_inicio": inicio.isoformat(),
            "hora_fin": fin.isoformat(),
            "cantidad_producida": "100.00",
            "unidad_medida": "kg",
            "observaciones": "Lote piloto",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        data = response.json()
        self.assertEqual(data["producto"], self.producto.id)
        self.assertEqual(data["estado"], "CREADO")
        self.assertEqual(data["registrado_por"], self.usuario.id)

    def test_formula_debe_corresponder_producto(self):
        otro_producto = Producto.objects.create(
            codigo="PRD-200",
            nombre="Otro",
            tipo="CAPSULA",
            presentacion="FRASCO",
            concentracion="200mg",
            descripcion="",
        )
        url = reverse("registroduccion-list")
        inicio = timezone.now()
        fin = inicio + timedelta(hours=1)
        payload = {
            "producto": otro_producto.id,
            "formula": self.formula.id,
            "hora_inicio": inicio.isoformat(),
            "hora_fin": fin.isoformat(),
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("formula", response.json())
