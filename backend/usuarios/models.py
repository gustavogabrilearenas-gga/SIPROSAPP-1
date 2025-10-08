"""Modelos del dominio de usuarios."""

from django.contrib.auth.models import User
from django.db import models


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

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
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
        app_label = "core"

    def __str__(self) -> str:  # pragma: no cover - repr simple
        return f"{self.user.get_full_name() or self.user.username} ({self.legajo})"


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
        app_label = "core"

    def __str__(self) -> str:  # pragma: no cover - repr simple
        return self.nombre


class UsuarioRol(models.Model):
    """Relación muchos a muchos entre usuarios y roles."""

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="roles_asignados")
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name="usuarios")
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    asignado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="roles_que_asigno",
    )

    class Meta:
        verbose_name = "Asignación de Rol"
        verbose_name_plural = "Asignaciones de Roles"
        unique_together = ["usuario", "rol"]
        app_label = "core"

    def __str__(self) -> str:  # pragma: no cover - repr simple
        return f"{self.usuario.username} - {self.rol.nombre}"
