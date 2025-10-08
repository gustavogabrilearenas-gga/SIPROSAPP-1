"""Admin del dominio de auditoría"""

from django.contrib import admin

from .models import LogAuditoria


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
