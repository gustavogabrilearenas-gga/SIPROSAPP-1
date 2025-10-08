"""Modelos del dominio de Inventario"""

from decimal import Decimal

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from core.models import Formula, Ubicacion, Maquina
from backend.produccion.models import Lote, LoteEtapa


class CategoriaInsumo(models.Model):
    """Categorías de insumos"""

    codigo = models.CharField(max_length=10, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Categoría de Insumo"
        verbose_name_plural = "Categorías de Insumos"
        ordering = ['codigo']
        app_label = 'core'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Insumo(models.Model):
    """Catálogo de insumos (materias primas, excipientes, envases)"""

    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=200)
    categoria = models.ForeignKey(CategoriaInsumo, on_delete=models.PROTECT, related_name='insumos')
    unidad_medida = models.CharField(max_length=20, help_text="kg, L, unidades")
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2)
    stock_maximo = models.DecimalField(max_digits=10, decimal_places=2)
    punto_reorden = models.DecimalField(max_digits=10, decimal_places=2)
    requiere_cadena_frio = models.BooleanField(default=False)
    requiere_control_lote = models.BooleanField(default=True)
    tiempo_vida_util_meses = models.IntegerField(validators=[MinValueValidator(1)])
    proveedor_principal = models.CharField(max_length=200, blank=True)
    codigo_proveedor = models.CharField(max_length=50, blank=True, verbose_name="Código del Proveedor")
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    activo = models.BooleanField(default=True)
    ficha_tecnica_url = models.CharField(max_length=500, blank=True)

    class Meta:
        verbose_name = "Insumo"
        verbose_name_plural = "Insumos"
        ordering = ['codigo']
        app_label = 'core'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def stock_actual(self):
        """Calcula el stock actual sumando todos los lotes aprobados"""
        from django.db.models import Sum

        total = self.lotes_insumo.filter(estado='APROBADO').aggregate(
            total=Sum('cantidad_actual')
        )['total']
        return total or Decimal('0.00')


class FormulaInsumo(models.Model):
    """Insumos requeridos en una fórmula"""

    formula = models.ForeignKey(Formula, on_delete=models.CASCADE, related_name='insumos')
    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT)
    cantidad = models.DecimalField(max_digits=10, decimal_places=4)
    unidad = models.CharField(max_length=20)
    es_critico = models.BooleanField(default=False, help_text="Insumo crítico para la calidad")
    orden = models.IntegerField(help_text="Orden de adición en el proceso")

    class Meta:
        verbose_name = "Insumo de Fórmula"
        verbose_name_plural = "Insumos de Fórmulas"
        ordering = ['formula', 'orden']
        unique_together = ['formula', 'insumo']
        app_label = 'core'

    def __str__(self):
        return f"{self.formula.producto.nombre} - {self.insumo.nombre}"


class LoteInsumo(models.Model):
    """Lotes de insumos en inventario (para FEFO)"""

    ESTADO_CHOICES = [
        ('CUARENTENA', 'Cuarentena'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('AGOTADO', 'Agotado'),
    ]

    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT, related_name='lotes_insumo')
    codigo_lote_proveedor = models.CharField(max_length=50)
    fecha_recepcion = models.DateField()
    fecha_fabricacion = models.DateField(null=True, blank=True)
    fecha_vencimiento = models.DateField()
    cantidad_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad_actual = models.DecimalField(max_digits=10, decimal_places=2)
    unidad = models.CharField(max_length=20)
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, related_name='lotes_insumo')
    ubicacion_detalle = models.CharField(max_length=100, blank=True, help_text="ej: Estante A-3")
    proveedor = models.CharField(max_length=200)
    numero_factura = models.CharField(max_length=50, blank=True)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='CUARENTENA')
    certificado_analisis_url = models.CharField(max_length=500, blank=True)
    aprobado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lotes_insumo_aprobados'
    )
    fecha_aprobacion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Lote de Insumo"
        verbose_name_plural = "Lotes de Insumos"
        ordering = ['fecha_vencimiento', 'fecha_recepcion']  # FEFO: First Expired, First Out
        app_label = 'core'

    def __str__(self):
        return f"{self.insumo.codigo} - Lote {self.codigo_lote_proveedor}"

    @property
    def dias_para_vencimiento(self):
        """Calcula días restantes hasta el vencimiento"""
        if self.fecha_vencimiento:
            delta = self.fecha_vencimiento - timezone.now().date()
            return delta.days
        return None


