from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import RegistroMantenimiento
from .serializers import RegistroMantenimientoSerializer


class RegistroMantenimientoViewSet(ModelViewSet):
    """API para registros de mantenimiento."""
    
    queryset = RegistroMantenimiento.objects.select_related(
        "maquina",
        "registrado_por"
    ).all()
    serializer_class = RegistroMantenimientoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = {
        "maquina": ["exact"],
        "tipo_mantenimiento": ["exact", "in"],
        "tiene_anomalias": ["exact"],
        "registrado_por": ["exact"],
        "hora_inicio": ["gte", "lte", "date"],
        "hora_fin": ["gte", "lte", "date"],
    }
    search_fields = [
        "maquina__nombre",
        "descripcion",
        "descripcion_anomalias",
        "observaciones"
    ]
    ordering_fields = [
        "hora_inicio",
        "hora_fin",
        "maquina__nombre",
        "tipo_mantenimiento"
    ]
    ordering = ["-hora_inicio"]