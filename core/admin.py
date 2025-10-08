"""
Configuración del Django Admin para SIPROSA MES
"""

from django.contrib import admin
from .models import (
    # Catálogos
    Ubicacion, Maquina, Producto, Formula,
    EtapaProduccion, Turno, TipoDocumento,
    # Incidentes
    TipoIncidente, Incidente, InvestigacionIncidente, AccionCorrectiva,
    # Auditoría
    LogAuditoria, Notificacion,
)
from backend.inventario.models import FormulaInsumo


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


class FormulaInsumoInline(admin.TabularInline):
    model = FormulaInsumo
    extra = 1


@admin.register(Formula)
class FormulaAdmin(admin.ModelAdmin):
    list_display = ['producto', 'version', 'fecha_vigencia_desde', 'activa', 'aprobada_por']
    list_filter = ['activa', 'fecha_vigencia_desde']
    search_fields = ['producto__nombre', 'version']
    inlines = [FormulaInsumoInline]


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


# ============================================
# INCIDENTES
# ============================================

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


@admin.register(InvestigacionIncidente)
class InvestigacionIncidenteAdmin(admin.ModelAdmin):
    list_display = ['incidente', 'metodologia', 'fecha_investigacion', 'investigado_por']
    list_filter = ['metodologia', 'fecha_investigacion']


@admin.register(AccionCorrectiva)
class AccionCorrectivaAdmin(admin.ModelAdmin):
    list_display = ['incidente', 'tipo', 'estado', 'responsable', 'fecha_planificada', 'eficacia_verificada']
    list_filter = ['tipo', 'estado', 'eficacia_verificada']
    date_hierarchy = 'fecha_planificada'


# ============================================
# AUDITORÍA
# ============================================

@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'accion', 'modelo', 'objeto_str', 'fecha']
    list_filter = ['accion', 'modelo', 'fecha']
    search_fields = ['usuario__username', 'modelo', 'objeto_str']
    date_hierarchy = 'fecha'
    readonly_fields = ['usuario', 'accion', 'modelo', 'objeto_id', 'objeto_str', 'cambios', 'ip_address', 'user_agent', 'fecha']
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


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