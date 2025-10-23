from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import RegistroProduccion
from .serializers import RegistroProduccionSerializer


class RegistroProduccionViewSet(ModelViewSet):
    """API para registros de producción."""
    
    queryset = RegistroProduccion.objects.select_related(
        "producto",
        "maquina",
        "formula",
        "turno",
        "registrado_por"
    ).all()
    serializer_class = RegistroProduccionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["producto", "maquina", "turno", "registrado_por"]
    search_fields = ["producto__nombre", "observaciones"]
    ordering_fields = ["hora_inicio", "hora_fin", "cantidad_producida"]
    ordering = ["-hora_inicio"]