"""Vistas API para exponer KPIs y métricas operativas."""

from datetime import datetime, time, timedelta

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.mantenimiento.models import OrdenTrabajo
from backend.produccion.models import Parada

from .serializers import (
    AlertasSerializer,
    HistorialProduccionSerializer,
    OeeSerializer,
    ResumenDashboardSerializer,
)


class ResumenDashboardView(APIView):
    """Devuelve KPIs de alto nivel para el dashboard."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = ResumenDashboardSerializer.get_data()
        serializer = ResumenDashboardSerializer(data)
        return Response(serializer.data)


class OeeView(APIView):
    """Retorna el cálculo de OEE agrupado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = OeeSerializer.get_data()
        serializer = OeeSerializer(data)
        return Response(serializer.data)


class HistorialProduccionView(APIView):
    """Entregra series temporales de la producción diaria."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = HistorialProduccionSerializer.get_data()
        serializer = HistorialProduccionSerializer(data)
        return Response(serializer.data)


class AlertasView(APIView):
    """Provee un resumen de alertas críticas y operativas."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = AlertasSerializer.get_data()
        serializer = AlertasSerializer(data)
        return Response(serializer.data)


class LiveAlertsView(APIView):
    """Entrega eventos recientes con nivel de severidad para el monitoreo en vivo."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        since = now - timedelta(hours=24)

        def to_datetime(value):
            if value is None:
                return since
            if isinstance(value, datetime):
                if timezone.is_naive(value):
                    return timezone.make_aware(value) if timezone.is_aware(now) else value
                return value
            combined = datetime.combine(value, time.min)
            if timezone.is_naive(now):
                return combined
            return timezone.make_aware(combined)

        live_alerts = []

        ordenes_qs = OrdenTrabajo.objects.filter(fecha_creacion__gte=since).select_related("maquina")
        for orden in ordenes_qs:
            if orden.prioridad == "URGENTE" or orden.requiere_parada_produccion:
                nivel = "critical"
            elif orden.prioridad == "ALTA" or orden.estado in {"EN_PROCESO", "PAUSADA"}:
                nivel = "warning"
            else:
                nivel = "info"

            maquina = getattr(orden.maquina, "nombre", None)
            maquina_texto = f" en {maquina}" if maquina else ""

            live_alerts.append(
                {
                    "id": orden.id,
                    "tipo": "mantenimiento",
                    "nivel": nivel,
                    "mensaje": f"Orden {orden.codigo}{maquina_texto}: {orden.titulo}",
                    "timestamp": to_datetime(orden.fecha_creacion),
                }
            )

        paradas_qs = (
            Parada.objects.filter(fecha_inicio__gte=since)
            .select_related("lote_etapa__lote")
            .order_by("-fecha_inicio")
        )
        for parada in paradas_qs:
            duracion = parada.duracion_minutos or 0
            if parada.tipo == "NO_PLANIFICADA" and (
                parada.categoria == "FALLA_EQUIPO" or duracion >= 30
            ):
                nivel = "critical"
            elif parada.tipo == "NO_PLANIFICADA":
                nivel = "warning"
            else:
                nivel = "info"

            lote_codigo = parada.lote_etapa.lote.codigo_lote if parada.lote_etapa and parada.lote_etapa.lote else ""
            duracion_texto = f" ({duracion} min)" if duracion else ""

            live_alerts.append(
                {
                    "id": parada.id,
                    "tipo": "produccion",
                    "nivel": nivel,
                    "mensaje": (
                        f"Parada {parada.get_categoria_display()} {lote_codigo}{duracion_texto}"
                    ),
                    "timestamp": to_datetime(parada.fecha_inicio),
                }
            )

        live_alerts.sort(key=lambda item: item["timestamp"], reverse=True)
        for item in live_alerts:
            item.pop("timestamp", None)

        return Response(live_alerts)
