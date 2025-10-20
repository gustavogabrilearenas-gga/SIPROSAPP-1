"""Filtros para los registros de producción."""

try:  # pragma: no cover - compatibilidad en entornos sin django-filter
    from django_filters import rest_framework as filters
except ModuleNotFoundError:  # pragma: no cover - fallback local
    from . import simple_filters as filters

from .models import RegistroProduccion


class RegistroProduccionFilter(filters.FilterSet):
    fecha_desde = filters.DateFilter(
        field_name="fecha_produccion", lookup_expr="gte"
    )
    fecha_hasta = filters.DateFilter(
        field_name="fecha_produccion", lookup_expr="lte"
    )

    class Meta:
        model = RegistroProduccion
        fields = {
            "fecha_produccion": ["exact"],
            "maquina": ["exact"],
            "producto": ["exact"],
            "formula": ["exact"],
            "registrado_por": ["exact"],
        }
        order_by_field = "ordering"


DjangoFilterBackend = filters.DjangoFilterBackend
