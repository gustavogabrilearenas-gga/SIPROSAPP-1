"""Modelos para el registro y seguimiento del mantenimiento de máquinas."""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class RegistroMantenimiento(models.Model):
    """Registro de mantenimientos realizados a las máquinas."""
    
    TIPO_CHOICES = [
        ('CORRECTIVO', 'Correctivo'),
        ('AUTONOMO', 'Autónomo'),
        ('PREVENTIVO', 'Preventivo'),
    ]

    hora_inicio = models.DateTimeField(
        verbose_name="Hora de inicio",
        help_text="Hora real de inicio del mantenimiento"
    )
    hora_fin = models.DateTimeField(
        verbose_name="Hora de fin",
        help_text="Hora real de finalización del mantenimiento"
    )
    maquina = models.ForeignKey(
        "catalogos.Maquina",
        on_delete=models.PROTECT,
        related_name="registros_mantenimiento",
        verbose_name="Máquina"
    )
    tipo_mantenimiento = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name="Tipo de mantenimiento"
    )
    descripcion = models.TextField(
        verbose_name="Descripción",
        help_text="Descripción detallada del mantenimiento realizado"
    )
    tiene_anomalias = models.BooleanField(
        default=False,
        verbose_name="¿Se detectaron anomalías?",
        help_text="Indica si se encontraron anomalías durante el mantenimiento"
    )
    descripcion_anomalias = models.TextField(
        blank=True,
        verbose_name="Descripción de anomalías",
        help_text="Descripción detallada de las anomalías encontradas (requerido si se detectaron anomalías)"
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name="Observaciones",
        help_text="Observaciones adicionales sobre el mantenimiento"
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="registros_mantenimiento",
        help_text="Usuario que registró el mantenimiento",
        editable=False  # No se puede editar el campo
    )
    fecha_registro = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha y hora en que se registró el mantenimiento"
    )

    class Meta:
        verbose_name = "Registro de mantenimiento"
        verbose_name_plural = "Registros de mantenimiento"
        ordering = ["-hora_inicio"]
        indexes = [
            models.Index(fields=["hora_inicio", "hora_fin"]),
            models.Index(fields=["maquina"]),
            models.Index(fields=["tipo_mantenimiento"]),
            models.Index(fields=["registrado_por"]),
            models.Index(fields=["tiene_anomalias"]),
        ]

    def __str__(self):
        return (
            f"Mantenimiento {self.get_tipo_mantenimiento_display()} - "
            f"{self.maquina} - {self.hora_inicio.date()}"
        )

    def clean(self):
        """Validaciones del modelo."""
        from django.utils import timezone

        # Validar que hora_fin sea posterior a hora_inicio
        if self.hora_fin and self.hora_inicio and self.hora_fin <= self.hora_inicio:
            raise ValidationError({
                "hora_fin": "La hora de fin debe ser posterior a la hora de inicio"
            })

        # Validar que las horas no sean futuras
        now = timezone.now()
        if self.hora_inicio and self.hora_inicio > now:
            raise ValidationError({
                "hora_inicio": "La hora de inicio no puede ser futura"
            })
        if self.hora_fin and self.hora_fin > now:
            raise ValidationError({
                "hora_fin": "La hora de fin no puede ser futura"
            })

        # Validar que si hay anomalías, se proporcione su descripción
        if self.tiene_anomalias and not self.descripcion_anomalias:
            raise ValidationError({
                "descripcion_anomalias": "Debe proporcionar una descripción de las anomalías encontradas"
            })

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)