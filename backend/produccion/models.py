"""Modelos del dominio de producción."""

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, F, Q


class RegistroProduccion(models.Model):
    """Registro de un lote/producto producido en una máquina."""

    class UnidadMedida(models.TextChoices):
        COMPRIMIDOS = "COMPRIMIDOS", "Comprimidos"
        KG = "KG", "Kilogramos"
        LITROS = "LITROS", "Litros"
        BLISTERS = "BLISTERS", "Blisters"

    fecha_produccion = models.DateField()
    maquina = models.ForeignKey(
        "catalogos.Maquina",
        on_delete=models.PROTECT,
        related_name="registros_produccion",
        db_index=True,
    )
    producto = models.ForeignKey(
        "catalogos.Producto",
        on_delete=models.PROTECT,
        related_name="registros_produccion",
        db_index=True,
    )
    formula = models.ForeignKey(
        "catalogos.Formula",
        on_delete=models.PROTECT,
        related_name="registros_produccion",
        db_index=True,
    )
    unidad_medida = models.CharField(
        max_length=20,
        choices=UnidadMedida.choices,
    )
    cantidad_producida = models.DecimalField(
        max_digits=12,
        decimal_places=3,
    )
    hora_inicio = models.DateTimeField()
    hora_fin = models.DateTimeField()
    observaciones = models.TextField(blank=True)
    registrado_en = models.DateTimeField(auto_now_add=True, editable=False)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        editable=False,
        related_name="registros_produccion",
    )

    class Meta:
        ordering = ("-registrado_en", "-fecha_produccion", "-id")
        indexes = [
            models.Index(fields=["fecha_produccion"]),
            models.Index(fields=["maquina"]),
            models.Index(fields=["producto"]),
            models.Index(fields=["registrado_en"]),
        ]
        constraints = [
            CheckConstraint(
                check=Q(cantidad_producida__gt=0),
                name="produccion_registro_cantidad_mayor_cero",
            ),
            CheckConstraint(
                check=Q(hora_fin__gt=F("hora_inicio")),
                name="produccion_registro_hora_fin_mayor_inicio",
            ),
        ]
        verbose_name = "Registro de producción"
        verbose_name_plural = "Registros de producción"

    def clean(self):
        errors = {}
        if self.cantidad_producida is not None and self.cantidad_producida <= Decimal("0"):
            errors["cantidad_producida"] = "La cantidad producida debe ser mayor que cero."
        if self.hora_inicio and self.hora_fin and self.hora_fin <= self.hora_inicio:
            errors["hora_fin"] = "La hora de fin debe ser posterior a la hora de inicio."
        if (
            self.formula_id
            and self.producto_id
            and self.formula.producto_id != self.producto_id
        ):
            errors["formula"] = "La fórmula seleccionada no corresponde al producto indicado."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if not kwargs.pop("skip_validation", False):
            self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - representación legible simple
        return f"Registro #{self.pk or 'nuevo'} - {self.producto}"
