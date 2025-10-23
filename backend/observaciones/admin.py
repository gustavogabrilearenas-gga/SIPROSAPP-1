from django.contrib import admin

from .models import ObservacionGeneral


@admin.register(ObservacionGeneral)
class ObservacionGeneralAdmin(admin.ModelAdmin):
    list_display = ("id", "texto", "fecha_hora", "creado_por")
    readonly_fields = ("fecha_hora", "creado_por")
    search_fields = ("texto", "creado_por__username")
    list_filter = ("fecha_hora",)

    def save_model(self, request, obj, form, change):
        """Asignar el usuario autenticado al crear y mantenerlo luego."""

        if not change and not obj.creado_por_id:
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)
