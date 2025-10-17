"""Vistas del dominio de incidencias"""

from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.core.mixins import QueryParamFilterMixin, SafeMethodPermissionMixin
from backend.core.permissions import IsAdmin
from .models import Incidente, TipoIncidente
from .serializers import IncidenteListSerializer, IncidenteSerializer, TipoIncidenteSerializer


class TipoIncidenteViewSet(SafeMethodPermissionMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Tipos de Incidente"""

    queryset = TipoIncidente.objects.all().order_by('codigo')
    serializer_class = TipoIncidenteSerializer

    unsafe_permission_classes = (IsAdmin,)


class IncidenteViewSet(QueryParamFilterMixin, SafeMethodPermissionMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Incidentes"""

    queryset = Incidente.objects.select_related(
        'tipo', 'ubicacion', 'maquina', 'lote_afectado', 'reportado_por'
    ).all().order_by('-fecha_ocurrencia')
    serializer_class = IncidenteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'titulo', 'descripcion']
    ordering_fields = ['fecha_ocurrencia', 'severidad']

    query_param_filters = {
        'tipo': 'tipo_id',
        'severidad': lambda qs, value: qs.filter(severidad=value.upper()),
        'estado': lambda qs, value: qs.filter(estado=value.upper()),
    }

    def get_queryset(self):
        """Filtra incidentes según los parámetros de consulta disponibles."""

        queryset = super().get_queryset()
        return self.apply_query_param_filters(queryset)

    def get_serializer_class(self):
        """Utiliza un serializer ligero para listados y el detallado para el resto."""

        if self.action == 'list':
            return IncidenteListSerializer
        return IncidenteSerializer

    unsafe_permission_classes = (IsAdmin,)

    def perform_create(self, serializer):
        """Guarda el incidente registrando automáticamente al reportante."""

        serializer.save(reportado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def abiertos(self, request):
        """Endpoint: /api/incidentes/abiertos/"""

        incidentes = self.get_queryset().exclude(estado='CERRADO')
        serializer = self.get_serializer(incidentes, many=True)
        return Response(serializer.data)
