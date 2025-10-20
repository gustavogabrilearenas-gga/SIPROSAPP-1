"""Filtros para los registros de producción."""

try:  # pragma: no cover - compatibilidad en entornos sin django-filter
    from django_filters import rest_framework as filters
except ModuleNotFoundError:  # pragma: no cover - fallback local
    from . import simple_filters as filters

from .models import RegistroProduccion


class RegistroProduccionFilter(filters.FilterSet):
    fecha = filters.DateFromToRangeFilter(field_name="hora_inicio")

    class Meta:
        model = RegistroProduccion
        fields = (
            "maquina",
            "producto",
            "formula",
            "registrado_por",
        )


DjangoFilterBackend = filters.DjangoFilterBackend
