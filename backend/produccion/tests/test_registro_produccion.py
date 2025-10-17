"""Tests para serializer y viewset de RegistroProduccion."""

from datetime import date, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import connection
from django.db.utils import OperationalError, ProgrammingError
from django.test import TransactionTestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from backend.catalogos.models import Maquina, Producto, Turno, Ubicacion
from backend.produccion.models import RegistroProduccion
from backend.produccion.serializers import RegistroProduccionSerializer


UserModel = get_user_model()


SQLITE_DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

class RegistroProduccionDBTestCase(TransactionTestCase):
    """Crea la tabla administrada externamente para poder ejecutar los tests."""

    _table_created = False

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        original_managed = RegistroProduccion._meta.managed
        RegistroProduccion._meta.managed = True
        try:
            with connection.schema_editor() as schema_editor:
                try:
                    schema_editor.create_model(RegistroProduccion)
                    cls._table_created = True
                except (OperationalError, ProgrammingError):
                    # La tabla ya existe (por ejemplo en la base de pruebas)
                    cls._table_created = False
        finally:
            RegistroProduccion._meta.managed = original_managed

    @classmethod
    def tearDownClass(cls):
        original_managed = RegistroProduccion._meta.managed
        RegistroProduccion._meta.managed = True
        try:
            if cls._table_created:
                with connection.schema_editor() as schema_editor:
                    try:
                        schema_editor.delete_model(RegistroProduccion)
                    except (OperationalError, ProgrammingError):
                        pass
        finally:
            RegistroProduccion._meta.managed = original_managed
        super().tearDownClass()

    def setUp(self):
        super().setUp()
        RegistroProduccion.objects.all().delete()

        suffix = f"{self.__class__.__name__.lower()}_{self._testMethodName.lower()}"
        base_code = suffix.replace('_', '')[:10]

        self.ubicacion = Ubicacion.objects.create(
            codigo=f"PL-{base_code}",
            nombre="Planta Principal",
            descripcion="",
        )
        self.maquina = Maquina.objects.create(
            codigo=f"EQ-{base_code}-1",
            nombre="Mezcladora",
            tipo="MEZCLADO",
            ubicacion=self.ubicacion,
            descripcion="",
        )
        self.maquina_b = Maquina.objects.create(
            codigo=f"EQ-{base_code}-2",
            nombre="Compresora",
            tipo="COMPRESION",
            ubicacion=self.ubicacion,
            descripcion="",
        )
        self.producto = Producto.objects.create(
            codigo=f"PRD-{base_code}-1",
            nombre="Tabletas A",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="500mg",
            descripcion="",
        )
        self.producto_b = Producto.objects.create(
            codigo=f"PRD-{base_code}-2",
            nombre="Tabletas B",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="250mg",
            descripcion="",
        )
        Turno.objects.filter(codigo__in=["M", "T"]).delete()
        self.turno_m = Turno.objects.create(
            codigo="M",
            nombre="Mañana",
            hora_inicio=time(6, 0),
            hora_fin=time(14, 0),
        )
        self.turno_t = Turno.objects.create(
            codigo="T",
            nombre="Tarde",
            hora_inicio=time(14, 0),
            hora_fin=time(22, 0),
        )
        self.usuario = UserModel.objects.create_user(
            f"operario_{suffix}", password="pass1234"
        )


    def tearDown(self):
        RegistroProduccion.objects.all().delete()
        super().tearDown()


    def serializer_payload(self, **overrides):
        data = {
            "fecha_produccion": date(2024, 10, 20),
            "turno": self.turno_m.pk,
            "hubo_produccion": True,
            "maquina": self.maquina.pk,
            "producto": self.producto.pk,
            "unidad_medida": "COMPRIMIDOS",
            "cantidad_producida": Decimal("120.50"),
            "hora_inicio": time(7, 0),
            "hora_fin": time(12, 0),
            "observaciones": "Producción normal",
        }
        data.update(overrides)
        return data

    def crear_registro(self, **overrides):
        valores = {
            "fecha_produccion": date(2024, 10, 20),
            "registrado_por": self.usuario,
            "turno": self.turno_m,
            "hubo_produccion": True,
            "maquina": self.maquina,
            "producto": self.producto,
            "unidad_medida": "COMPRIMIDOS",
            "cantidad_producida": Decimal("120.50"),
            "hora_inicio": time(7, 0),
            "hora_fin": time(12, 0),
            "observaciones": "Producción normal",
        }
        valores.update(overrides)
        return RegistroProduccion.objects.create(**valores)


