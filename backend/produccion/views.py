from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import RegistroProduccion
from .serializers import RegistroProduccionSerializer


class RegistroProduccionViewSet(ModelViewSet):
    queryset = RegistroProduccion.objects.select_related(
        "producto", "maquina", "formula"
    ).order_by("-hora_inicio", "-hora_fin")
    serializer_class = RegistroProduccionSerializer
    permission_classes = (IsAuthenticated,)
