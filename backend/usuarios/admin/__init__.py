"""Configuraciones del admin para la aplicación usuarios."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db import transaction
from django.urls import reverse
from django.utils.html import format_html

from backend.usuarios.models import Rol, UserProfile, UsuarioRol


class UserProfileInline(admin.StackedInline):
    """Configuración inline para el perfil de usuario."""
    
    model = UserProfile
    can_delete = False
    verbose_name = "Perfil SIPROSA"
    verbose_name_plural = "Perfiles SIPROSA"
    max_num = 1
    min_num = 1
    fields = [
        "legajo",
        "area",
        "turno_habitual",
        "telefono",
        "fecha_ingreso",
        "activo",
        "foto_perfil",
    ]
    radio_fields = {
        "area": admin.VERTICAL,
        "turno_habitual": admin.HORIZONTAL,
    }


class CustomUserAdmin(BaseUserAdmin):
    """Configuración personalizada para el modelo User."""
    
    inlines = [UserProfileInline]
    list_display = ["username", "email", "first_name", "last_name", "is_staff", "is_active"]
    list_filter = ["is_staff", "is_superuser", "is_active", "groups"]
    search_fields = ["username", "first_name", "last_name", "email"]
    ordering = ["username"]
    
    def save_model(self, request, obj, form, change):
        """Asegura que el guardado del usuario y su perfil ocurra en una transacción."""
        with transaction.atomic():
            super().save_model(request, obj, form, change)


class RolAdmin(admin.ModelAdmin):
    """Configuración para el modelo Rol."""
    
    list_display = ["nombre", "activo"]
    list_filter = ["activo"]
    search_fields = ["nombre"]


class UsuarioRolAdmin(admin.ModelAdmin):
    """Configuración para el modelo UsuarioRol."""
    
    list_display = ["usuario_link", "rol_link", "fecha_asignacion", "asignado_por_link"]
    list_filter = ["rol", "fecha_asignacion"]
    search_fields = ["usuario__username", "rol__nombre"]
    date_hierarchy = "fecha_asignacion"
    list_select_related = ["usuario", "rol", "asignado_por"]
    raw_id_fields = ["usuario", "asignado_por"]
    autocomplete_fields = ["rol"]
    
    def usuario_link(self, obj):
        """Enlace al usuario en la lista."""
        url = reverse("admin:auth_user_change", args=[obj.usuario.id])
        return format_html('<a href="{}">{}</a>', url, obj.usuario.username)
    usuario_link.short_description = "Usuario"
    
    def rol_link(self, obj):
        """Enlace al rol en la lista."""
        url = reverse("admin:usuarios_rol_change", args=[obj.rol.id])
        return format_html('<a href="{}">{}</a>', url, obj.rol.nombre)
    rol_link.short_description = "Rol"
    
    def asignado_por_link(self, obj):
        """Enlace al usuario que asignó el rol."""
        if not obj.asignado_por:
            return "-"
        url = reverse("admin:auth_user_change", args=[obj.asignado_por.id])
        return format_html('<a href="{}">{}</a>', url, obj.asignado_por.username)
    asignado_por_link.short_description = "Asignado por"


# Quitar registros existentes si los hay
for model in [User, Rol, UsuarioRol]:
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

# Registrar los modelos con su configuración
admin.site.register(User, CustomUserAdmin)
admin.site.register(Rol, RolAdmin)
admin.site.register(UsuarioRol, UsuarioRolAdmin)