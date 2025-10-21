from django.contrib import admin

from .models import RegistroMantenimiento


@admin.register(RegistroMantenimiento)
class RegistroMantenimientoAdmin(admin.ModelAdmin):
    list_display = [
        "maquina",
        "tipo_mantenimiento",
        "hora_inicio",
        "hora_fin",
        "tiene_anomalias",
        "registrado_por",
    ]
    list_filter = [
        "tipo_mantenimiento",
        "tiene_anomalias",
        "maquina",
        "registrado_por",
    ]
    search_fields = [
        "maquina__nombre",
        "descripcion",
        "descripcion_anomalias",
        "observaciones"
    ]
    date_hierarchy = "hora_inicio"
    readonly_fields = ["fecha_registro", "registrado_por"]  # No se puede editar el usuario que registró