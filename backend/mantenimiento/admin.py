"""Configuración del admin para el dominio de Mantenimiento."""

from django.contrib import admin

from backend.mantenimiento.models import (
    HistorialMantenimiento,
    IndicadorMantenimiento,
    OrdenTrabajo,
    OrdenTrabajoRepuesto,
    PlanMantenimiento,
    TipoMantenimiento,
)


@admin.register(TipoMantenimiento)
class TipoMantenimientoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'activo')
    search_fields = ('codigo', 'nombre')
    list_filter = ('activo',)


@admin.register(PlanMantenimiento)
class PlanMantenimientoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'maquina', 'tipo', 'frecuencia_dias', 'activo')
    search_fields = ('codigo', 'nombre', 'maquina__nombre')
    list_filter = ('tipo', 'activo')
    autocomplete_fields = ('maquina', 'tipo', 'creado_por')


class OrdenTrabajoRepuestoInline(admin.TabularInline):
    model = OrdenTrabajoRepuesto
    extra = 0


@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'maquina', 'tipo', 'prioridad', 'estado', 'fecha_creacion')
    search_fields = ('codigo', 'titulo', 'maquina__nombre', 'tipo__nombre')
    list_filter = ('estado', 'prioridad', 'tipo')
    autocomplete_fields = ('maquina', 'tipo', 'plan_mantenimiento', 'creada_por', 'asignada_a', 'completada_por')
    inlines = [OrdenTrabajoRepuestoInline]


@admin.register(HistorialMantenimiento)
class HistorialMantenimientoAdmin(admin.ModelAdmin):
    list_display = ('maquina', 'fecha', 'tipo', 'tiempo_parada_horas', 'realizado_por')
    search_fields = ('maquina__nombre', 'orden_trabajo__codigo', 'tipo__nombre')
    list_filter = ('tipo', 'fecha')
    autocomplete_fields = ('maquina', 'orden_trabajo', 'tipo', 'realizado_por')


@admin.register(IndicadorMantenimiento)
class IndicadorMantenimientoAdmin(admin.ModelAdmin):
    list_display = ('maquina', 'periodo', 'fecha_inicio', 'mtbf_horas', 'mttr_horas')
    search_fields = ('maquina__nombre', 'maquina__codigo')
    list_filter = ('periodo',)
    autocomplete_fields = ('maquina',)
