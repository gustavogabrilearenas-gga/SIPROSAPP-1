"""
Modelos de datos para SIPROSA MES
Sistema de Gestión de Manufactura para Planta Farmacéutica
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import hashlib

from backend.usuarios.models import Rol, UserProfile, UsuarioRol


# ============================================
# 2. MÓDULO: CATÁLOGOS MAESTROS
# ============================================

class Ubicacion(models.Model):
    """Áreas físicas de la planta"""
    
    TIPO_CHOICES = [
        ('PRODUCCION', 'Producción'),
        ('ALMACEN', 'Almacén'),
        ('MANTENIMIENTO', 'Mantenimiento'),
        ('SERVICIOS', 'Servicios'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Ubicación"
        verbose_name_plural = "Ubicaciones"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Maquina(models.Model):
    """Equipos de producción y servicios"""
    
    TIPO_CHOICES = [
        ('COMPRESION', 'Compresión'),
        ('MEZCLADO', 'Mezclado'),
        ('GRANULACION', 'Granulación'),
        ('EMBLISTADO', 'Emblistado'),
        ('SERVICIOS', 'Servicios'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fabricante = models.CharField(max_length=100, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    numero_serie = models.CharField(max_length=100, blank=True, verbose_name="Número de Serie")
    año_fabricacion = models.IntegerField(null=True, blank=True, verbose_name="Año de Fabricación")
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, related_name='maquinas')
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    capacidad_nominal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unidad_capacidad = models.CharField(max_length=20, blank=True, help_text="ej: comprimidos/hora, kg/batch")
    activa = models.BooleanField(default=True)
    requiere_calificacion = models.BooleanField(default=False, verbose_name="Requiere Calificación")
    fecha_instalacion = models.DateField(null=True, blank=True, verbose_name="Fecha de Instalación")
    imagen = models.ImageField(upload_to='maquinas/', null=True, blank=True)
    documentos = models.JSONField(default=list, help_text="Lista de documentos: [{nombre, url}]")
    
    class Meta:
        verbose_name = "Máquina"
        verbose_name_plural = "Máquinas"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Producto(models.Model):
    """Catálogo de productos farmacéuticos"""
    
    FORMA_CHOICES = [
        ('COMPRIMIDO', 'Comprimido'),
        ('CREMA', 'Crema'),
        ('SOLUCION', 'Solución'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=200)
    forma_farmaceutica = models.CharField(max_length=20, choices=FORMA_CHOICES, verbose_name="Forma Farmacéutica")
    principio_activo = models.CharField(max_length=200)
    concentracion = models.CharField(max_length=50)
    unidad_medida = models.CharField(max_length=20, help_text="comprimidos, gramos, ml")
    lote_minimo = models.IntegerField(validators=[MinValueValidator(1)])
    lote_optimo = models.IntegerField(validators=[MinValueValidator(1)])
    tiempo_vida_util_meses = models.IntegerField(validators=[MinValueValidator(1)])
    requiere_cadena_frio = models.BooleanField(default=False)
    registro_anmat = models.CharField(max_length=50, blank=True)
    activo = models.BooleanField(default=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Formula(models.Model):
    """Recetas de producción (Master Formula)"""
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='formulas')
    version = models.CharField(max_length=20, help_text="ej: v1.0, v2.1")
    fecha_vigencia_desde = models.DateField()
    fecha_vigencia_hasta = models.DateField(null=True, blank=True)
    rendimiento_teorico = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    tiempo_estimado_horas = models.DecimalField(max_digits=5, decimal_places=2)
    aprobada_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='formulas_aprobadas')
    fecha_aprobacion = models.DateField()
    observaciones = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Fórmula"
        verbose_name_plural = "Fórmulas"
        unique_together = ['producto', 'version']
        ordering = ['-fecha_vigencia_desde']
    
    def __str__(self):
        return f"{self.producto.nombre} - {self.version}"


class EtapaProduccion(models.Model):
    """Catálogo de etapas del proceso productivo"""
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    orden_tipico = models.IntegerField(help_text="Orden típico en el proceso")
    requiere_registro_parametros = models.BooleanField(default=False)
    parametros_esperados = models.JSONField(
        default=list, 
        help_text="Lista de parámetros: [{nombre, unidad, min, max}]"
    )
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Etapa de Producción"
        verbose_name_plural = "Etapas de Producción"
        ordering = ['orden_tipico']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Turno(models.Model):
    """Turnos de trabajo"""
    
    codigo = models.CharField(max_length=1, unique=True, choices=[
        ('M', 'Mañana'),
        ('T', 'Tarde'),
        ('N', 'Noche'),
    ])
    nombre = models.CharField(max_length=20)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Turno"
        verbose_name_plural = "Turnos"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.nombre} ({self.hora_inicio} - {self.hora_fin})"


class TipoDocumento(models.Model):
    """Tipos de documentos (SOPs, IT, FT, etc.)"""
    
    codigo = models.CharField(max_length=10, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Tipo de Documento"
        verbose_name_plural = "Tipos de Documentos"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ============================================
# 3. MÓDULO: PRODUCCIÓN
# ============================================

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
    cancelado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='lotes_cancelados')
    fecha_cancelacion = models.DateTimeField(null=True, blank=True)
    motivo_cancelacion = models.TextField(blank=True, verbose_name="Motivo de cancelación")
    visible = models.BooleanField(default=True, verbose_name="Visible en listado")
    
    class Meta:
        verbose_name = "Lote de Producción"
        verbose_name_plural = "Lotes de Producción"
        ordering = ['-fecha_creacion']
    
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
    porcentaje_rendimiento = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, editable=False)
    parametros_registrados = models.JSONField(
        default=list,
        help_text="Lista de parámetros: [{nombre, valor, unidad, conforme}]"
    )
    observaciones = models.TextField(blank=True)
    requiere_aprobacion_calidad = models.BooleanField(default=False)
    aprobada_por_calidad = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='etapas_aprobadas')
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
    
    def __str__(self):
        return f"Parada {self.get_categoria_display()} - {self.lote_etapa.lote.codigo_lote}"
    
    def save(self, *args, **kwargs):
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            self.duracion_minutos = int(delta.total_seconds() / 60)
        super().save(*args, **kwargs)


class ControlCalidad(models.Model):
    """Controles de calidad en proceso"""
    
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
    
    def __str__(self):
        return f"{self.nombre} - {self.lote.codigo_lote}"


class Desviacion(models.Model):
    """Desviaciones del proceso (Deviations)"""
    
    SEVERIDAD_CHOICES = [
        ('CRITICA', 'Crítica'),
        ('MAYOR', 'Mayor'),
        ('MENOR', 'Menor'),
    ]
    
    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('EN_INVESTIGACION', 'En Investigación'),
        ('EN_CAPA', 'En CAPA'),
        ('CERRADA', 'Cerrada'),
    ]
    
    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    lote = models.ForeignKey(Lote, on_delete=models.PROTECT, null=True, blank=True, related_name='desviaciones')
    lote_etapa = models.ForeignKey(LoteEtapa, on_delete=models.PROTECT, null=True, blank=True, related_name='desviaciones')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    severidad = models.CharField(max_length=10, choices=SEVERIDAD_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTA')
    fecha_deteccion = models.DateTimeField()
    detectado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='desviaciones_detectadas')
    area_responsable = models.CharField(max_length=50, blank=True)
    impacto_calidad = models.TextField(blank=True)
    impacto_seguridad = models.TextField(blank=True)
    impacto_eficacia = models.TextField(blank=True)
    investigacion_realizada = models.TextField(blank=True)
    causa_raiz = models.TextField(blank=True)
    accion_inmediata = models.TextField(blank=True)
    requiere_capa = models.BooleanField(default=False)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    cerrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='desviaciones_cerradas')
    
    class Meta:
        verbose_name = "Desviación"
        verbose_name_plural = "Desviaciones"
        ordering = ['-fecha_deteccion']
    
    def __str__(self):
        return f"{self.codigo} - {self.titulo}"


class DocumentoVersionado(models.Model):
    """Sistema de documentos versionados (SOPs, procedimientos, etc.)"""
    
    TIPO_CHOICES = [
        ('SOP', 'Standard Operating Procedure'),
        ('IT', 'Instrucción de Trabajo'),
        ('FT', 'Ficha Técnica'),
        ('PL', 'Protocolo'),
        ('REG', 'Registro'),
    ]
    
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('EN_REVISION', 'En Revisión'),
        ('APROBADO', 'Aprobado'),
        ('VIGENTE', 'Vigente'),
        ('OBSOLETO', 'Obsoleto'),
    ]
    
    codigo = models.CharField(max_length=50, verbose_name="Código")
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    version = models.CharField(max_length=20)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='documentos_creados')
    fecha_revision = models.DateTimeField(null=True, blank=True)
    revisado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_revisados')
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    aprobado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_aprobados')
    fecha_vigencia_inicio = models.DateField(null=True, blank=True)
    fecha_vigencia_fin = models.DateField(null=True, blank=True)
    contenido = models.TextField(blank=True, help_text="Contenido del documento o referencia")
    archivo_url = models.CharField(max_length=500, blank=True)
    hash_sha256 = models.CharField(max_length=64, blank=True)
    cambios_version = models.TextField(blank=True, help_text="Resumen de cambios en esta versión")
    documento_anterior = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versiones_siguientes')
    
    class Meta:
        verbose_name = "Documento Versionado"
        verbose_name_plural = "Documentos Versionados"
        ordering = ['-fecha_creacion']
        unique_together = ['codigo', 'version']
    
    def __str__(self):
        return f"{self.codigo} - {self.titulo} (v{self.version})"


# ============================================
# 4. MÓDULO: INVENTARIO
# ============================================

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
    aprobado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='lotes_insumo_aprobados')
    fecha_aprobacion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Lote de Insumo"
        verbose_name_plural = "Lotes de Insumos"
        ordering = ['fecha_vencimiento', 'fecha_recepcion']  # FEFO: First Expired, First Out
    
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
    lote_etapa = models.ForeignKey(LoteEtapa, on_delete=models.CASCADE, null=True, blank=True, related_name='consumos_insumo')
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
    ubicacion_origen = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, null=True, blank=True, related_name='movimientos_origen')
    ubicacion_destino = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, null=True, blank=True, related_name='movimientos_destino')
    referencia_documento = models.CharField(max_length=100, blank=True, help_text="OC-123, LOTE-2025-001, WO-456")
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='movimientos_registrados')
    observaciones = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Movimiento de Inventario"
        verbose_name_plural = "Movimientos de Inventario"
        ordering = ['-fecha_movimiento']
    
    def __str__(self):
        return f"{self.get_tipo_movimiento_display()} - {self.get_tipo_item_display()} ({self.fecha_movimiento.strftime('%Y-%m-%d')})"


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
    liberado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='productos_liberados')
    fecha_liberacion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Producto Terminado"
        verbose_name_plural = "Productos Terminados"
        ordering = ['fecha_vencimiento']
    
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
    atendida_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='alertas_atendidas')
    fecha_atencion = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Alerta de Inventario"
        verbose_name_plural = "Alertas de Inventario"
        ordering = ['-fecha_generacion', 'nivel_urgencia']
    
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
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, null=True, blank=True, related_name='conteos_fisicos')
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
    
    def __str__(self):
        return f"{self.codigo} - {self.get_tipo_display()}"


# ============================================
# 5. MÓDULO: MANTENIMIENTO
# ============================================

class TipoMantenimiento(models.Model):
    """Tipos de mantenimiento"""
    
    codigo = models.CharField(max_length=10, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Tipo de Mantenimiento"
        verbose_name_plural = "Tipos de Mantenimiento"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class PlanMantenimiento(models.Model):
    """Planes de mantenimiento preventivo"""
    
    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE, related_name='planes_mantenimiento')
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    tipo = models.ForeignKey(TipoMantenimiento, on_delete=models.PROTECT)
    frecuencia_dias = models.IntegerField(null=True, blank=True, help_text="Frecuencia en días")
    frecuencia_horas_uso = models.IntegerField(null=True, blank=True, help_text="Frecuencia en horas de uso")
    frecuencia_ciclos = models.IntegerField(null=True, blank=True, help_text="Frecuencia en ciclos de operación")
    tareas = models.JSONField(default=list, help_text="Lista de tareas: [{nombre, descripcion, duracion_min}]")
    repuestos_necesarios = models.JSONField(default=list, help_text="Lista de repuestos: [{repuesto_id, cantidad}]")
    duracion_estimada_horas = models.DecimalField(max_digits=5, decimal_places=2)
    activo = models.BooleanField(default=True)
    creado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='planes_creados')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Plan de Mantenimiento"
        verbose_name_plural = "Planes de Mantenimiento"
        ordering = ['maquina', 'codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class OrdenTrabajo(models.Model):
    """Órdenes de trabajo de mantenimiento"""
    
    PRIORIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]
    
    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('ASIGNADA', 'Asignada'),
        ('EN_PROCESO', 'En Proceso'),
        ('PAUSADA', 'Pausada'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    tipo = models.ForeignKey(TipoMantenimiento, on_delete=models.PROTECT)
    maquina = models.ForeignKey(Maquina, on_delete=models.PROTECT, related_name='ordenes_trabajo')
    plan_mantenimiento = models.ForeignKey(PlanMantenimiento, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_generadas')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='NORMAL')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTA')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_planificada = models.DateTimeField(null=True, blank=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_real_horas = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, editable=False)
    creada_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='ordenes_creadas')
    asignada_a = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_asignadas')
    completada_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_completadas')
    trabajo_realizado = models.TextField(blank=True)
    observaciones = models.TextField(blank=True)
    requiere_parada_produccion = models.BooleanField(default=False)
    costo_estimado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    costo_real = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        verbose_name = "Orden de Trabajo"
        verbose_name_plural = "Órdenes de Trabajo"
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.codigo} - {self.titulo}"
    
    def save(self, *args, **kwargs):
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            self.duracion_real_horas = round(Decimal(delta.total_seconds() / 3600), 2)
        super().save(*args, **kwargs)


class OrdenTrabajoRepuesto(models.Model):
    """Repuestos utilizados en órdenes de trabajo"""
    
    orden_trabajo = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='repuestos_utilizados')
    repuesto = models.ForeignKey(Repuesto, on_delete=models.PROTECT)
    cantidad_planificada = models.IntegerField(validators=[MinValueValidator(1)])
    cantidad_real = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    fecha_uso = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Repuesto de Orden de Trabajo"
        verbose_name_plural = "Repuestos de Órdenes de Trabajo"
    
    def __str__(self):
        return f"{self.orden_trabajo.codigo} - {self.repuesto.nombre}"


class HistorialMantenimiento(models.Model):
    """Historial consolidado de mantenimientos por máquina"""
    
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE, related_name='historial_mantenimiento')
    orden_trabajo = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='historial')
    fecha = models.DateTimeField()
    tipo = models.ForeignKey(TipoMantenimiento, on_delete=models.PROTECT)
    descripcion = models.TextField()
    tiempo_parada_horas = models.DecimalField(max_digits=6, decimal_places=2)
    costo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    realizado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='mantenimientos_realizados')
    
    class Meta:
        verbose_name = "Historial de Mantenimiento"
        verbose_name_plural = "Historiales de Mantenimiento"
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.maquina.codigo} - {self.fecha.strftime('%Y-%m-%d')}"


class IndicadorMantenimiento(models.Model):
    """KPIs de mantenimiento (MTBF, MTTR, Disponibilidad)"""
    
    PERIODO_CHOICES = [
        ('SEMANAL', 'Semanal'),
        ('MENSUAL', 'Mensual'),
        ('ANUAL', 'Anual'),
    ]
    
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE, related_name='indicadores_mantenimiento')
    periodo = models.CharField(max_length=10, choices=PERIODO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    mtbf_horas = models.DecimalField(max_digits=10, decimal_places=2, help_text="Mean Time Between Failures")
    mttr_horas = models.DecimalField(max_digits=10, decimal_places=2, help_text="Mean Time To Repair")
    disponibilidad_porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    numero_fallas = models.IntegerField()
    numero_mantenimientos_preventivos = models.IntegerField()
    numero_mantenimientos_correctivos = models.IntegerField()
    costo_total_mantenimiento = models.DecimalField(max_digits=12, decimal_places=2)
    fecha_calculo = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Indicador de Mantenimiento"
        verbose_name_plural = "Indicadores de Mantenimiento"
        ordering = ['-fecha_inicio']
        unique_together = ['maquina', 'periodo', 'fecha_inicio']
    
    def __str__(self):
        return f"{self.maquina.codigo} - {self.get_periodo_display()} ({self.fecha_inicio})"


# ============================================
# 6. MÓDULO: INCIDENTES
# ============================================

class TipoIncidente(models.Model):
    """Categorías de incidentes"""
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    requiere_investigacion = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Tipo de Incidente"
        verbose_name_plural = "Tipos de Incidentes"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Incidente(models.Model):
    """Registro de incidentes"""
    
    SEVERIDAD_CHOICES = [
        ('MENOR', 'Menor'),
        ('MODERADA', 'Moderada'),
        ('MAYOR', 'Mayor'),
        ('CRITICA', 'Crítica'),
    ]
    
    ESTADO_CHOICES = [
        ('ABIERTO', 'Abierto'),
        ('EN_INVESTIGACION', 'En Investigación'),
        ('ACCION_CORRECTIVA', 'Acción Correctiva'),
        ('CERRADO', 'Cerrado'),
    ]
    
    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    tipo = models.ForeignKey(TipoIncidente, on_delete=models.PROTECT)
    severidad = models.CharField(max_length=10, choices=SEVERIDAD_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTO')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    fecha_ocurrencia = models.DateTimeField()
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, related_name='incidentes')
    maquina = models.ForeignKey(Maquina, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes')
    lote_afectado = models.ForeignKey(Lote, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes')
    reportado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='incidentes_reportados')
    fecha_reporte = models.DateTimeField(auto_now_add=True)
    asignado_a = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes_asignados')
    impacto_produccion = models.TextField(blank=True)
    impacto_calidad = models.TextField(blank=True)
    impacto_seguridad = models.TextField(blank=True)
    requiere_notificacion_anmat = models.BooleanField(default=False)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    cerrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes_cerrados')
    
    class Meta:
        verbose_name = "Incidente"
        verbose_name_plural = "Incidentes"
        ordering = ['-fecha_ocurrencia']
    
    def __str__(self):
        return f"{self.codigo} - {self.titulo}"


class InvestigacionIncidente(models.Model):
    """Análisis de causa raíz de incidentes"""
    
    METODOLOGIA_CHOICES = [
        ('5_PORQUES', '5 Porqués'),
        ('ISHIKAWA', 'Diagrama de Ishikawa'),
        ('FMEA', 'FMEA'),
        ('OTRO', 'Otro'),
    ]
    
    incidente = models.OneToOneField(Incidente, on_delete=models.CASCADE, related_name='investigacion')
    metodologia = models.CharField(max_length=20, choices=METODOLOGIA_CHOICES)
    causa_raiz = models.TextField()
    analisis_detallado = models.TextField()
    diagrama_url = models.CharField(max_length=500, blank=True)
    fecha_investigacion = models.DateTimeField(auto_now_add=True)
    investigado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='investigaciones_realizadas')
    
    class Meta:
        verbose_name = "Investigación de Incidente"
        verbose_name_plural = "Investigaciones de Incidentes"
    
    def __str__(self):
        return f"Investigación - {self.incidente.codigo}"


class AccionCorrectiva(models.Model):
    """Acciones correctivas y preventivas (CAPA)"""
    
    TIPO_CHOICES = [
        ('CORRECTIVA', 'Correctiva'),
        ('PREVENTIVA', 'Preventiva'),
    ]
    
    ESTADO_CHOICES = [
        ('PLANIFICADA', 'Planificada'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    incidente = models.ForeignKey(Incidente, on_delete=models.CASCADE, related_name='acciones_correctivas')
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    responsable = models.ForeignKey(User, on_delete=models.PROTECT, related_name='acciones_responsable')
    fecha_planificada = models.DateField()
    fecha_implementacion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='PLANIFICADA')
    eficacia_verificada = models.BooleanField(default=False)
    verificado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acciones_verificadas')
    fecha_verificacion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Acción Correctiva"
        verbose_name_plural = "Acciones Correctivas"
        ordering = ['-fecha_planificada']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.incidente.codigo}"


# ============================================
# 7. MÓDULO: AUDITORÍA
# ============================================

class LogAuditoria(models.Model):
    """Registro completo de todas las acciones en el sistema"""
    
    ACCION_CHOICES = [
        ('CREAR', 'Crear'),
        ('MODIFICAR', 'Modificar'),
        ('ELIMINAR', 'Eliminar'),
        ('CANCELAR', 'Cancelar'),
        ('VER', 'Ver'),
        ('EXPORTAR', 'Exportar'),
    ]
    
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='acciones_auditoria')
    accion = models.CharField(max_length=10, choices=ACCION_CHOICES)
    modelo = models.CharField(max_length=100, help_text="Nombre del modelo afectado")
    objeto_id = models.IntegerField()
    objeto_str = models.CharField(max_length=200)
    cambios = models.JSONField(default=dict, help_text="Estructura: {campo: {antes: X, despues: Y}}")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Log de Auditoría"
        verbose_name_plural = "Logs de Auditoría"
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['modelo', 'objeto_id']),
        ]
    
    def __str__(self):
        return f"{self.usuario} - {self.get_accion_display()} - {self.modelo} ({self.fecha.strftime('%Y-%m-%d %H:%M')})"


class Notificacion(models.Model):
    """Sistema de notificaciones para usuarios"""
    
    TIPO_CHOICES = [
        ('INFO', 'Información'),
        ('ADVERTENCIA', 'Advertencia'),
        ('ERROR', 'Error'),
        ('URGENTE', 'Urgente'),
    ]
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    referencia_modelo = models.CharField(max_length=100, null=True, blank=True)
    referencia_id = models.IntegerField(null=True, blank=True)
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_lectura = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'leida', '-fecha_creacion']),
        ]
    
    def __str__(self):
        return f"{self.usuario.username} - {self.titulo}"


# ============================================
# 8. MÓDULO: FIRMAS ELECTRÓNICAS
# ============================================

class ElectronicSignature(models.Model):
    """
    Electronic Signature Record
    Implements requirements for 21 CFR Part 11
    """
    
    ACTION_CHOICES = [
        ('APPROVE', 'Approve'),
        ('REVIEW', 'Review'),
        ('RELEASE', 'Release'),
        ('REJECT', 'Reject'),
        ('AUTHORIZE', 'Authorize'),
        ('VERIFY', 'Verify'),
    ]
    
    MEANING_CHOICES = [
        ('APPROVED_BY', 'Approved by'),
        ('REVIEWED_BY', 'Reviewed by'),
        ('RELEASED_BY', 'Released by'),
        ('REJECTED_BY', 'Rejected by'),
        ('AUTHORIZED_BY', 'Authorized by'),
        ('VERIFIED_BY', 'Verified by'),
    ]
    
    # Signature Details
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='electronic_signatures',
        help_text="User who signed"
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Action being signed"
    )
    meaning = models.CharField(
        max_length=20,
        choices=MEANING_CHOICES,
        help_text="Meaning of the signature"
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the signature was applied"
    )
    
    # What is being signed
    content_type = models.CharField(
        max_length=100,
        help_text="Type of object being signed (e.g., 'Lote', 'OrdenTrabajo')"
    )
    object_id = models.IntegerField(
        help_text="ID of the object being signed"
    )
    object_str = models.CharField(
        max_length=200,
        help_text="String representation of the object"
    )
    
    # Reason and Comments
    reason = models.TextField(
        help_text="Reason for signing (required by 21 CFR Part 11)"
    )
    comments = models.TextField(
        blank=True,
        help_text="Additional comments"
    )
    
    # Authentication Details (for audit)
    password_hash = models.CharField(
        max_length=128,
        default='',
        blank=True,
        help_text="Hash of password used to authenticate (for audit purposes)"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address from which signature was applied"
    )
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        help_text="Browser/client user agent"
    )
    
    # Data Integrity
    data_hash = models.CharField(
        max_length=64,
        default='',
        blank=True,
        help_text="SHA-256 hash of the signed data at the time of signing"
    )
    signature_hash = models.CharField(
        max_length=64,
        default='',
        blank=True,
        editable=False,
        help_text="Hash of the signature itself (for integrity verification)"
    )
    
    # Validation
    is_valid = models.BooleanField(
        default=True,
        help_text="Whether this signature is still valid"
    )
    invalidated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this signature was invalidated"
    )
    invalidated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='signatures_invalidated',
        help_text="User who invalidated this signature"
    )
    invalidation_reason = models.TextField(
        blank=True,
        help_text="Reason for invalidation"
    )
    
    class Meta:
        verbose_name = "Electronic Signature"
        verbose_name_plural = "Electronic Signatures"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['is_valid']),
        ]
    
    def __str__(self):
        return f"{self.get_meaning_display()} - {self.user.get_full_name()} - {self.object_str}"
    
    def save(self, *args, **kwargs):
        """Generate signature hash on save"""
        if not self.signature_hash:
            # Create a hash of all signature components for integrity
            import json
            signature_data = {
                'user_id': self.user.id,
                'action': self.action,
                'meaning': self.meaning,
                'timestamp': self.timestamp.isoformat() if self.timestamp else timezone.now().isoformat(),
                'content_type': self.content_type,
                'object_id': self.object_id,
                'reason': self.reason,
                'data_hash': self.data_hash
            }
            signature_string = json.dumps(signature_data, sort_keys=True)
            self.signature_hash = hashlib.sha256(signature_string.encode()).hexdigest()
        
        super().save(*args, **kwargs)
    
    def verify_integrity(self) -> bool:
        """
        Verify the integrity of this signature
        Returns True if signature is intact, False otherwise
        """
        import json
        signature_data = {
            'user_id': self.user.id,
            'action': self.action,
            'meaning': self.meaning,
            'timestamp': self.timestamp.isoformat(),
            'content_type': self.content_type,
            'object_id': self.object_id,
            'reason': self.reason,
            'data_hash': self.data_hash
        }
        signature_string = json.dumps(signature_data, sort_keys=True)
        calculated_hash = hashlib.sha256(signature_string.encode()).hexdigest()
        
        return calculated_hash == self.signature_hash
    
    def invalidate(self, user: User, reason: str):
        """Invalidate this signature"""
        self.is_valid = False
        self.invalidated_at = timezone.now()
        self.invalidated_by = user
        self.invalidation_reason = reason
        self.save()