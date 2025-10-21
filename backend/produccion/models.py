"""Modelos del módulo de registro de producción."""

from django.db import models


class RegistroProduccion(models.Model):
    """Parte diario de producción."""

    UNIDAD_MEDIDA_CHOICES = [
        ("COMPRIMIDOS", "Comprimidos"),
        ("KILOGRAMOS", "Kilogramos"),
        ("LITROS", "Litros"),
        ("BLISTERS", "Blisters"),
    ]

    hora_inicio = models.DateTimeField()
    hora_fin = models.DateTimeField()
    producto = models.ForeignKey(
        "catalogos.Producto", on_delete=models.PROTECT, related_name="registros_produccion"
    )
    maquina = models.ForeignKey(
        "catalogos.Maquina", on_delete=models.PROTECT, related_name="registros_produccion"
    )
    formula = models.ForeignKey(
        "catalogos.Formula", on_delete=models.PROTECT, related_name="registros_produccion"
    )
    cantidad_producida = models.DecimalField(max_digits=12, decimal_places=2)
    unidad_medida = models.CharField(max_length=20, choices=UNIDAD_MEDIDA_CHOICES)
    observaciones = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de producción"
        verbose_name_plural = "Registros de producción"
        ordering = ("-hora_inicio", "-hora_fin")
        indexes = [
            models.Index(fields=("hora_inicio", "hora_fin")),
            models.Index(fields=("producto", "hora_inicio")),
            models.Index(fields=("maquina", "hora_inicio")),
        ]

    def __str__(self) -> str:
        return f"Registro {self.pk} - {self.producto} ({self.hora_inicio:%Y-%m-%d})"
