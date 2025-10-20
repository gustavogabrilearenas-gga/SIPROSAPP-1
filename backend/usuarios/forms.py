from django import forms
from django.apps import apps
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

User = get_user_model()
Funcion = apps.get_model("catalogos", "Funcion")
Turno = apps.get_model("catalogos", "Turno")
UserProfile = apps.get_model("usuarios", "UserProfile")


class UserWithProfileCreationForm(UserCreationForm):
    """Formulario de creación que combina campos de usuario y perfil."""

    first_name = forms.CharField(required=True, label="Nombre")
    last_name = forms.CharField(required=True, label="Apellido")
    email = forms.EmailField(required=True, label="Dirección de email")

    legajo = forms.CharField(required=False, label="Legajo")
    dni = forms.CharField(required=False, label="DNI")
    funcion = forms.ModelChoiceField(
        queryset=Funcion.objects.filter(activa=True), required=False, label="Función"
    )
    turno_habitual = forms.ModelChoiceField(
        queryset=Turno.objects.filter(activo=True), required=False, label="Turno habitual"
    )
    telefono = forms.CharField(required=False, label="Teléfono")
    fecha_ingreso = forms.DateField(required=False, label="Fecha ingreso")
    activo = forms.BooleanField(required=False, initial=True, label="Activo")
    foto_perfil = forms.ImageField(required=False, label="Foto perfil")

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "first_name", "last_name", "email")

    @transaction.atomic
    def save(self, commit=True):
        user = super().save(commit=True)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        cd = self.cleaned_data
        profile.legajo = cd.get("legajo") or ""
        profile.dni = cd.get("dni") or ""
        profile.funcion = cd.get("funcion")
        profile.turno_habitual = cd.get("turno_habitual")
        profile.telefono = cd.get("telefono") or ""
        profile.fecha_ingreso = cd.get("fecha_ingreso")
        profile.activo = cd.get("activo", True)
        if cd.get("foto_perfil"):
            profile.foto_perfil = cd["foto_perfil"]
        profile.save()
        return user


class UserWithProfileChangeForm(UserChangeForm):
    """Formulario de edición que incluye campos del perfil."""

    legajo = forms.CharField(required=False, label="Legajo")
    dni = forms.CharField(required=False, label="DNI")
    funcion = forms.ModelChoiceField(
        queryset=Funcion.objects.filter(activa=True), required=False, label="Función"
    )
    turno_habitual = forms.ModelChoiceField(
        queryset=Turno.objects.filter(activo=True), required=False, label="Turno habitual"
    )
    telefono = forms.CharField(required=False, label="Teléfono")
    fecha_ingreso = forms.DateField(required=False, label="Fecha ingreso")
    activo = forms.BooleanField(required=False, label="Activo")
    foto_perfil = forms.ImageField(required=False, label="Foto perfil")

    class Meta(UserChangeForm.Meta):
        model = User
        fields = ("username", "first_name", "last_name", "email", "password")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["first_name"].required = True
        self.fields["last_name"].required = True
        self.fields["email"].required = True
        if self.instance and self.instance.pk:
            profile = getattr(self.instance, "user_profile", None)
            if profile:
                self.fields["legajo"].initial = profile.legajo
                self.fields["dni"].initial = profile.dni
                self.fields["funcion"].initial = profile.funcion
                self.fields["turno_habitual"].initial = profile.turno_habitual
                self.fields["telefono"].initial = profile.telefono
                self.fields["fecha_ingreso"].initial = profile.fecha_ingreso
                self.fields["activo"].initial = profile.activo

    @transaction.atomic
    def save(self, commit=True):
        user = super().save(commit=True)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        cd = self.cleaned_data
        profile.legajo = cd.get("legajo") or ""
        profile.dni = cd.get("dni") or ""
        profile.funcion = cd.get("funcion")
        profile.turno_habitual = cd.get("turno_habitual")
        profile.telefono = cd.get("telefono") or ""
        profile.fecha_ingreso = cd.get("fecha_ingreso")
        if "activo" in self.fields:
            profile.activo = bool(cd.get("activo", profile.activo))
        if cd.get("foto_perfil"):
            profile.foto_perfil = cd["foto_perfil"]
        profile.save()
        return user
