"""
Modelos de los catálogos maestros del sistema.
"""

from django.db import models
from django.core.validators import MinValueValidator


class Ubicacion(models.Model):
    """Áreas físicas de la planta"""
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código", db_index=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Ubicación física"
        verbose_name_plural = "Ubicaciones físicas"
        ordering = ["nombre"]
        indexes = [
            models.Index(fields=['codigo', 'activa']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Funcion(models.Model):
    """Funciones/áreas organizacionales (Producción, Calidad, etc.)."""

    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código", db_index=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Función"
        verbose_name_plural = "Funciones"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Maquina(models.Model):
    """Equipos de producción y servicios"""
    
    TIPO_CHOICES = [
        ('COMPRESION', 'Compresión'),
        ('MEZCLADO', 'Mezclado'),
        ('GRANULACION', 'Granulación'),
        ('EMBLISTADO', 'Emblistado'),
        ('SERVICIOS', 'Servicios'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código", db_index=True)
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
    fecha_instalacion = models.DateField(null=True, blank=True, verbose_name="Fecha de Instalación")
    imagen = models.ImageField(upload_to='maquinas/', null=True, blank=True)
    documentos = models.JSONField(default=list, help_text="Lista de documentos: [{nombre, url}]")
    
    class Meta:
        verbose_name = "Máquina"
        verbose_name_plural = "Máquinas"
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['codigo', 'activa']),
            models.Index(fields=['tipo', 'activa']),
            models.Index(fields=['ubicacion', 'activa']),
        ]
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Producto(models.Model):
    """Catálogo de productos farmacéuticos"""
    
    TIPO_CHOICES = [
        ('COMPRIMIDO', 'Comprimido'),
        ('CAPSULA', 'Cápsula'),
        ('JARABE', 'Jarabe'),
        ('INYECTABLE', 'Inyectable'),
        ('CREMA', 'Crema'),
    ]
    
    PRESENTACION_CHOICES = [
        ('BLISTER', 'Blister'),
        ('FRASCO', 'Frasco'),
        ('POMO', 'Pomo'),
        ('AMPOLLA', 'Ampolla'),
        ('SOBRE', 'Sobre'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código", db_index=True)
    nombre = models.CharField(max_length=200, db_index=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    presentacion = models.CharField(max_length=20, choices=PRESENTACION_CHOICES)
    concentracion = models.CharField(max_length=50, help_text="ej: 500mg, 10mg/ml")
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    documentos = models.JSONField(default=list, help_text="Lista de documentos: [{nombre, url}]")
    
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['codigo', 'activo']),
            models.Index(fields=['nombre', 'activo']),
            models.Index(fields=['tipo', 'activo']),
        ]
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.concentracion})"


class Formula(models.Model):
    """Recetas de producción (Master Formula)"""
    
    VERSION_CHOICES = [
        ('1.0', '1.0'),
        ('1.1', '1.1'),
        ('2.0', '2.0'),
        ('3.0', '3.0'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True, db_index=True)
    version = models.CharField(max_length=10, choices=VERSION_CHOICES)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='formulas')
    descripcion = models.TextField(blank=True)
    tamaño_lote = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Tamaño estándar del lote"
    )
    unidad = models.CharField(max_length=20)
    tiempo_total = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Tiempo total en horas"
    )
    activa = models.BooleanField(default=True)
    aprobada = models.BooleanField(default=False)
    ingredientes = models.JSONField(
        default=list,
        help_text="Lista de ingredientes: [{material_id, cantidad, unidad}]"
    )
    etapas = models.JSONField(
        default=list,
        help_text="Lista de etapas: [{etapa_id, duracion_min, descripcion}]"
    )
    
    class Meta:
        verbose_name = "Fórmula"
        verbose_name_plural = "Fórmulas"
        ordering = ['codigo', 'version']
        unique_together = ['codigo', 'version']
        indexes = [
            models.Index(fields=['producto', 'activa']),
            models.Index(fields=['codigo', 'version']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(tamaño_lote__gt=0),
                name='formula_tamaño_lote_positivo'
            ),
            models.CheckConstraint(
                check=models.Q(tiempo_total__gt=0),
                name='formula_tiempo_positivo'
            ),
        ]
    
    def __str__(self):
        return f"{self.codigo} v{self.version} - {self.producto.nombre}"


class Parametro(models.Model):
    """Catálogo minimalista de parámetros de proceso/registro."""

    codigo = models.CharField(max_length=30, unique=True, db_index=True, verbose_name="Código")
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True)
    unidad = models.CharField(max_length=20, blank=True, help_text="Ej: kg, min, °C")
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["nombre"]
        verbose_name = "Parámetro"
        verbose_name_plural = "Parámetros"

    def __str__(self) -> str:
        return self.nombre


class EtapaProduccion(models.Model):
    """Catálogo de etapas del proceso productivo"""

    codigo = models.CharField(max_length=20, unique=True, db_index=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    maquinas_permitidas = models.ManyToManyField(
        Maquina,
        related_name='etapas_produccion',
        blank=True,
    )
    activa = models.BooleanField(default=True)
    parametros = models.ManyToManyField(
        "catalogos.Parametro",
        blank=True,
        related_name="etapas",
        verbose_name="Parámetros",
    )

    class Meta:
        verbose_name = "Etapa de Producción"
        verbose_name_plural = "Etapas de Producción"
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['codigo', 'activa']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Turno(models.Model):
    """Turnos de trabajo"""
    
    codigo = models.CharField(max_length=1, unique=True, choices=[
        ('M', 'Mañana'),
        ('T', 'Tarde'),
        ('N', 'Noche'),
    ], db_index=True)
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