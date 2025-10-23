"""Modelos del dominio de usuarios."""

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Q
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.functional import cached_property


class UserProfile(models.Model):
    """Perfil extendido de usuario con datos específicos de SIPROSA."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_profile',
        verbose_name='Usuario'
    )
    legajo = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    dni = models.CharField(
        max_length=12,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        validators=[
            RegexValidator(
                r"^\d{7,12}$",
                "DNI debe tener 7 a 12 dígitos",
            )
        ],
    )
    funcion = models.ForeignKey(
        "catalogos.Funcion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios",
    )
    turno_habitual = models.ForeignKey(
        "catalogos.Turno",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios",
    )
    telefono = models.CharField(max_length=50, blank=True)
    fecha_ingreso = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    foto_perfil = models.ImageField(upload_to="perfiles/", null=True, blank=True)

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuarios"
        ordering = ["user__username"]
        app_label = "usuarios"
        constraints = [
            models.UniqueConstraint(
                fields=["legajo"],
                name="usuarios_userprofile_legajo_unico",
                condition=Q(legajo__isnull=False) & ~Q(legajo=""),
            )
        ]

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


