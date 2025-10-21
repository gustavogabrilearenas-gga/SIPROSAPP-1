from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from backend.catalogos.models import Formula, Maquina, Producto, Ubicacion
from backend.produccion.models import RegistroProduccion


class RegistroProduccionAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="operario", email="op@example.com", password="seguro123"
        )
        self.client.force_authenticate(user=self.user)

        self.producto = Producto.objects.create(
            codigo="P001",
            nombre="Comprimidos A",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="500mg",
            descripcion="",
        )
        self.maquina = Maquina.objects.create(
            codigo="M001",
            nombre="Prensa 1",
            tipo="COMPRESION",
            fabricante="",
            modelo="",
            numero_serie="",
            ubicacion=self.ubicacion,
            descripcion="",
            activa=True,
        )
        self.formula = Formula.objects.create(
            codigo="F001",
            version="1",
            producto=self.producto,
            descripcion="",
        )

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.ubicacion = cls._crear_ubicacion()

    @classmethod
    def _crear_ubicacion(cls):
        return Ubicacion.objects.create(codigo="U001", nombre="Sala 1")

    def test_crear_registro(self):
        url = reverse("registro-produccion-list")
        payload = {
            "hora_inicio": (timezone.now() - timedelta(hours=2)).isoformat(),
            "hora_fin": timezone.now().isoformat(),
            "producto": self.producto.id,
            "maquina": self.maquina.id,
            "formula": self.formula.id,
            "cantidad_producida": "1500.00",
            "unidad_medida": "COMPRIMIDOS",
            "observaciones": "Lote sin desvíos.",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["producto"], self.producto.id)
        self.assertEqual(data["maquina"], self.maquina.id)
        self.assertEqual(data["formula"], self.formula.id)
        self.assertEqual(data["unidad_medida"], "COMPRIMIDOS")

        registro = RegistroProduccion.objects.get(id=data["id"])
        self.assertEqual(registro.cantidad_producida, Decimal("1500.00"))

    def test_valida_formula_correspondiente(self):
        otro_producto = Producto.objects.create(
            codigo="P002",
            nombre="Jarabe B",
            tipo="JARABE",
            presentacion="FRASCO",
            concentracion="250ml",
        )
        formula_invalida = Formula.objects.create(
            codigo="F002",
            version="1",
            producto=otro_producto,
        )
        url = reverse("registro-produccion-list")
        payload = {
            "hora_inicio": (timezone.now() - timedelta(hours=1)).isoformat(),
            "hora_fin": timezone.now().isoformat(),
            "producto": self.producto.id,
            "maquina": self.maquina.id,
            "formula": formula_invalida.id,
            "cantidad_producida": "500.00",
            "unidad_medida": "COMPRIMIDOS",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("formula", response.json())

    def test_listado(self):
        RegistroProduccion.objects.create(
            hora_inicio=timezone.now() - timedelta(hours=4),
            hora_fin=timezone.now() - timedelta(hours=3),
            producto=self.producto,
            maquina=self.maquina,
            formula=self.formula,
            cantidad_producida=Decimal("1000.00"),
            unidad_medida="COMPRIMIDOS",
        )
        RegistroProduccion.objects.create(
            hora_inicio=timezone.now() - timedelta(hours=2),
            hora_fin=timezone.now() - timedelta(hours=1),
            producto=self.producto,
            maquina=self.maquina,
            formula=self.formula,
            cantidad_producida=Decimal("1200.00"),
            unidad_medida="COMPRIMIDOS",
        )

        url = reverse("registro-produccion-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("results", payload)
        self.assertEqual(payload["count"], 2)
        self.assertGreaterEqual(payload["results"][0]["hora_inicio"], payload["results"][1]["hora_inicio"])
