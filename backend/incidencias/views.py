"""Vistas del dominio de incidencias"""

from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsAdmin
from .models import Incidente, TipoIncidente
from .serializers import IncidenteListSerializer, IncidenteSerializer, TipoIncidenteSerializer


class TipoIncidenteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Tipos de Incidente"""

    queryset = TipoIncidente.objects.all().order_by('codigo')
    serializer_class = TipoIncidenteSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class IncidenteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Incidentes"""

    queryset = Incidente.objects.select_related(
        'tipo', 'ubicacion', 'maquina', 'lote_afectado', 'reportado_por'
    ).all().order_by('-fecha_ocurrencia')
    serializer_class = IncidenteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'titulo', 'descripcion']
    ordering_fields = ['fecha_ocurrencia', 'severidad']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtro por tipo
        tipo_id = self.request.query_params.get('tipo')
        if tipo_id:
            queryset = queryset.filter(tipo_id=tipo_id)

        # Filtro por severidad
        severidad = self.request.query_params.get('severidad')
        if severidad:
            queryset = queryset.filter(severidad=severidad.upper())

        # Filtro por estado
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado.upper())

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return IncidenteListSerializer
        return IncidenteSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]

    def perform_create(self, serializer):
        serializer.save(reportado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def abiertos(self, request):
        """Endpoint: /api/incidentes/abiertos/"""
        incidentes = self.get_queryset().exclude(estado='CERRADO')
        serializer = self.get_serializer(incidentes, many=True)
        return Response(serializer.data)