class LoteInsumoConsumo(models.Model):
    """Registro de consumo de insumos en producción"""

    lote_produccion = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name='consumos_insumo')
    lote_etapa = models.ForeignKey(
        LoteEtapa,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='consumos_insumo'
    )
    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT)
    lote_insumo = models.ForeignKey(LoteInsumo, on_delete=models.PROTECT, related_name='consumos')
    cantidad_planificada = models.DecimalField(max_digits=10, decimal_places=4)
    cantidad_real = models.DecimalField(max_digits=10, decimal_places=4)
    unidad = models.CharField(max_length=20)
    fecha_consumo = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='consumos_registrados')

    class Meta:
        verbose_name = "Consumo de Insumo"
        verbose_name_plural = "Consumos de Insumos"
        ordering = ['-fecha_consumo']
        app_label = 'core'

    def __str__(self):
        return f"{self.lote_produccion.codigo_lote} - {self.insumo.nombre}"


class Repuesto(models.Model):
    """Catálogo de repuestos para mantenimiento"""

    CATEGORIA_CHOICES = [
        ('MECANICO', 'Mecánico'),
        ('ELECTRICO', 'Eléctrico'),
        ('NEUMATICO', 'Neumático'),
        ('ELECTRONICO', 'Electrónico'),
        ('CONSUMIBLE', 'Consumible'),
        ('OTRO', 'Otro'),
    ]

    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    maquinas_compatibles = models.ManyToManyField(Maquina, related_name='repuestos', blank=True)
    stock_minimo = models.IntegerField(validators=[MinValueValidator(0)])
    stock_actual = models.IntegerField(validators=[MinValueValidator(0)])
    punto_reorden = models.IntegerField(validators=[MinValueValidator(0)])
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, related_name='repuestos')
    ubicacion_detalle = models.CharField(max_length=100, blank=True)
    proveedor_principal = models.CharField(max_length=200, blank=True)
    codigo_proveedor = models.CharField(max_length=50, blank=True, verbose_name="Código del Proveedor")
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tiempo_reposicion_dias = models.IntegerField(validators=[MinValueValidator(1)])
    critico = models.BooleanField(default=False, help_text="Repuesto crítico para operación")
    activo = models.BooleanField(default=True)
    imagen = models.ImageField(upload_to='repuestos/', null=True, blank=True)

    class Meta:
        verbose_name = "Repuesto"
        verbose_name_plural = "Repuestos"
        ordering = ['codigo']
        app_label = 'core'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class MovimientoInventario(models.Model):
    """Trazabilidad completa de movimientos de inventario"""

    TIPO_ITEM_CHOICES = [
        ('INSUMO', 'Insumo'),
        ('REPUESTO', 'Repuesto'),
        ('PRODUCTO_TERMINADO', 'Producto Terminado'),
    ]

    TIPO_MOVIMIENTO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
        ('TRANSFERENCIA', 'Transferencia'),
    ]

    MOTIVO_CHOICES = [
        ('COMPRA', 'Compra'),
        ('PRODUCCION', 'Producción'),
        ('MANTENIMIENTO', 'Mantenimiento'),
        ('AJUSTE_INVENTARIO', 'Ajuste de Inventario'),
        ('VENCIMIENTO', 'Vencimiento'),
        ('DEVOLUCION', 'Devolución'),
    ]

    tipo_item = models.CharField(max_length=20, choices=TIPO_ITEM_CHOICES)
    item_id = models.IntegerField(help_text="ID del Insumo, Repuesto o Producto")
    lote_item_id = models.IntegerField(null=True, blank=True, help_text="ID del LoteInsumo o ProductoTerminado")
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    motivo = models.CharField(max_length=20, choices=MOTIVO_CHOICES)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    unidad = models.CharField(max_length=20)
    ubicacion_origen = models.ForeignKey(
        Ubicacion,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='movimientos_origen'
    )
    ubicacion_destino = models.ForeignKey(
        Ubicacion,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='movimientos_destino'
    )
    referencia_documento = models.CharField(max_length=100, blank=True, help_text="OC-123, LOTE-2025-001, WO-456")
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='movimientos_registrados')
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Movimiento de Inventario"
        verbose_name_plural = "Movimientos de Inventario"
        ordering = ['-fecha_movimiento']
        app_label = 'core'

    def __str__(self):
        fecha = self.fecha_movimiento.strftime('%Y-%m-%d')
        return f"{self.get_tipo_movimiento_display()} - {self.get_tipo_item_display()} ({fecha})"


