"""Configuración del admin para producción."""

from django.contrib import admin

from .models import RegistroProduccion


@admin.register(RegistroProduccion)
class RegistroProduccionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "fecha_produccion",
        "producto",
        "maquina",
        "cantidad_producida",
        "unidad_medida",
        "hora_inicio",
        "hora_fin",
        "registrado_en",
        "registrado_por",
    )
    list_filter = (
        "fecha_produccion",
        "maquina",
        "producto",
        "formula",
        "unidad_medida",
    )
    search_fields = ("observaciones",)
    readonly_fields = ("registrado_en", "registrado_por")

    def save_model(self, request, obj, form, change):
        if not change and not obj.registrado_por_id:
            obj.registrado_por = request.user
        super().save_model(request, obj, form, change)
