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
        "observaciones",
    ]
    date_hierarchy = "hora_inicio"
    readonly_fields = ["fecha_registro", "registrado_por"]  # El usuario se completa automáticamente

    def save_model(self, request, obj, form, change):
        """Asegura que el registro guarde el usuario autenticado."""

        if not obj.registrado_por_id:
            obj.registrado_por = request.user
        super().save_model(request, obj, form, change)
