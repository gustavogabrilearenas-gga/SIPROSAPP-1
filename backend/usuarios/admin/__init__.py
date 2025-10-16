"""Configuraciones del admin para la aplicación usuarios."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db import transaction

from backend.usuarios.models import UserProfile


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


# Quitar registro existente de User si existe
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

# Registrar User con configuración personalizada
admin.site.register(User, CustomUserAdmin)