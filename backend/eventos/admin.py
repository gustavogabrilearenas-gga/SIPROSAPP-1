"""Configuración del Django Admin para el módulo de observaciones."""

from django.contrib import admin
from .models import ObservacionGeneral


@admin.register(ObservacionGeneral)
class ObservacionGeneralAdmin(admin.ModelAdmin):
    list_display = ['fecha_observacion', 'hora_registro', 'registrado_por']
    list_filter = ['fecha_observacion', 'hora_registro']
    search_fields = ['observaciones', 'registrado_por__username']
    date_hierarchy = 'fecha_observacion'