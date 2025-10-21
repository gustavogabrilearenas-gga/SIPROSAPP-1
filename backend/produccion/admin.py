from django.contrib import admin, messages
from django.db import DatabaseError
from django.shortcuts import redirect

from .models import RegistroProduccion


@admin.register(RegistroProduccion)
class RegistroProduccionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "producto",
        "maquina",
        "hora_inicio",
        "hora_fin",
        "cantidad_producida",
        "unidad_medida",
    )
    list_filter = ("producto", "maquina", "unidad_medida")
    search_fields = ("producto__nombre", "maquina__nombre", "observaciones")
    date_hierarchy = "hora_inicio"

    def changelist_view(self, request, extra_context=None):
        """Evita que el administrador caiga por tablas faltantes."""

        try:
            return super().changelist_view(request, extra_context=extra_context)
        except DatabaseError:
            messages.error(
                request,
                (
                    "No se encontró la tabla de registros de producción. "
                    "Ejecutá las migraciones del backend (python manage.py migrate) "
                    "y luego volvé a intentar."
                ),
            )
            return redirect("admin:index")