class ProductoTerminado(models.Model):
    """Inventario de productos terminados"""

    ESTADO_CHOICES = [
        ('CUARENTENA', 'Cuarentena'),
        ('LIBERADO', 'Liberado'),
        ('RETENIDO', 'Retenido'),
        ('VENCIDO', 'Vencido'),
    ]

    lote = models.OneToOneField(Lote, on_delete=models.PROTECT, related_name='producto_terminado')
    cantidad = models.IntegerField(validators=[MinValueValidator(1)])
    unidad = models.CharField(max_length=20)
    fecha_fabricacion = models.DateField()
    fecha_vencimiento = models.DateField()
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, related_name='productos_terminados')
    ubicacion_detalle = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='CUARENTENA')
    liberado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='productos_liberados'
    )
    fecha_liberacion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Producto Terminado"
        verbose_name_plural = "Productos Terminados"
        ordering = ['fecha_vencimiento']
        app_label = 'core'

    def __str__(self):
        return f"{self.lote.codigo_lote} - {self.cantidad} {self.unidad}"


class AlertaInventario(models.Model):
    """Sistema de alertas automáticas de inventario"""

    TIPO_ITEM_CHOICES = [
        ('INSUMO', 'Insumo'),
        ('REPUESTO', 'Repuesto'),
    ]

    TIPO_ALERTA_CHOICES = [
        ('STOCK_MINIMO', 'Stock Mínimo'),
        ('PUNTO_REORDEN', 'Punto de Reorden'),
        ('VENCIMIENTO_PROXIMO', 'Vencimiento Próximo'),
        ('VENCIDO', 'Vencido'),
    ]

    NIVEL_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    ]

    ESTADO_CHOICES = [
        ('ACTIVA', 'Activa'),
        ('ATENDIDA', 'Atendida'),
        ('IGNORADA', 'Ignorada'),
    ]

    tipo_item = models.CharField(max_length=20, choices=TIPO_ITEM_CHOICES)
    item_id = models.IntegerField()
    tipo_alerta = models.CharField(max_length=20, choices=TIPO_ALERTA_CHOICES)
    nivel_urgencia = models.CharField(max_length=10, choices=NIVEL_CHOICES)
    mensaje = models.TextField()
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento_item = models.DateField(null=True, blank=True)
    dias_para_vencimiento = models.IntegerField(null=True, blank=True)
    stock_actual = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='ACTIVA')
    atendida_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_atendidas'
    )
    fecha_atencion = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Alerta de Inventario"
        verbose_name_plural = "Alertas de Inventario"
        ordering = ['-fecha_generacion', 'nivel_urgencia']
        app_label = 'core'

    def __str__(self):
        return f"{self.get_tipo_alerta_display()} - {self.get_tipo_item_display()} ID:{self.item_id}"


class ConteoFisico(models.Model):
    """Inventarios físicos periódicos"""

    TIPO_CHOICES = [
        ('TOTAL', 'Total'),
        ('PARCIAL', 'Parcial'),
        ('CICLICO', 'Cíclico'),
    ]

    ESTADO_CHOICES = [
        ('PLANIFICADO', 'Planificado'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    ubicacion = models.ForeignKey(
        Ubicacion,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='conteos_fisicos'
    )
    fecha_planificada = models.DateField()
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PLANIFICADO')
    responsable = models.ForeignKey(User, on_delete=models.PROTECT, related_name='conteos_responsable')
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Conteo Físico"
        verbose_name_plural = "Conteos Físicos"
        ordering = ['-fecha_planificada']
        app_label = 'core'

    def __str__(self):
        return f"{self.codigo} - {self.get_tipo_display()}"
