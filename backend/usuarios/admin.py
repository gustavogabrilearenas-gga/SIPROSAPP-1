"""Configuración del admin para el dominio de usuarios."""

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import transaction

from backend.usuarios.models import UserProfile

User = get_user_model()


class UserProfileInline(admin.StackedInline):
    """Configuración inline para el perfil de usuario."""
    model = UserProfile
    can_delete = False
    verbose_name = "Perfil SIPROSA"
    verbose_name_plural = "Perfiles SIPROSA"
    max_num = 1
    min_num = 1
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

    def get_formset(self, request, obj=None, **kwargs):
        """Override to ensure the inline is properly initialized."""
        formset = super().get_formset(request, obj, **kwargs)
        formset.form.base_fields["area"].widget = admin.widgets.AdminRadioSelect(attrs={"class": "radiolist"})
        formset.form.base_fields["turno_habitual"].widget = admin.widgets.AdminRadioSelect(attrs={"class": "radiolist inline"})
        return formset


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





# Reemplazar el admin por defecto de User con nuestra versión personalizada
admin.site.unregister(get_user_model())
admin.site.register(get_user_model(), CustomUserAdmin)
