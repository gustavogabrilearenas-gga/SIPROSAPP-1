"""Configuración del admin para el dominio de inventario."""

from django.contrib import admin

from backend.inventario.models import (
    AlertaInventario,
    CategoriaInsumo,
    ConteoFisico,
    Insumo,
    LoteInsumo,
    LoteInsumoConsumo,
    MovimientoInventario,
    ProductoTerminado,
    Repuesto,
)


@admin.register(CategoriaInsumo)
class CategoriaInsumoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'activa']
    list_filter = ['activa']
    search_fields = ['codigo', 'nombre']


@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'stock_actual', 'stock_minimo', 'activo']
    list_filter = ['categoria', 'activo', 'requiere_cadena_frio']
    search_fields = ['codigo', 'nombre']


@admin.register(LoteInsumo)
class LoteInsumoAdmin(admin.ModelAdmin):
    list_display = ['insumo', 'codigo_lote_proveedor', 'fecha_vencimiento', 'cantidad_actual', 'estado', 'ubicacion']
    list_filter = ['estado', 'fecha_vencimiento', 'ubicacion']
    search_fields = ['insumo__nombre', 'codigo_lote_proveedor']
    date_hierarchy = 'fecha_vencimiento'


@admin.register(LoteInsumoConsumo)
class LoteInsumoConsumoAdmin(admin.ModelAdmin):
    list_display = ['lote_produccion', 'insumo', 'cantidad_real', 'fecha_consumo', 'registrado_por']
    list_filter = ['fecha_consumo']
    search_fields = ['lote_produccion__codigo_lote', 'insumo__nombre']
    date_hierarchy = 'fecha_consumo'


@admin.register(Repuesto)
class RepuestoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'stock_actual', 'stock_minimo', 'critico', 'activo']
    list_filter = ['categoria', 'critico', 'activo']
    search_fields = ['codigo', 'nombre']


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ['tipo_item', 'tipo_movimiento', 'motivo', 'cantidad', 'fecha_movimiento', 'registrado_por']
    list_filter = ['tipo_item', 'tipo_movimiento', 'motivo', 'fecha_movimiento']
    date_hierarchy = 'fecha_movimiento'
    readonly_fields = ['fecha_movimiento']


@admin.register(ProductoTerminado)
class ProductoTerminadoAdmin(admin.ModelAdmin):
    list_display = ['lote', 'cantidad', 'fecha_vencimiento', 'estado', 'ubicacion']
    list_filter = ['estado', 'fecha_vencimiento']
    search_fields = ['lote__codigo_lote']
    date_hierarchy = 'fecha_vencimiento'


@admin.register(AlertaInventario)
class AlertaInventarioAdmin(admin.ModelAdmin):
    list_display = ['tipo_item', 'tipo_alerta', 'nivel_urgencia', 'estado', 'fecha_generacion']
    list_filter = ['tipo_item', 'tipo_alerta', 'nivel_urgencia', 'estado']
    search_fields = ['mensaje']


@admin.register(ConteoFisico)
class ConteoFisicoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'tipo', 'ubicacion', 'fecha_planificada', 'estado']
    list_filter = ['tipo', 'estado', 'fecha_planificada']
    search_fields = ['codigo']
    date_hierarchy = 'fecha_planificada'
