"""Modelos del dominio de usuarios."""

from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.functional import cached_property


class UserProfile(models.Model):
    """Perfil extendido de usuario con datos específicos de SIPROSA."""

    AREA_CHOICES = [
        ("PRODUCCION", "Producción"),
        ("MANTENIMIENTO", "Mantenimiento"),
        ("ALMACEN", "Almacén"),
        ("CALIDAD", "Calidad"),
        ("ADMINISTRACION", "Administración"),
    ]

    TURNO_CHOICES = [
        ("M", "Mañana"),
        ("T", "Tarde"),
        ("N", "Noche"),
        ("R", "Rotativo"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_profile',
        verbose_name='Usuario'
    )
    legajo = models.CharField(max_length=20, unique=True, verbose_name="Legajo", null=True, blank=True)
    area = models.CharField(max_length=20, choices=AREA_CHOICES, null=True, blank=True)
    turno_habitual = models.CharField(max_length=2, choices=TURNO_CHOICES, null=True, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    fecha_ingreso = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    foto_perfil = models.ImageField(upload_to="perfiles/", null=True, blank=True)

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuarios"
        ordering = ["user__username"]
        app_label = "usuarios"

    @cached_property
    def nombre_completo(self):
        return self.user.get_full_name() or self.user.username

    def __str__(self) -> str:  # pragma: no cover - repr simple
        return f"{self.nombre_completo} ({self.legajo or 'Sin legajo'})"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """Crea un perfil cuando se crea un usuario."""
    if created:
        UserProfile.objects.create(user=instance)


class Rol(models.Model):
    """Roles del sistema con permisos específicos."""

    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    permisos = models.JSONField(default=dict, help_text="Estructura: {modulo: [acciones]}")
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ["nombre"]
        app_label = "usuarios"

    def __str__(self) -> str:  # pragma: no cover - repr simple
        return self.nombre


class UsuarioRol(models.Model):
    """Relación muchos a muchos entre usuarios y roles."""

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="roles_asignados",
        verbose_name="Usuario"
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.CASCADE,
        related_name="usuarios",
        verbose_name="Rol"
    )
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Asignación"
    )
    asignado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="roles_que_asigno",
        verbose_name="Asignado por"
    )

    class Meta:
        verbose_name = "Asignación de Rol"
        verbose_name_plural = "Asignaciones de Roles"
        unique_together = ["usuario", "rol"]
        app_label = "usuarios"

    def __str__(self) -> str:  # pragma: no cover - repr simple
        return f"{self.usuario.username} - {self.rol.nombre}"
