"""Modelos del dominio de Producción"""

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from backend.catalogos.models import Producto, Formula, EtapaProduccion, Maquina, Turno


class RegistroProduccion(models.Model):
    """Registro de observaciones de producción."""

    fecha_produccion = models.DateField(db_index=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="registros_produccion",
    )
    turno = models.ForeignKey(
        Turno,
        on_delete=models.PROTECT,
        related_name="registros_produccion",
    )
    hubo_produccion = models.BooleanField()
    maquina = models.ForeignKey(
        Maquina,
        on_delete=models.PROTECT,
        related_name="registros_produccion",
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name="registros_produccion",
    )

    UNIDAD_CHOICES = [
        ("COMPRIMIDOS", "Comprimidos"),
        ("KG", "Kilogramos"),
        ("LITROS", "Litros"),
        ("BLISTERS", "Blisters"),
    ]
    unidad_medida = models.CharField(max_length=20, choices=UNIDAD_CHOICES)
    cantidad_producida = models.DecimalField(max_digits=10, decimal_places=2)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    observaciones = models.TextField(blank=True)

    class Meta:
        managed = False
        db_table = "eventos_registroproduccion"
        verbose_name = "Registro de Producción"
        verbose_name_plural = "Registros de Producción"
        ordering = ["-fecha_produccion", "-fecha_registro"]
        indexes = [
            models.Index(fields=["-fecha_produccion", "maquina_id"]),
            models.Index(fields=["maquina_id", "fecha_produccion", "turno_id"]),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.hora_fin and self.hora_inicio and self.hora_fin <= self.hora_inicio:
            raise ValidationError(
                {"hora_fin": "La hora de fin debe ser posterior a la hora de inicio."}
            )


class Lote(models.Model):
    """Orden de producción (Batch Record)"""

    ESTADO_CHOICES = [
        ('PLANIFICADO', 'Planificado'),
        ('EN_PROCESO', 'En Proceso'),
        ('PAUSADO', 'Pausado'),
        ('FINALIZADO', 'Finalizado'),
        ('CANCELADO', 'Cancelado'),
        ('RECHAZADO', 'Rechazado'),
        ('LIBERADO', 'Liberado'),
    ]

    PRIORIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]

    codigo_lote = models.CharField(max_length=50, unique=True, verbose_name="Código de Lote")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='lotes')
    formula = models.ForeignKey(Formula, on_delete=models.PROTECT, related_name='lotes')
    cantidad_planificada = models.IntegerField(validators=[MinValueValidator(1)])
    cantidad_producida = models.IntegerField(default=0)
    cantidad_rechazada = models.IntegerField(default=0)
    unidad = models.CharField(max_length=20)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PLANIFICADO')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='NORMAL')
    fecha_planificada_inicio = models.DateTimeField()
    fecha_real_inicio = models.DateTimeField(null=True, blank=True)
    fecha_planificada_fin = models.DateTimeField()
    fecha_real_fin = models.DateTimeField(null=True, blank=True)
    turno = models.ForeignKey(Turno, on_delete=models.PROTECT, related_name='lotes')
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='lotes_supervisados',
    )
    observaciones = models.TextField(blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='lotes_creados',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    cancelado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lotes_cancelados'
    )
    fecha_cancelacion = models.DateTimeField(null=True, blank=True)
    motivo_cancelacion = models.TextField(blank=True, verbose_name="Motivo de cancelación")
    visible = models.BooleanField(default=True, verbose_name="Visible en listado")

    class Meta:
        verbose_name = "Lote de Producción"
        verbose_name_plural = "Lotes de Producción"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['estado', 'visible'], name='lote_estado_visible_idx'),
            models.Index(fields=['producto', 'estado'], name='lote_prod_estado_idx'),
            models.Index(fields=['turno', 'estado'], name='lote_turno_estado_idx'),
            models.Index(fields=['fecha_real_inicio'], name='lote_fecha_inicio_idx'),
        ]

    def __str__(self):
        return f"{self.codigo_lote} - {self.producto.nombre}"

    @property
    def rendimiento_porcentaje(self):
        """Calcula el rendimiento real vs planificado"""
        if self.cantidad_planificada > 0:
            return round((self.cantidad_producida / self.cantidad_planificada) * 100, 2)
        return 0


class LoteEtapa(models.Model):
    """Etapas ejecutadas en un lote específico"""

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En Proceso'),
        ('PAUSADO', 'Pausado'),
        ('COMPLETADO', 'Completado'),
        ('RECHAZADO', 'Rechazado'),
    ]

    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name='etapas')
    etapa = models.ForeignKey(EtapaProduccion, on_delete=models.PROTECT)
    orden = models.IntegerField()
    maquina = models.ForeignKey(Maquina, on_delete=models.PROTECT, related_name='etapas_ejecutadas')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_minutos = models.IntegerField(null=True, blank=True, editable=False)
    operario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='etapas_operadas',
    )
    cantidad_entrada = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cantidad_salida = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cantidad_merma = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    porcentaje_rendimiento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False
    )
    parametros_registrados = models.JSONField(
        default=list,
        help_text="Lista de parámetros: [{nombre, valor, unidad, conforme}]"
    )
    observaciones = models.TextField(blank=True)
    requiere_aprobacion_calidad = models.BooleanField(default=False)
    aprobada_por_calidad = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='etapas_aprobadas'
    )
    fecha_aprobacion_calidad = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Etapa de Lote"
        verbose_name_plural = "Etapas de Lotes"
        ordering = ['lote', 'orden']
        unique_together = ['lote', 'orden']

    def __str__(self):
        return f"{self.lote.codigo_lote} - {self.etapa.nombre}"

    def save(self, *args, **kwargs):
        # Calcular duración automáticamente
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            self.duracion_minutos = int(delta.total_seconds() / 60)

        # Calcular rendimiento
        if self.cantidad_entrada and self.cantidad_salida and self.cantidad_entrada > 0:
            self.porcentaje_rendimiento = round((self.cantidad_salida / self.cantidad_entrada) * 100, 2)

        super().save(*args, **kwargs)



class LoteEtapaParametro(models.Model):
    class Meta:
        managed = False
        db_table = "produccion_loteetapaparametro"
        unique_together = [("lote_etapa_id", "nombre")]

    lote_etapa = models.ForeignKey(
        "LoteEtapa",
        on_delete=models.CASCADE,
        related_name="parametros",
    )
    nombre = models.CharField(max_length=100)
    valor = models.CharField(max_length=100)
    unidad = models.CharField(max_length=20, blank=True)
    conforme = models.BooleanField(default=True)


