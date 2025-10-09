"""Vistas API para exponer KPIs y métricas operativas."""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
        return Response({"status": 200, "data": serializer.data, "message": "ok"})


class OeeView(APIView):
    """Retorna el cálculo de OEE agrupado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = OeeSerializer.get_data()
        serializer = OeeSerializer(data)
        return Response({"status": 200, "data": serializer.data, "message": "ok"})


class HistorialProduccionView(APIView):
    """Entregra series temporales de la producción diaria."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = HistorialProduccionSerializer.get_data()
        serializer = HistorialProduccionSerializer(data)
        return Response({"status": 200, "data": serializer.data, "message": "ok"})


class AlertasView(APIView):
    """Provee un resumen de alertas críticas y operativas."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = AlertasSerializer.get_data()
        serializer = AlertasSerializer(data)
        return Response({"status": 200, "data": serializer.data, "message": "ok"})
