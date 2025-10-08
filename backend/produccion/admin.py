"""Configuración del admin para el dominio de producción."""

from django.contrib import admin

from backend.produccion.models import (
    ControlCalidad,
    Lote,
    LoteDocumento,
    LoteEtapa,
    Parada,
)


class LoteEtapaInline(admin.TabularInline):
    model = LoteEtapa
    extra = 0
    readonly_fields = ['duracion_minutos', 'porcentaje_rendimiento']


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ['codigo_lote', 'producto', 'estado', 'cantidad_producida', 'fecha_real_inicio', 'supervisor']
    list_filter = ['estado', 'prioridad', 'fecha_creacion', 'turno']
    search_fields = ['codigo_lote', 'producto__nombre']
    date_hierarchy = 'fecha_creacion'
    readonly_fields = ['fecha_creacion', 'creado_por']
    inlines = [LoteEtapaInline]

    def save_model(self, request, obj, form, change):
        if not change:
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(LoteEtapa)
class LoteEtapaAdmin(admin.ModelAdmin):
    list_display = ['lote', 'etapa', 'orden', 'maquina', 'estado', 'operario', 'duracion_minutos']
    list_filter = ['estado', 'etapa', 'maquina']
    search_fields = ['lote__codigo_lote']
    readonly_fields = ['duracion_minutos', 'porcentaje_rendimiento']


@admin.register(Parada)
class ParadaAdmin(admin.ModelAdmin):
    list_display = ['lote_etapa', 'tipo', 'categoria', 'fecha_inicio', 'duracion_minutos']
    list_filter = ['tipo', 'categoria', 'fecha_inicio']
    readonly_fields = ['duracion_minutos']


@admin.register(ControlCalidad)
class ControlCalidadAdmin(admin.ModelAdmin):
    list_display = ['lote_etapa', 'tipo_control', 'valor_medido', 'conforme', 'fecha_control', 'controlado_por']
    list_filter = ['conforme', 'fecha_control']
    readonly_fields = ['conforme', 'fecha_control']


@admin.register(LoteDocumento)
class LoteDocumentoAdmin(admin.ModelAdmin):
    list_display = ['lote', 'tipo_documento', 'nombre', 'fecha_subida', 'subido_por']
    list_filter = ['tipo_documento', 'fecha_subida']
    search_fields = ['lote__codigo_lote', 'nombre']
    readonly_fields = ['hash_sha256', 'tamaño_bytes', 'fecha_subida']
