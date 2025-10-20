"""Configuración del admin para el dominio de usuarios."""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import transaction

from backend.usuarios.models import UserProfile

User = get_user_model()


class UserProfileInline(admin.StackedInline):
    """Configuración inline para el perfil de usuario."""

    model = UserProfile
    fk_name = "user"
    can_delete = False
    max_num = 1
    min_num = 1
    fields = [
        "legajo",
        "funcion",
        "turno_habitual",
        "telefono",
        "fecha_ingreso",
        "activo",
        "foto_perfil",
    ]
    radio_fields = {
        "funcion": admin.VERTICAL,
        "turno_habitual": admin.HORIZONTAL,
    }


class CustomUserAdmin(BaseUserAdmin):
    """Configuración personalizada para el modelo User."""

    inlines = [UserProfileInline]
    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "get_legajo",
        "is_staff",
        "is_active",
    ]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
        "user_profile__legajo",
        "user_profile__funcion__nombre",
    ]
    list_filter = [
        "is_staff",
        "is_superuser",
        "is_active",
        "groups",
        "user_profile__funcion",
    ]
    ordering = ["username"]

    @admin.display(description="Legajo", ordering="user_profile__legajo")
    def get_legajo(self, obj):
        profile = getattr(obj, "user_profile", None)
        return profile.legajo if profile and profile.legajo else ""

    def save_model(self, request, obj, form, change):
        """Asegura que el guardado del usuario y su perfil ocurra en una transacción."""
        with transaction.atomic():
            super().save_model(request, obj, form, change)





# Reemplazar el admin por defecto de User con nuestra versión personalizada
admin.site.unregister(get_user_model())
admin.site.register(get_user_model(), CustomUserAdmin)
