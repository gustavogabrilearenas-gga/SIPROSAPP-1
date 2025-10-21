from django.contrib import admin
from .models import Incidente

@admin.register(Incidente)
class IncidenteAdmin(admin.ModelAdmin):
    list_display = [
        'fecha_inicio',
        'fecha_fin',
        'es_parada_no_planificada',
        'origen',
        'maquina',
        'descripcion_corta',
    ]
    list_filter = [
        'es_parada_no_planificada',
        'origen',
        'maquina',
        'fecha_inicio',
    ]
    search_fields = [
        'descripcion',
        'acciones_correctivas',
        'observaciones',
    ]
    readonly_fields = ['created', 'modified']

    def descripcion_corta(self, obj):
        return obj.descripcion[:100] + '...' if len(obj.descripcion) > 100 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'