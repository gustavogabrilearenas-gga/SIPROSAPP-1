"""Configuración del admin para el dominio de usuarios."""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.db import transaction

from backend.usuarios.models import UserProfile

User = get_user_model()


class CustomUserCreationForm(UserCreationForm):
    """Formulario de creación que exige datos básicos."""

    class Meta(UserCreationForm.Meta):
        fields = ("username", "first_name", "last_name", "email")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["first_name"].required = True
        self.fields["last_name"].required = True
        self.fields["email"].required = True


class CustomUserChangeForm(UserChangeForm):
    """Formulario de edición que marca email como obligatorio."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["email"].required = True
        self.fields["first_name"].required = True
        self.fields["last_name"].required = True


class UserProfileInline(admin.StackedInline):
    """Configuración inline para el perfil de usuario."""

    model = UserProfile
    fk_name = "user"
    can_delete = False
    max_num = 1
    min_num = 1
    fields = [
        "legajo",
        "dni",
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

    def formfield_for_foreignkey(self, db_field, request=None, **kwargs):
        if db_field.name == "funcion":
            kwargs["queryset"] = db_field.related_model.objects.filter(activa=True)
        if db_field.name == "turno_habitual":
            kwargs["queryset"] = db_field.related_model.objects.filter(activo=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class CustomUserAdmin(BaseUserAdmin):
    """Configuración personalizada para el modelo User."""

    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    inlines = [UserProfileInline]
    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "get_legajo",
        "get_dni",
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
                ),
            },
        ),
    )

    @admin.display(description="Legajo", ordering="user_profile__legajo")
    def get_legajo(self, obj):
        profile = getattr(obj, "user_profile", None)
        return profile.legajo if profile and profile.legajo else ""

    @admin.display(description="DNI", ordering="user_profile__dni")
    def get_dni(self, obj):
        profile = getattr(obj, "user_profile", None)
        return profile.dni if profile and profile.dni else ""

    def save_model(self, request, obj, form, change):
        """Asegura que el guardado del usuario y su perfil ocurra en una transacción."""
        with transaction.atomic():
            super().save_model(request, obj, form, change)





# Reemplazar el admin por defecto de User con nuestra versión personalizada
admin.site.unregister(get_user_model())
admin.site.register(get_user_model(), CustomUserAdmin)
