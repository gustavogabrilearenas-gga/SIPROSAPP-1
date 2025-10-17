from django.core.exceptions import ValidationError
from django.db import models
from rest_framework.permissions import SAFE_METHODS


class TimeWindowMixin(models.Model):
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_minutos = models.IntegerField(null=True, blank=True, editable=False)

    class Meta:
        abstract = True

    def clean(self):
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin <= self.fecha_inicio:
            raise ValidationError({"fecha_fin": "Fin debe ser posterior a inicio."})

    def save(self, *args, **kwargs):
        if self.fecha_inicio and self.fecha_fin:
            self.duracion_minutos = int((self.fecha_fin - self.fecha_inicio).total_seconds() // 60)
        return super().save(*args, **kwargs)


class SafeMethodPermissionMixin:
    """Gestiona permisos diferenciados para métodos seguros e inseguros."""

    safe_permission_classes = ()
    unsafe_permission_classes = ()

    def get_permissions(self):
        if hasattr(self, "request") and self.request.method in SAFE_METHODS:
            permission_classes = getattr(self, "safe_permission_classes", None)
        else:
            permission_classes = getattr(self, "unsafe_permission_classes", None)

        if permission_classes:
            return [permission() for permission in permission_classes]
        return super().get_permissions()


class QueryParamFilterMixin:
    """Aplica filtros declarativos basados en parámetros de consulta."""

    query_param_filters = None

    def apply_query_param_filters(self, queryset):
        filters = getattr(self, "query_param_filters", None) or {}
        if not filters:
            return queryset

        for param, handler in filters.items():
            value = self.request.query_params.get(param)
            if value in (None, ""):
                continue
            if callable(handler):
                queryset = handler(queryset, value)
            else:
                queryset = queryset.filter(**{handler: value})
        return queryset