@override_settings(DATABASES=SQLITE_DATABASES)
class RegistroProduccionSerializerTests(RegistroProduccionDBTestCase):
    def test_crea_registro_valido(self):
        serializer = RegistroProduccionSerializer(data=self.serializer_payload())
        self.assertTrue(serializer.is_valid(), serializer.errors)

        registro = serializer.save(registrado_por=self.usuario)

        self.assertIsNotNone(registro.pk)
        self.assertEqual(RegistroProduccion.objects.count(), 1)
        self.assertEqual(registro.registrado_por, self.usuario)
        self.assertEqual(registro.maquina, self.maquina)

    def test_rechaza_registro_duplicado_para_misma_maquina_fecha_turno(self):
        self.crear_registro()

        serializer = RegistroProduccionSerializer(data=self.serializer_payload())
        self.assertFalse(serializer.is_valid())
        self.assertIn("turno", serializer.errors)

    def test_rechaza_cantidad_negativa(self):
        serializer = RegistroProduccionSerializer(
            data=self.serializer_payload(cantidad_producida=Decimal("-1"))
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("cantidad_producida", serializer.errors)

    def test_rechaza_hora_fin_anterior_a_inicio(self):
        serializer = RegistroProduccionSerializer(
            data=self.serializer_payload(hora_fin=time(6, 30))
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("hora_fin", serializer.errors)

    def test_actualizacion_parcial_sin_cambiar_identificadores_es_valida(self):
        registro = self.crear_registro()
        serializer = RegistroProduccionSerializer(
            instance=registro,
            data={"cantidad_producida": Decimal("150.00")},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        actualizado = serializer.save()
        self.assertEqual(actualizado.cantidad_producida, Decimal("150.00"))

    def test_actualizacion_detecta_conflicto_con_otro_registro(self):
        self.crear_registro(
            maquina=self.maquina_b,
            turno=self.turno_t,
            producto=self.producto_b,
            fecha_produccion=date(2024, 10, 21),
            hora_inicio=time(15, 0),
            hora_fin=time(21, 0),
        )
        registro = self.crear_registro()

        serializer = RegistroProduccionSerializer(
            instance=registro,
            data={
                "maquina": self.maquina_b.pk,
                "turno": self.turno_t.pk,
                "fecha_produccion": date(2024, 10, 21),
            },
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("turno", serializer.errors)


@override_settings(DATABASES=SQLITE_DATABASES, ROOT_URLCONF="backend.produccion.urls")
class RegistroProduccionViewSetTests(RegistroProduccionDBTestCase):

    def setUp(self):
        super().setUp()
        self.operario_group, _ = Group.objects.get_or_create(name="operario")
        self.operario = UserModel.objects.create_user(
            f"view-operario-{self._testMethodName.lower()}", password="pass1234"
        )
        self.operario.groups.add(self.operario_group)
        self.operario.refresh_from_db()
        self.client = APIClient()
        self.client.force_authenticate(self.operario)

    def test_listado_filtra_por_busqueda(self):
        self.crear_registro()
        self.crear_registro(
            maquina=self.maquina_b,
            producto=self.producto_b,
            turno=self.turno_t,
            fecha_produccion=date(2024, 10, 21),
            hora_inicio=time(15, 0),
            hora_fin=time(21, 0),
        )

        url = reverse("registro-produccion-list")
        response = self.client.get(url, {"search": self.maquina_b.codigo})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["results"][0]["maquina"], self.maquina_b.pk)

    def test_creacion_asigna_usuario_autenticado(self):
        url = reverse("registro-produccion-list")
        payload = self.serializer_payload(
            fecha_produccion=date(2024, 11, 5),
            hora_inicio=time(6, 0),
            hora_fin=time(12, 0),
        )

        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)

        registro = RegistroProduccion.objects.get()
        self.assertEqual(registro.registrado_por, self.operario)
        self.assertEqual(response.json()["registrado_por"], self.operario.pk)

    def test_no_permite_crear_registro_duplicado(self):
        self.crear_registro(
            registrado_por=self.operario,
            fecha_produccion=date(2024, 11, 5),
            hora_inicio=time(6, 0),
            hora_fin=time(12, 0),
        )
        url = reverse("registro-produccion-list")
        payload = self.serializer_payload(
            fecha_produccion=date(2024, 11, 5),
            hora_inicio=time(6, 0),
            hora_fin=time(12, 0),
        )

        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("turno", response.json())

    def test_actualiza_registro_existente(self):
        registro = self.crear_registro(
            registrado_por=self.operario,
            fecha_produccion=date(2024, 11, 5),
            hora_inicio=time(6, 0),
            hora_fin=time(12, 0),
        )
        url = reverse("registro-produccion-detail", args=[registro.pk])
        response = self.client.patch(url, {"observaciones": "Actualizado"}, format="json")

        self.assertEqual(response.status_code, 200)
        registro.refresh_from_db()
        self.assertEqual(registro.observaciones, "Actualizado")
