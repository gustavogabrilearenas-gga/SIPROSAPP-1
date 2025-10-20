"""Configuración del admin para el dominio de usuarios."""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from backend.usuarios.models import UserProfile
from .forms import UserWithProfileCreationForm, UserWithProfileChangeForm

User = get_user_model()


class CustomUserAdmin(BaseUserAdmin):
    """Admin personalizado que combina campos de usuario y perfil."""

    form = UserWithProfileChangeForm
    add_form = UserWithProfileCreationForm
    inlines = []
    list_display = [
        "username",
        "first_name",
        "last_name",
        "email",
        "is_staff",
        "is_active",
    ]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
        "user_profile__dni",
        "user_profile__legajo",
        "user_profile__funcion__nombre",
    ]
    list_filter = [
        "is_staff",
        "is_superuser",
        "is_active",
        "groups",
        "user_profile__funcion",
        "user_profile__turno_habitual",
    ]
    ordering = ["username"]
    readonly_fields = ("last_login", "date_joined")

    fieldsets = (
        ("Credenciales", {"fields": ("username", "password")}),
        ("Datos personales", {"fields": ("first_name", "last_name", "email")}),
        (
            "Perfil de usuario",
            {
                "fields": (
                    "legajo",
                    "dni",
                    "funcion",
                    "turno_habitual",
                    "telefono",
                    "fecha_ingreso",
                    "activo",
                    "foto_perfil",
                )
            },
        ),
        (
            "Permisos",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Trazas", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "first_name",
                    "last_name",
                    "email",
                    "password1",
                    "password2",
                    "legajo",
                    "dni",
                    "funcion",
                    "turno_habitual",
                    "telefono",
                    "fecha_ingreso",
                    "activo",
                    "foto_perfil",
                ),
            },
        ),
    )

    def get_form(self, request, obj=None, **kwargs):
        """Envuelve widgets de FKs para mostrar acciones relacionadas."""

        BaseForm = super().get_form(request, obj, **kwargs)

        admin_site = self.admin_site
        rel_funcion = UserProfile._meta.get_field("funcion").remote_field
        rel_turno = UserProfile._meta.get_field("turno_habitual").remote_field

        class FormWithRelated(BaseForm):
            def __init__(self, *args, **kw):
                super().__init__(*args, **kw)

                if "funcion" in self.fields:
                    self.fields["funcion"].widget = admin.widgets.RelatedFieldWidgetWrapper(
                        self.fields["funcion"].widget,
                        rel_funcion,
                        admin_site,
                        can_add_related=True,
                        can_change_related=True,
                        can_view_related=True,
                    )

                if "turno_habitual" in self.fields:
                    self.fields["turno_habitual"].widget = admin.widgets.RelatedFieldWidgetWrapper(
                        self.fields["turno_habitual"].widget,
                        rel_turno,
                        admin_site,
                        can_add_related=True,
                        can_change_related=True,
                        can_view_related=True,
                    )

        return FormWithRelated


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
