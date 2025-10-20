from datetime import date, timedelta
from decimal import Decimal

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase
from django.utils import timezone

from backend.catalogos.models import Formula, Maquina, Producto, Ubicacion
from backend.produccion.admin import RegistroProduccionAdmin
from backend.produccion.models import RegistroProduccion


class RegistroProduccionAdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ubicacion = Ubicacion.objects.create(codigo="ADM1", nombre="Admin Área")
        cls.maquina = Maquina.objects.create(
            codigo="ADM-M1",
            nombre="Granuladora",
            tipo=Maquina.TIPO_CHOICES[0][0],
            ubicacion=cls.ubicacion,
        )
        cls.producto = Producto.objects.create(
            codigo="ADM-P1",
            nombre="Tabletas",
            tipo=Producto.TIPO_CHOICES[0][0],
            presentacion=Producto.PRESENTACION_CHOICES[0][0],
            concentracion="500mg",
        )
        cls.formula = Formula.objects.create(
            codigo="ADM-F1",
            version="1.0.0",
            producto=cls.producto,
        )

    def setUp(self):
        self.superuser = get_user_model().objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpass"
        )
        self.factory = RequestFactory()
        self.admin = RegistroProduccionAdmin(RegistroProduccion, admin.site)

    def test_readonly_fields_configurados(self):
        self.assertTupleEqual(self.admin.readonly_fields, ("registrado_en", "registrado_por"))

    def test_save_model_autocompleta_usuario(self):
        request = self.factory.post("/")
        request.user = self.superuser
        inicio = timezone.now()
        fin = inicio + timedelta(hours=1)
        registro = RegistroProduccion(
            fecha_produccion=date.today(),
            maquina=self.maquina,
            producto=self.producto,
            formula=self.formula,
            unidad_medida=RegistroProduccion.UnidadMedida.KG,
            cantidad_producida=Decimal("100.000"),
            hora_inicio=inicio,
            hora_fin=fin,
        )

        self.admin.save_model(request, registro, form=None, change=False)

        registro_refrescado = RegistroProduccion.objects.get(pk=registro.pk)
        self.assertEqual(registro_refrescado.registrado_por, self.superuser)
        self.assertIsNotNone(registro_refrescado.registrado_en)
