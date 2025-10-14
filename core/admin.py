"""
Configuración del Django Admin para SIPROSA MES
"""

from django.contrib import admin
from .models import (
    # Catálogos
    Ubicacion, Maquina, Producto, Formula,
    EtapaProduccion, Turno, TipoDocumento,
    # Notificaciones
    Notificacion,
)
# ============================================
# CATÁLOGOS MAESTROS
# ============================================

@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'activa']
    list_filter = ['tipo', 'activa']
    search_fields = ['codigo', 'nombre']


@admin.register(Maquina)
class MaquinaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'ubicacion', 'activa']
    list_filter = ['tipo', 'activa', 'ubicacion']
    search_fields = ['codigo', 'nombre', 'fabricante', 'modelo']
    readonly_fields = ['fecha_instalacion']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'forma_farmaceutica', 'principio_activo', 'activo']
    list_filter = ['forma_farmaceutica', 'activo', 'requiere_cadena_frio']
    search_fields = ['codigo', 'nombre', 'principio_activo']


@admin.register(Formula)
class FormulaAdmin(admin.ModelAdmin):
    list_display = ['producto', 'version', 'fecha_vigencia_desde', 'activa', 'aprobada_por']
    list_filter = ['activa', 'fecha_vigencia_desde']
    search_fields = ['producto__nombre', 'version']


@admin.register(EtapaProduccion)
class EtapaProduccionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'orden_tipico', 'activa']
    list_filter = ['activa']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden_tipico']


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'hora_inicio', 'hora_fin', 'activo']
    list_filter = ['activo']


@admin.register(TipoDocumento)
class TipoDocumentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'activo']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre']


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'tipo', 'titulo', 'leida', 'fecha_creacion']
    list_filter = ['tipo', 'leida', 'fecha_creacion']
    search_fields = ['usuario__username', 'titulo']
    date_hierarchy = 'fecha_creacion'


# Personalización del sitio admin
admin.site.site_header = "SIPROSA MES - Administración"
admin.site.site_title = "SIPROSA MES"
admin.site.index_title = "Sistema de Gestión de Manufactura"
