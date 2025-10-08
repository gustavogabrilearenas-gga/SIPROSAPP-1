"""Configuración de admin para mantenimiento."""

from django.contrib import admin

from .models import (
    HistorialMantenimiento,
    IndicadorMantenimiento,
    OrdenTrabajo,
    OrdenTrabajoRepuesto,
    PlanMantenimiento,
    TipoMantenimiento,
)


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


class OrdenTrabajoRepuestoInline(admin.TabularInline):
    model = OrdenTrabajoRepuesto
    extra = 1


@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'maquina', 'tipo', 'prioridad', 'estado', 'fecha_creacion', 'asignada_a']
    list_filter = ['tipo', 'prioridad', 'estado', 'fecha_creacion']
    search_fields = ['codigo', 'titulo']
    date_hierarchy = 'fecha_creacion'
    readonly_fields = ['duracion_real_horas', 'fecha_creacion']
    inlines = [OrdenTrabajoRepuestoInline]


@admin.register(HistorialMantenimiento)
class HistorialMantenimientoAdmin(admin.ModelAdmin):
    list_display = ['maquina', 'tipo', 'fecha', 'tiempo_parada_horas', 'realizado_por']
    list_filter = ['tipo', 'fecha', 'maquina']
    date_hierarchy = 'fecha'


@admin.register(IndicadorMantenimiento)
class IndicadorMantenimientoAdmin(admin.ModelAdmin):
    list_display = ['maquina', 'periodo', 'fecha_inicio', 'mtbf_horas', 'mttr_horas', 'disponibilidad_porcentaje']
    list_filter = ['periodo', 'maquina']
    date_hierarchy = 'fecha_inicio'
