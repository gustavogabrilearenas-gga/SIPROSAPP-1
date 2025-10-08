"""
Configuración del Django Admin para SIPROSA MES
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    # Usuarios
    UserProfile, Rol, UsuarioRol,
    # Catálogos
    Ubicacion, Maquina, Producto, Formula, FormulaInsumo,
    EtapaProduccion, Turno, TipoDocumento,
    # Producción
    Lote, LoteEtapa, Parada, ControlCalidad, LoteDocumento,
    # Inventario
    CategoriaInsumo, Insumo, LoteInsumo, LoteInsumoConsumo,
    Repuesto, MovimientoInventario, ProductoTerminado,
    AlertaInventario, ConteoFisico,
    # Mantenimiento
    TipoMantenimiento, PlanMantenimiento, OrdenTrabajo,
    OrdenTrabajoRepuesto, HistorialMantenimiento, IndicadorMantenimiento,
    # Incidentes
    TipoIncidente, Incidente, InvestigacionIncidente, AccionCorrectiva,
    # Auditoría
    LogAuditoria, Notificacion,
)


# ============================================
# USUARIOS Y PERMISOS
# ============================================

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Perfil'
    fk_name = 'user'
    fields = ['legajo', 'area', 'turno_habitual', 'telefono', 'fecha_ingreso', 'activo', 'foto_perfil']
    
    def get_extra(self, request, obj=None, **kwargs):
        """Si el usuario no tiene perfil, mostrar el formulario para crearlo"""
        if obj and not hasattr(obj, 'profile'):
            return 1
        return 0


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre']


@admin.register(UsuarioRol)
class UsuarioRolAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'rol', 'fecha_asignacion', 'asignado_por']
    list_filter = ['rol', 'fecha_asignacion']
    search_fields = ['usuario__username', 'rol__nombre']
    date_hierarchy = 'fecha_asignacion'


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
# PRODUCCIÓN
# ============================================

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


# ============================================
# INVENTARIO
# ============================================

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
    date_hierarchy = 'fecha_generacion'


@admin.register(ConteoFisico)
class ConteoFisicoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'tipo', 'estado', 'fecha_planificada', 'responsable']
    list_filter = ['tipo', 'estado', 'fecha_planificada']
    search_fields = ['codigo']
    date_hierarchy = 'fecha_planificada'


# ============================================
# MANTENIMIENTO
# ============================================

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