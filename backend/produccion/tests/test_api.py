from datetime import datetime, timedelta
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
            username="productor", email="prod@example.com", password="segura123"
        )
        self.client.force_authenticate(self.user)

        self.ubicacion = Ubicacion.objects.create(codigo="ARE1", nombre="Área 1")
        self.maquina = Maquina.objects.create(
            codigo="M-01",
            nombre="Mezcladora",
            tipo=Maquina.TIPO_CHOICES[0][0],
            ubicacion=self.ubicacion,
        )
        self.producto = Producto.objects.create(
            codigo="P-01",
            nombre="Analgesico",
            tipo=Producto.TIPO_CHOICES[0][0],
            presentacion=Producto.PRESENTACION_CHOICES[0][0],
            concentracion="500mg",
        )
        self.formula = Formula.objects.create(
            codigo="F-01",
            version="1.0.0",
            producto=self.producto,
        )
        self.list_url = reverse("registro-produccion-list")

    def _registro_payload(self, **overrides):
        inicio = timezone.now()
        fin = inicio + timedelta(hours=2)
        payload = {
            "maquina": self.maquina.id,
            "producto": self.producto.id,
            "formula": self.formula.id,
            "unidad_medida": RegistroProduccion.UnidadMedida.KG,
            "cantidad_producida": "120.500",
            "hora_inicio": inicio.isoformat(),
            "hora_fin": fin.isoformat(),
            "observaciones": "Turno sin incidencias",
        }
        payload.update(overrides)
        return payload

    def test_creacion_registro_autocompleta_usuario_y_timestamp(self):
        payload = self._registro_payload()
        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["registrado_por"], self.user.id)
        self.assertIn("registrado_en", data)
        self.assertIsNotNone(data["registrado_en"])
        self.assertEqual(
            data["fecha_produccion"],
            timezone.localtime(self._parse_datetime(data["hora_inicio"])).date().isoformat(),
        )

        registro = RegistroProduccion.objects.get(id=data["id"])
        self.assertEqual(registro.registrado_por, self.user)
        self.assertIsNotNone(registro.registrado_en)

    def test_rechaza_cantidad_no_positiva(self):
        payload = self._registro_payload(cantidad_producida="0")
        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("cantidad_producida", response.json())

    def test_rechaza_hora_fin_antes_que_inicio(self):
        inicio = timezone.now()
        fin = inicio - timedelta(minutes=10)
        payload = self._registro_payload(
            hora_inicio=inicio.isoformat(), hora_fin=fin.isoformat()
        )
        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("hora_fin", response.json())

    def test_filtra_por_fecha_maquina_producto(self):
        otro_producto = Producto.objects.create(
            codigo="P-02",
            nombre="Jarabe",
            tipo=Producto.TIPO_CHOICES[1][0],
            presentacion=Producto.PRESENTACION_CHOICES[1][0],
            concentracion="250mg",
        )
        otra_formula = Formula.objects.create(
            codigo="F-02",
            version="1.0.0",
            producto=otro_producto,
        )
        otra_maquina = Maquina.objects.create(
            codigo="M-02",
            nombre="Encapsuladora",
            tipo=Maquina.TIPO_CHOICES[1][0],
            ubicacion=self.ubicacion,
        )

        inicio_1 = timezone.make_aware(datetime(2024, 1, 1, 8, 0))
        inicio_2 = timezone.make_aware(datetime(2024, 1, 2, 9, 0))
        RegistroProduccion.objects.create(
            maquina=self.maquina,
            producto=self.producto,
            formula=self.formula,
            unidad_medida=RegistroProduccion.UnidadMedida.KG,
            cantidad_producida=Decimal("50.000"),
            hora_inicio=inicio_1,
            hora_fin=inicio_1 + timedelta(hours=1),
            registrado_por=self.user,
        )
        RegistroProduccion.objects.create(
            maquina=otra_maquina,
            producto=otro_producto,
            formula=otra_formula,
            unidad_medida=RegistroProduccion.UnidadMedida.COMPRIMIDOS,
            cantidad_producida=Decimal("80.000"),
            hora_inicio=inicio_2,
            hora_fin=inicio_2 + timedelta(hours=1),
            registrado_por=self.user,
        )

        response = self.client.get(
            self.list_url,
            {
                "fecha_after": "2024-01-01",
                "fecha_before": "2024-01-01",
                "maquina": self.maquina.id,
                "producto": self.producto.id,
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], 1)
        resultado = payload["results"][0]
        self.assertEqual(resultado["producto"], self.producto.id)
        self.assertEqual(resultado["maquina"], self.maquina.id)

    def test_readonly_registrado_en_y_registrado_por_en_serializer(self):
        inicio = timezone.now()
        fin = inicio + timedelta(hours=1)
        registro = RegistroProduccion.objects.create(
            maquina=self.maquina,
            producto=self.producto,
            formula=self.formula,
            unidad_medida=RegistroProduccion.UnidadMedida.KG,
            cantidad_producida=Decimal("70.000"),
            hora_inicio=inicio,
            hora_fin=fin,
            registrado_por=self.user,
        )
        original_registrado_en = registro.registrado_en
        other_user = get_user_model().objects.create_user(
            username="other", email="other@example.com", password="pass12345"
        )

        detail_url = reverse("registro-produccion-detail", args=[registro.pk])
        response = self.client.patch(
            detail_url,
            {
                "observaciones": "Actualizado",
                "registrado_en": timezone.now().isoformat(),
                "registrado_por": other_user.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        registro.refresh_from_db()
        self.assertEqual(registro.registrado_por, self.user)
        self.assertEqual(registro.observaciones, "Actualizado")
        self.assertEqual(registro.registrado_en, original_registrado_en)

    def test_formula_consistente_con_producto(self):
        otro_producto = Producto.objects.create(
            codigo="P-03",
            nombre="Crema",
            tipo=Producto.TIPO_CHOICES[2][0],
            presentacion=Producto.PRESENTACION_CHOICES[2][0],
            concentracion="1%",
        )

        payload = self._registro_payload(producto=otro_producto.id)
        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("formula", response.json())

    @staticmethod
    def _parse_datetime(value: str) -> datetime:
        cleaned = value.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
