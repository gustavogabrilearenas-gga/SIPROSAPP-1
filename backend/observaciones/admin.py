from django.contrib import admin

from .models import ObservacionGeneral


@admin.register(ObservacionGeneral)
class ObservacionGeneralAdmin(admin.ModelAdmin):
    list_display = ("id", "texto", "fecha_hora", "creado_por")
    readonly_fields = ("fecha_hora", "creado_por")
    search_fields = ("texto", "creado_por__username")
    list_filter = ("fecha_hora",)
