from datetime import datetime, timedelta

from decimal import Decimal

from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient, APIRequestFactory
from unittest.mock import patch

from django.urls import reverse

from backend.catalogos.models import (
    EtapaProduccion,
    Formula,
    Maquina,
    Producto,
    Turno,
    Ubicacion,
)
from backend.produccion.models import Lote, LoteEtapa
from backend.produccion.serializers import LoteEtapaSerializer, LoteSerializer


User = get_user_model()


class LoteSerializerStateTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.supervisor = User.objects.create_user("supervisor", password="pass1234")
        self.creador = User.objects.create_user("creador", password="pass1234")
        self.operario = User.objects.create_user("operario", password="pass1234")

        self.supervisor_group, _ = Group.objects.get_or_create(name="Supervisor")
        self.operario_group, _ = Group.objects.get_or_create(name="Operario")
        self.supervisor.groups.add(self.supervisor_group)
        self.operario.groups.add(self.operario_group)

        turno_inicio = timezone.now()
        self.turno, _ = Turno.objects.update_or_create(
            codigo="M",
            defaults={
                "nombre": "Mañana",
                "hora_inicio": turno_inicio.time().replace(tzinfo=None),
                "hora_fin": (turno_inicio + timedelta(hours=8)).time().replace(tzinfo=None),
            },
        )

        self.producto = Producto.objects.create(
            codigo="PRD-001",
            nombre="Producto de prueba",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="500mg",
            descripcion="",
        )
        self.formula = Formula.objects.create(
            codigo="FOR-001",
            version="1.0",
            producto=self.producto,
            descripcion="",
            tamaño_lote=100,
            unidad="COMPRIMIDOS",
            tiempo_total=1,
            activa=True,
            aprobada=True,
            ingredientes=[],
            etapas=[],
        )

        inicio = timezone.now()
        fin = inicio + timedelta(hours=4)
        self.lote = Lote.objects.create(
            codigo_lote="LOTE-001",
            producto=self.producto,
            formula=self.formula,
            cantidad_planificada=100,
            unidad="COMPRIMIDOS",
            prioridad="NORMAL",
            fecha_planificada_inicio=inicio,
            fecha_planificada_fin=fin,
            turno=self.turno,
            supervisor=self.supervisor,
            observaciones="",
            creado_por=self.creador,
        )

        self.ubicacion = Ubicacion.objects.create(
            codigo="UB-001",
            nombre="Planta 1",
            descripcion="",
        )
        self.maquina = Maquina.objects.create(
            codigo="MAQ-001",
            nombre="Mezcladora",
            tipo="MEZCLADO",
            ubicacion=self.ubicacion,
            descripcion="",
        )
        self.etapa = EtapaProduccion.objects.create(
            codigo="ETP-001",
            nombre="Pesado",
            descripcion="",
            duracion_tipica=60,
            requiere_validacion=False,
            parametros=[],
        )

    def serializer_context(self, user):
        request = self.factory.post("/api/produccion/planificacion-lotes/")
        request.user = user
        return {"request": request}

    def test_lote_serializer_rejects_estado_on_create(self):
        data = {
            "codigo_lote": "LOTE-002",
            "producto": self.producto.pk,
            "formula": self.formula.pk,
            "cantidad_planificada": 200,
            "fecha_planificada_inicio": (timezone.now() + timedelta(days=1)).isoformat(),
            "fecha_planificada_fin": (timezone.now() + timedelta(days=1, hours=2)).isoformat(),
            "turno": self.turno.pk,
            "supervisor": self.supervisor.pk,
            "observaciones": "",
            "estado": "EN_PROCESO",
        }
        serializer = LoteSerializer(data=data, context=self.serializer_context(self.supervisor))
        self.assertFalse(serializer.is_valid())
        self.assertIn("estado", serializer.errors)

    def test_lote_serializer_rejects_estado_on_update(self):
        request = self.factory.patch("/api/produccion/planificacion-lotes/1/")
        request.user = self.supervisor
        serializer = LoteSerializer(
            self.lote,
            data={"estado": "LIBERADO"},
            partial=True,
            context={"request": request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("estado", serializer.errors)

    def test_lote_etapa_serializer_rejects_estado_on_create(self):
        request = self.factory.post("/api/produccion/ejecucion-etapas-operario/")
        request.user = self.operario
        data = {
            "lote": self.lote.pk,
            "etapa": self.etapa.pk,
            "orden": 1,
            "maquina": self.maquina.pk,
            "operario": self.operario.pk,
            "estado": "EN_PROCESO",
        }
        serializer = LoteEtapaSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("estado", serializer.errors)

    def test_lote_etapa_serializer_rejects_estado_on_update(self):
        lote_etapa = LoteEtapa.objects.create(
            lote=self.lote,
            etapa=self.etapa,
            orden=1,
            maquina=self.maquina,
            operario=self.operario,
        )
        request = self.factory.patch("/api/produccion/ejecucion-etapas-operario/1/")
        request.user = self.supervisor
        serializer = LoteEtapaSerializer(
            lote_etapa,
            data={"estado": "COMPLETADO"},
            partial=True,
            context={"request": request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("estado", serializer.errors)

    def test_lote_etapa_serializer_accepts_parametros_catalogo(self):
        self.etapa.parametros = [
            {"nombre": "Temperatura", "unidad": "°C"},
            {"nombre": "Humedad", "unidad": "%"},
        ]
        self.etapa.save()

        request = self.factory.post("/api/produccion/ejecucion-etapas-operario/")
        request.user = self.operario
        data = {
            "lote": self.lote.pk,
            "etapa": self.etapa.pk,
            "orden": 1,
            "maquina": self.maquina.pk,
            "operario": self.operario.pk,
            "parametros_registrados": [
                {
                    "nombre": "Temperatura",
                    "valor": 22,
                    "unidad": "°C",
                    "conforme": True,
                }
            ],
        }
        serializer = LoteEtapaSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_lote_etapa_serializer_rejects_parametro_fuera_catalogo(self):
        self.etapa.parametros = [{"nombre": "Temperatura", "unidad": "°C"}]
        self.etapa.save()

        request = self.factory.post("/api/produccion/ejecucion-etapas-operario/")
        request.user = self.operario
        data = {
            "lote": self.lote.pk,
            "etapa": self.etapa.pk,
            "orden": 1,
            "maquina": self.maquina.pk,
            "operario": self.operario.pk,
            "parametros_registrados": [
                {
                    "nombre": "Presión",
                    "valor": 5,
                    "unidad": "bar",
                    "conforme": True,
                }
            ],
        }
        serializer = LoteEtapaSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("parametros_registrados", serializer.errors)
        error_message = serializer.errors["parametros_registrados"][0]
        self.assertIn("no está definido", error_message)

    def test_operario_no_puede_aprobar_etapa_que_requiere_calidad(self):
        etapa_validada = EtapaProduccion.objects.create(
            codigo="ETP-VAL",
            nombre="Validación",
            descripcion="",
            duracion_tipica=30,
            requiere_validacion=True,
            parametros=[],
        )
        lote_etapa = LoteEtapa.objects.create(
            lote=self.lote,
            etapa=etapa_validada,
            orden=2,
            maquina=self.maquina,
            operario=self.operario,
        )

        request = self.factory.patch("/api/produccion/ejecucion-etapas-operario/1/")
        request.user = self.operario

        serializer = LoteEtapaSerializer(
            lote_etapa,
            data={"aprobada_por_calidad": self.supervisor.pk},
            partial=True,
            context={"request": request},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("aprobada_por_calidad", serializer.errors)

    def test_supervisor_puede_aprobar_etapa_que_requiere_calidad(self):
        etapa_validada = EtapaProduccion.objects.create(
            codigo="ETP-VAL2",
            nombre="Validación 2",
            descripcion="",
            duracion_tipica=45,
            requiere_validacion=True,
            parametros=[],
        )
        lote_etapa = LoteEtapa.objects.create(
            lote=self.lote,
            etapa=etapa_validada,
            orden=3,
            maquina=self.maquina,
            operario=self.operario,
        )

        request = self.factory.patch("/api/produccion/ejecucion-etapas-operario/1/")
        request.user = self.supervisor

        serializer = LoteEtapaSerializer(
            lote_etapa,
            data={"aprobada_por_calidad": self.supervisor.pk},
            partial=True,
            context={"request": request},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        actualizado = serializer.save()

        self.assertEqual(actualizado.aprobada_por_calidad, self.supervisor)
        self.assertIsNotNone(actualizado.fecha_aprobacion_calidad)


@override_settings(ROOT_URLCONF="backend.produccion.urls")
class LoteEtapaWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.supervisor = User.objects.create_superuser(
            "supervisor_api", email="sup@example.com", password="pass1234"
        )
        self.operario = User.objects.create_user("operario_api", password="pass1234")
        operario_group, _ = Group.objects.get_or_create(name="Operario")
        self.operario.groups.add(operario_group)

        turno_inicio = timezone.make_aware(datetime(2024, 5, 1, 6, 0))
        self.turno = Turno.objects.create(
            codigo="TM",
            nombre="Turno Mañana",
            hora_inicio=turno_inicio.time().replace(tzinfo=None),
            hora_fin=(turno_inicio + timedelta(hours=8)).time().replace(tzinfo=None),
        )

        self.producto = Producto.objects.create(
            codigo="PRD-WF",
            nombre="Producto Workflow",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="500mg",
            descripcion="",
        )

        self.formula = Formula.objects.create(
            codigo="FOR-WF",
            version="1.0",
            producto=self.producto,
            descripcion="",
            tamaño_lote=200,
            unidad="COMPRIMIDOS",
            tiempo_total=1,
            activa=True,
            aprobada=True,
            ingredientes=[],
            etapas=[],
        )

        ubicacion = Ubicacion.objects.create(
            codigo="UB-WF",
            nombre="Planta Workflow",
            descripcion="",
        )
        self.maquina = Maquina.objects.create(
            codigo="MAQ-WF",
            nombre="Granuladora",
            tipo="GRANULADO",
            ubicacion=ubicacion,
            descripcion="",
        )

        self.etapa1 = EtapaProduccion.objects.create(
            codigo="ETP-WF1",
            nombre="Mezclado",
            descripcion="",
            duracion_tipica=60,
            requiere_validacion=False,
            parametros=[],
        )
        self.etapa2 = EtapaProduccion.objects.create(
            codigo="ETP-WF2",
            nombre="Compresión",
            descripcion="",
            duracion_tipica=90,
            requiere_validacion=False,
            parametros=[],
        )

        inicio_planificado = timezone.make_aware(datetime(2024, 5, 2, 6, 0))
        fin_planificado = inicio_planificado + timedelta(hours=6)
        self.lote = Lote.objects.create(
            codigo_lote="LOT-WF",
            producto=self.producto,
            formula=self.formula,
            cantidad_planificada=200,
            unidad="COMPRIMIDOS",
            prioridad="NORMAL",
            fecha_planificada_inicio=inicio_planificado,
            fecha_planificada_fin=fin_planificado,
            turno=self.turno,
            supervisor=self.supervisor,
            observaciones="",
            creado_por=self.supervisor,
        )

        self.lote_etapa1 = LoteEtapa.objects.create(
            lote=self.lote,
            etapa=self.etapa1,
            orden=1,
            maquina=self.maquina,
            operario=self.operario,
        )
        self.lote_etapa2 = LoteEtapa.objects.create(
            lote=self.lote,
            etapa=self.etapa2,
            orden=2,
            maquina=self.maquina,
            operario=self.operario,
        )

        self.client.force_authenticate(self.supervisor)

    def iniciar_y_completar(self, etapa, *, entrada, salida, inicio, fin):
        with patch("django.utils.timezone.now", return_value=inicio):
            response = self.client.post(
                reverse("ejecucion-etapa-operario-iniciar", args=[etapa.pk]),
                format="json",
            )
        self.assertEqual(response.status_code, 200, response.content)

        with patch("django.utils.timezone.now", return_value=fin):
            response = self.client.post(
                reverse("ejecucion-etapa-operario-completar", args=[etapa.pk]),
                {"cantidad_entrada": entrada, "cantidad_salida": salida},
                format="json",
            )
        self.assertEqual(response.status_code, 200, response.content)

    def test_completar_etapas_actualiza_metricas_del_lote(self):
        inicio1 = timezone.make_aware(datetime(2024, 5, 2, 7, 0))
        fin1 = inicio1 + timedelta(hours=2)
        inicio2 = timezone.make_aware(datetime(2024, 5, 2, 10, 0))
        fin2 = inicio2 + timedelta(hours=3)

        self.iniciar_y_completar(
            self.lote_etapa1,
            entrada=Decimal("100"),
            salida=Decimal("90"),
            inicio=inicio1,
            fin=fin1,
        )
        self.iniciar_y_completar(
            self.lote_etapa2,
            entrada=Decimal("90"),
            salida=Decimal("85"),
            inicio=inicio2,
            fin=fin2,
        )

        self.lote.refresh_from_db()
        etapa1 = LoteEtapa.objects.get(pk=self.lote_etapa1.pk)
        etapa2 = LoteEtapa.objects.get(pk=self.lote_etapa2.pk)

        self.assertEqual(self.lote.cantidad_producida, 175)
        self.assertEqual(self.lote.fecha_real_inicio, inicio1)
        self.assertEqual(self.lote.fecha_real_fin, fin2)

        self.assertEqual(etapa1.cantidad_merma, Decimal("10.00"))
        self.assertEqual(etapa1.porcentaje_rendimiento, Decimal("90.00"))
        self.assertEqual(etapa2.cantidad_merma, Decimal("5.00"))
        self.assertEqual(etapa2.porcentaje_rendimiento, Decimal("94.44"))
