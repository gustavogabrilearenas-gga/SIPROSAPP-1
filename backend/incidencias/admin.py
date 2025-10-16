"""Admin del dominio de incidencias"""

from django.contrib import admin

from .models import Incidente, TipoIncidente
from backend.eventos.models import RegistroIncidente as OriginalRegistroIncidente


class RegistroIncidente(OriginalRegistroIncidente):
    class Meta:
        proxy = True
        app_label = 'incidencias'
        verbose_name = OriginalRegistroIncidente._meta.verbose_name
        verbose_name_plural = OriginalRegistroIncidente._meta.verbose_name_plural


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


@admin.register(RegistroIncidente)
class RegistroIncidenteAdmin(admin.ModelAdmin):
    list_display = ['fecha_incidente', 'registrado_por', 'turno', 'maquina', 'contexto_origen']
    list_filter = ['fecha_incidente', 'turno', 'maquina', 'contexto_origen', 'acciones_correctivas']
    search_fields = ['maquina__codigo', 'descripcion', 'registrado_por__username']
    date_hierarchy = 'fecha_incidente'

