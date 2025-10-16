"""Configuración del Django Admin para el módulo de eventos."""

from django.contrib import admin
from .models import ObservacionGeneral


@admin.register(ObservacionGeneral)
class ObservacionGeneralAdmin(admin.ModelAdmin):
    list_display = ['fecha_observacion', 'registrado_por', 'turno']
    list_filter = ['fecha_observacion', 'turno']
    search_fields = ['observaciones', 'registrado_por__username']
    date_hierarchy = 'fecha_observacion'