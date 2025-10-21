from django.contrib import admin

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
