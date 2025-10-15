"""Admin del dominio de incidencias"""

from django.contrib import admin

from .models import Incidente, TipoIncidente


@admin.register(TipoIncidente)
class TipoIncidenteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'requiere_investigacion', 'activo']
    list_filter = ['requiere_investigacion', 'activo']
    search_fields = ['codigo', 'nombre']


@admin.register(Incidente)
class IncidenteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'tipo', 'severidad', 'estado', 'fecha_ocurrencia', 'reportado_por']
    list_filter = ['tipo', 'severidad', 'estado', 'fecha_ocurrencia']
    search_fields = ['codigo', 'titulo']
    date_hierarchy = 'fecha_ocurrencia'



