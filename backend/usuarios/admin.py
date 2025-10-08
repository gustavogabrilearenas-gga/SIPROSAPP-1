"""Configuración del admin para el dominio de usuarios."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from backend.usuarios.models import Rol, UserProfile, UsuarioRol


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Perfil"
    fk_name = "user"
    fields = [
        "legajo",
        "area",
        "turno_habitual",
        "telefono",
        "fecha_ingreso",
        "activo",
        "foto_perfil",
    ]

    def get_extra(self, request, obj=None, **kwargs):
        if obj and not hasattr(obj, "profile"):
            return 1
        return 0


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ["nombre", "activo"]
    list_filter = ["activo"]
    search_fields = ["nombre"]


@admin.register(UsuarioRol)
class UsuarioRolAdmin(admin.ModelAdmin):
    list_display = ["usuario", "rol", "fecha_asignacion", "asignado_por"]
    list_filter = ["rol", "fecha_asignacion"]
    search_fields = ["usuario__username", "rol__nombre"]
    date_hierarchy = "fecha_asignacion"
