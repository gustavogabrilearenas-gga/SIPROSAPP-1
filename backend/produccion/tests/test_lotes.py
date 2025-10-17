from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

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
        request = self.factory.post("/api/lotes/")
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
        request = self.factory.patch("/api/lotes/1/")
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
        request = self.factory.post("/api/lotes-etapas/")
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
        request = self.factory.patch("/api/lotes-etapas/1/")
        request.user = self.supervisor
        serializer = LoteEtapaSerializer(
            lote_etapa,
            data={"estado": "COMPLETADO"},
            partial=True,
            context={"request": request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("estado", serializer.errors)
