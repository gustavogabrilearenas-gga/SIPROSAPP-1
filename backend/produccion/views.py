"""Vistas del módulo de producción."""

from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .filters import DjangoFilterBackend, RegistroProduccionFilter
from .models import RegistroProduccion
from .serializers import RegistroProduccionSerializer


class RegistroProduccionViewSet(viewsets.ModelViewSet):
    queryset = (
        RegistroProduccion.objects.select_related(
            "maquina", "producto", "formula", "registrado_por"
        ).all()
    )
    serializer_class = RegistroProduccionSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    )
    filterset_class = RegistroProduccionFilter
    ordering_fields = ("hora_inicio", "registrado_en", "cantidad_producida")
    search_fields = (
        "observaciones",
        "producto__nombre",
        "maquina__nombre",
        "formula__codigo",
    )

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)
