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


