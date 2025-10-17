"""Modelos del dominio de Producción"""

from django.conf import settings
from django.core.exceptions import ValidationError
from decimal import Decimal, ROUND_HALF_UP

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Max, Min, Sum

from backend.catalogos.models import Producto, Formula, EtapaProduccion, Maquina, Turno
from backend.core.choices import (
    EstadoEtapa,
    EstadoLote,
    Prioridad,
    UnidadProduccion,
)
from backend.core.mixins import TimeWindowMixin


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

    unidad_medida = models.CharField(
        max_length=20,
        choices=UnidadProduccion.choices,
    )
    cantidad_producida = models.DecimalField(max_digits=10, decimal_places=2)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    observaciones = models.TextField(blank=True)

    class Meta:
        managed = False
        db_table = "eventos_registroproduccion"
        verbose_name = "Resumen · Producción (Automático)"
        verbose_name_plural = "Resumen · Producción (Automático)"
        ordering = ["-fecha_produccion", "-fecha_registro"]
        indexes = [
            models.Index(fields=["-fecha_produccion", "maquina_id"]),
            models.Index(fields=["maquina_id", "fecha_produccion", "turno_id"]),
        ]

    def clean(self):
        super().clean()

        if self.hora_fin and self.hora_inicio and self.hora_fin <= self.hora_inicio:
            raise ValidationError(
                {"hora_fin": "La hora de fin debe ser posterior a la hora de inicio."}
            )

        if self.cantidad_producida is not None and self.cantidad_producida < 0:
            raise ValidationError(
                {"cantidad_producida": "La cantidad producida no puede ser negativa."}
            )

        if self.maquina_id and self.fecha_produccion and self.turno_id:
            exists = (
                self.__class__.objects.filter(
                    maquina_id=self.maquina_id,
                    fecha_produccion=self.fecha_produccion,
                    turno_id=self.turno_id,
                )
                .exclude(pk=self.pk)
                .exists()
            )
            if exists:
                raise ValidationError(
                    {
                        "turno": "Ya existe un registro de producción para esta máquina, fecha y turno.",
                    }
                )


class Lote(models.Model):
    """Orden de producción (Batch Record)"""

    codigo_lote = models.CharField(max_length=50, unique=True, verbose_name="Código de Lote")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='lotes')
    formula = models.ForeignKey(Formula, on_delete=models.PROTECT, related_name='lotes')
    cantidad_planificada = models.IntegerField(validators=[MinValueValidator(1)])
    cantidad_producida = models.IntegerField(default=0)
    cantidad_rechazada = models.IntegerField(default=0)
    unidad = models.CharField(max_length=20)
    estado = models.CharField(
        max_length=20,
        choices=EstadoLote.choices,
        default=EstadoLote.PLANIFICADO,
    )
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.NORMAL,
    )
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
        verbose_name = "Planificación · Lote"
        verbose_name_plural = "Planificación · Lotes"
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

    def obtener_agregados_etapas(self):
        """Obtiene valores agregados de las etapas asociadas al lote."""

        return self.etapas.aggregate(
            total_salida=Sum("cantidad_salida"),
            fecha_inicio=Min("fecha_inicio"),
            fecha_fin=Max("fecha_fin"),
        )

    def actualizar_metricas_desde_etapas(self):
        """Sincroniza cantidades y tiempos reales a partir de las etapas registradas."""

        agregados = self.obtener_agregados_etapas()

        total_salida = agregados.get("total_salida")

        if total_salida is None:
            cantidad_producida = 0
        elif isinstance(total_salida, Decimal):
            cantidad_producida = int(
                total_salida.to_integral_value(rounding=ROUND_HALF_UP)
            )
        else:
            cantidad_producida = int(total_salida)

        nueva_fecha_inicio = agregados.get("fecha_inicio")
        nueva_fecha_fin = agregados.get("fecha_fin")

        if (
            self.cantidad_producida == cantidad_producida
            and self.fecha_real_inicio == nueva_fecha_inicio
            and self.fecha_real_fin == nueva_fecha_fin
        ):
            return

        self.cantidad_producida = cantidad_producida
        self.fecha_real_inicio = nueva_fecha_inicio
        self.fecha_real_fin = nueva_fecha_fin

        self.save(
            update_fields=[
                "cantidad_producida",
                "fecha_real_inicio",
                "fecha_real_fin",
            ]
        )


class LoteEtapa(TimeWindowMixin):
    """Etapas ejecutadas en un lote específico"""

    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name='etapas')
    etapa = models.ForeignKey(EtapaProduccion, on_delete=models.PROTECT)
    orden = models.IntegerField()
    maquina = models.ForeignKey(Maquina, on_delete=models.PROTECT, related_name='etapas_ejecutadas')
    estado = models.CharField(
        max_length=20,
        choices=EstadoEtapa.choices,
        default=EstadoEtapa.PENDIENTE,
    )
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
    requiere_aprobacion_calidad = models.BooleanField(default=False, editable=False)
    aprobada_por_calidad = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='etapas_aprobadas'
    )
    fecha_aprobacion_calidad = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Ejecución · Etapa (Operario)"
        verbose_name_plural = "Ejecución · Etapas (Operario)"
        ordering = ['lote', 'orden']
        unique_together = ['lote', 'orden']

    def __str__(self):
        return f"{self.lote.codigo_lote} - {self.etapa.nombre}"

    def save(self, *args, **kwargs):
        if self.etapa_id and self.etapa and self.requiere_aprobacion_calidad != self.etapa.requiere_validacion:
            self.requiere_aprobacion_calidad = self.etapa.requiere_validacion

        entrada = (
            Decimal(str(self.cantidad_entrada))
            if self.cantidad_entrada is not None
            else None
        )
        salida = (
            Decimal(str(self.cantidad_salida))
            if self.cantidad_salida is not None
            else None
        )

        if entrada is not None and salida is not None:
            if entrada > 0:
                self.porcentaje_rendimiento = (
                    (salida / entrada) * Decimal("100")
                ).quantize(Decimal("0.01"))
            else:
                self.porcentaje_rendimiento = None
            merma = entrada - salida
            if merma < Decimal("0"):
                merma = Decimal("0")
            self.cantidad_merma = merma.quantize(Decimal("0.01"))
        else:
            self.porcentaje_rendimiento = None
            # Mantener merma en cero cuando faltan cantidades
            self.cantidad_merma = Decimal("0")

        super().save(*args, **kwargs)

        # Sincronizar métricas del lote luego de guardar la etapa
        if self.lote_id:
            self.lote.actualizar_metricas_desde_etapas()

    def delete(self, *args, **kwargs):
        lote = self.lote if self.lote_id else None
        super().delete(*args, **kwargs)
        if lote:
            lote.actualizar_metricas_desde_etapas()



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


