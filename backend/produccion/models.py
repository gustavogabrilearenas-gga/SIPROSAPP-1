"""Modelos para el registro y seguimiento de la producción."""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class RegistroProduccionEtapa(models.Model):
    """Registro de una etapa específica en la producción."""

    registro = models.ForeignKey(
        "RegistroProduccion",
        on_delete=models.CASCADE,
        related_name="etapas"
    )
    etapa = models.ForeignKey(
        "catalogos.FormulaEtapa",
        on_delete=models.PROTECT,
        related_name="registros_produccion"
    )
    hora_inicio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hora de inicio",
        help_text="Hora real de inicio de la etapa"
    )
    hora_fin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hora de fin",
        help_text="Hora real de finalización de la etapa"
    )
    duracion_real = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Duración real (min)",
        help_text="Duración real de la etapa en minutos"
    )
    maquina = models.ForeignKey(
        "catalogos.Maquina",
        on_delete=models.PROTECT,
        related_name="registros_etapas_produccion",
        null=True,
        blank=True
    )
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Cantidad procesada en esta etapa"
    )
    unidad = models.CharField(
        max_length=20,
        blank=True,
        help_text="Unidad de medida para la cantidad"
    )
    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones específicas de esta etapa"
    )
    completada = models.BooleanField(
        default=False,
        help_text="Indica si la etapa está completada"
    )

    class Meta:
        verbose_name = "Etapa de producción"
        verbose_name_plural = "Etapas de producción"
        ordering = ['etapa__orden']

    def __str__(self):
        return f"{self.registro} - {self.etapa}"

    def clean(self):
        if self.hora_fin and self.hora_inicio and self.hora_fin <= self.hora_inicio:
            raise ValidationError({
                "hora_fin": "La hora de fin debe ser posterior a la hora de inicio"
            })
        
        if self.completada:
            if not self.hora_inicio or not self.hora_fin:
                raise ValidationError(
                    "Para marcar como completada, debe especificar hora de inicio y fin"
                )
            if not self.maquina:
                raise ValidationError(
                    "Para marcar como completada, debe especificar la máquina utilizada"
                )

        if self.hora_inicio and self.hora_fin:
            diferencia = self.hora_fin - self.hora_inicio
            self.duracion_real = int(diferencia.total_seconds() / 60)


class RegistroProduccion(models.Model):
    """Registro de producción."""

    ESTADO_CHOICES = [
        ('CREADO', 'Creado - Pendiente de procesar'),
        ('EN_PROCESO', 'En proceso'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='CREADO',
        help_text="Estado actual del registro de producción"
    )
    producto = models.ForeignKey(
        "catalogos.Producto",
        on_delete=models.PROTECT,
        related_name="registros_produccion"
    )
    formula = models.ForeignKey(
        "catalogos.Formula",
        on_delete=models.PROTECT,
        related_name="registros_produccion"
    )
    maquina = models.ForeignKey(
        "catalogos.Maquina",
        on_delete=models.PROTECT,
        related_name="registros_produccion",
        null=True,
        blank=True,
    )
    turno = models.ForeignKey(
        "catalogos.Turno",
        on_delete=models.PROTECT,
        related_name="registros_produccion",
        null=True,
        blank=True,
    )
    hora_inicio = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Hora programada o real de inicio",
    )
    hora_fin = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Hora programada o real de finalización",
    )
    cantidad_producida = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text="Cantidad total fabricada en la orden",
    )
    unidad_medida = models.CharField(
        max_length=20,
        blank=True,
        help_text="Unidad de medida de la cantidad producida",
    )
    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones generales sobre la producción"
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="registros_produccion",
        help_text="Usuario que registró la producción",
        editable=False
    )
    fecha_registro = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha y hora en que se registró la producción"
    )

    class Meta:
        verbose_name = "Registro de producción"
        verbose_name_plural = "Registros de producción"
        ordering = ["-fecha_registro"]
        indexes = [
            models.Index(fields=["estado"]),
            models.Index(fields=["producto"]),
            models.Index(fields=["formula"]),
            models.Index(fields=["registrado_por"]),
            models.Index(fields=["maquina"]),
            models.Index(fields=["turno"]),
        ]

    def __str__(self):
        return (
            f"Producción de {self.producto} - "
            f"Fórmula {self.formula.codigo} - "
            f"{self.get_estado_display()}"
        )

    def clean(self):
        if self.hora_inicio and self.hora_fin and self.hora_fin <= self.hora_inicio:
            raise ValidationError(
                {"hora_fin": "La hora de fin debe ser posterior a la hora de inicio"}
            )
        if self.formula_id and self.producto_id and self.formula.producto_id != self.producto_id:
            raise ValidationError(
                {"formula": "La fórmula seleccionada no corresponde al producto"}
            )
        if self.cantidad_producida is not None and self.cantidad_producida <= 0:
            raise ValidationError(
                {"cantidad_producida": "Debe registrar una cantidad mayor a cero"}
            )

    def actualizar_estado(self):
        """Actualiza el estado basado en las etapas."""
        if not self.etapas.exists():
            return

        etapas_completadas = self.etapas.filter(completada=True).count()
        total_etapas = self.etapas.count()

        if etapas_completadas == 0:
            self.estado = 'CREADO'
        elif etapas_completadas == total_etapas:
            self.estado = 'COMPLETADO'
        else:
            self.estado = 'EN_PROCESO'

    def save(self, *args, **kwargs):
        self.clean()
        # Solo actualizar estado si ya existe el registro
        if self.pk:
            self.actualizar_estado()
        super().save(*args, **kwargs)