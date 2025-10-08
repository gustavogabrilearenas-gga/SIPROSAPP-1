"""Modelos del dominio de Producción"""

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models

from core.models import Producto, Formula, EtapaProduccion, Maquina, Turno, TipoDocumento


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
    supervisor = models.ForeignKey(User, on_delete=models.PROTECT, related_name='lotes_supervisados')
    observaciones = models.TextField(blank=True)
    creado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='lotes_creados')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    cancelado_por = models.ForeignKey(
        User,
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
        app_label = 'core'

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
    operario = models.ForeignKey(User, on_delete=models.PROTECT, related_name='etapas_operadas')
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
        User,
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
        app_label = 'core'

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


class Parada(models.Model):
    """Paradas durante la producción"""

    TIPO_CHOICES = [
        ('PLANIFICADA', 'Planificada'),
        ('NO_PLANIFICADA', 'No Planificada'),
    ]

    CATEGORIA_CHOICES = [
        ('FALLA_EQUIPO', 'Falla de Equipo'),
        ('FALTA_INSUMO', 'Falta de Insumo'),
        ('CAMBIO_FORMATO', 'Cambio de Formato'),
        ('LIMPIEZA', 'Limpieza'),
        ('CALIDAD', 'Problema de Calidad'),
        ('OTROS', 'Otros'),
    ]

    lote_etapa = models.ForeignKey(LoteEtapa, on_delete=models.CASCADE, related_name='paradas')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_minutos = models.IntegerField(null=True, blank=True, editable=False)
    descripcion = models.TextField()
    solucion = models.TextField(blank=True)
    registrado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='paradas_registradas')

    class Meta:
        verbose_name = "Parada"
        verbose_name_plural = "Paradas"
        ordering = ['-fecha_inicio']
        app_label = 'core'

    def __str__(self):
        return f"Parada {self.get_categoria_display()} - {self.lote_etapa.lote.codigo_lote}"

    def save(self, *args, **kwargs):
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            self.duracion_minutos = int(delta.total_seconds() / 60)
        super().save(*args, **kwargs)


class ControlCalidad(models.Model):
    """Controles de calidad asociados a etapas de lote"""

    lote_etapa = models.ForeignKey(LoteEtapa, on_delete=models.CASCADE, related_name='controles_calidad')
    tipo_control = models.CharField(max_length=100, help_text="ej: Peso promedio, Dureza, Friabilidad")
    valor_medido = models.DecimalField(max_digits=10, decimal_places=4)
    unidad = models.CharField(max_length=20)
    valor_minimo = models.DecimalField(max_digits=10, decimal_places=4)
    valor_maximo = models.DecimalField(max_digits=10, decimal_places=4)
    conforme = models.BooleanField(editable=False)
    fecha_control = models.DateTimeField(auto_now_add=True)
    controlado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='controles_realizados')
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Control de Calidad"
        verbose_name_plural = "Controles de Calidad"
        ordering = ['-fecha_control']
        app_label = 'core'

    def __str__(self):
        return f"{self.tipo_control} - {self.lote_etapa.lote.codigo_lote}"

    def save(self, *args, **kwargs):
        # Determinar conformidad automáticamente
        self.conforme = self.valor_minimo <= self.valor_medido <= self.valor_maximo
        super().save(*args, **kwargs)


class LoteDocumento(models.Model):
    """Documentos adjuntos a lotes"""

    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name='documentos')
    tipo_documento = models.ForeignKey(TipoDocumento, on_delete=models.PROTECT)
    nombre = models.CharField(max_length=200)
    archivo_url = models.CharField(max_length=500)
    hash_sha256 = models.CharField(max_length=64, editable=False, blank=True)
    tamaño_bytes = models.BigIntegerField(editable=False, default=0)
    subido_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='documentos_subidos')
    fecha_subida = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Documento de Lote"
        verbose_name_plural = "Documentos de Lotes"
        ordering = ['-fecha_subida']
        app_label = 'core'

    def __str__(self):
        return f"{self.nombre} - {self.lote.codigo_lote}"
