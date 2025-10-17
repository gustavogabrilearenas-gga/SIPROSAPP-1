"""
Configuración del Django Admin para SIPROSA MES
"""

from django.contrib import admin

from backend.auditoria.models import ElectronicSignature, LogAuditoria


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


@admin.register(ElectronicSignature)
class ElectronicSignatureAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'meaning', 'timestamp', 'content_type', 'object_str', 'is_valid']
    list_filter = ['action', 'meaning', 'is_valid', 'timestamp']
    search_fields = ['user__username', 'content_type', 'object_str', 'reason']
    date_hierarchy = 'timestamp'
    readonly_fields = [
        'user', 'action', 'meaning', 'timestamp', 'content_type', 'object_id',
        'object_str', 'reason', 'comments', 'password_hash', 'ip_address',
        'user_agent', 'data_hash', 'signature_hash', 'is_valid',
        'invalidated_at', 'invalidated_by', 'invalidation_reason'
    ]

    def has_add_permission(self, request):
        return False


# Personalización del sitio admin
admin.site.site_header = "SIPROSA MES - Administración"
admin.site.site_title = "SIPROSA MES"
admin.site.index_title = "Sistema de Gestión de Manufactura"
