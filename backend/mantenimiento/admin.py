"""Configuración de admin para mantenimiento."""

from django.contrib import admin

from .models import (
    HistorialMantenimiento,
    OrdenTrabajo,
    PlanMantenimiento,
    TipoMantenimiento,
)
from backend.eventos.models import RegistroMantenimiento as OriginalRegistroMantenimiento


class RegistroMantenimiento(OriginalRegistroMantenimiento):
    class Meta:
        proxy = True
        app_label = 'mantenimiento'
        verbose_name = OriginalRegistroMantenimiento._meta.verbose_name
        verbose_name_plural = OriginalRegistroMantenimiento._meta.verbose_name_plural


@admin.register(TipoMantenimiento)
class TipoMantenimientoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'activo']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre']


@admin.register(PlanMantenimiento)
class PlanMantenimientoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'maquina', 'nombre', 'tipo', 'activo']
    list_filter = ['tipo', 'activo', 'maquina']
    search_fields = ['codigo', 'nombre']


@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'maquina', 'tipo', 'prioridad', 'estado', 'fecha_creacion', 'asignada_a']
    list_filter = ['tipo', 'prioridad', 'estado', 'fecha_creacion']
    search_fields = ['codigo', 'titulo']
    date_hierarchy = 'fecha_creacion'
    readonly_fields = ['duracion_real_horas', 'fecha_creacion']


@admin.register(HistorialMantenimiento)
class HistorialMantenimientoAdmin(admin.ModelAdmin):
    list_display = ['maquina', 'tipo', 'fecha', 'tiempo_parada_horas', 'realizado_por']
    list_filter = ['tipo', 'fecha', 'maquina']
    date_hierarchy = 'fecha'


@admin.register(RegistroMantenimiento)
class RegistroMantenimientoAdmin(admin.ModelAdmin):
    list_display = ['fecha_mantenimiento', 'registrado_por', 'turno', 'maquina', 'tipo_mantenimiento']
    list_filter = ['fecha_mantenimiento', 'turno', 'maquina', 'tipo_mantenimiento', 'se_realizo_mantenimiento']
    search_fields = ['maquina__codigo', 'descripcion', 'registrado_por__username']
    date_hierarchy = 'fecha_mantenimiento'
