from rest_framework import permissions, viewsets

from .models import Incidente
from .serializers import IncidenteSerializer

class IncidenteViewSet(viewsets.ModelViewSet):
    queryset = Incidente.objects.all()
    serializer_class = IncidenteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['es_parada_no_planificada', 'origen', 'maquina']
    search_fields = ['descripcion', 'acciones_correctivas', 'observaciones']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'created', 'modified']
    ordering = ['-fecha_inicio']
