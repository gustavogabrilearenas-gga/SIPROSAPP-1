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
from backend.mantenimiento.models import (
    HistorialMantenimiento,
    IndicadorMantenimiento,
    OrdenTrabajo,
    PlanMantenimiento,
    TipoMantenimiento,
)


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


# ============================================
# 4. MÓDULO: INVENTARIO
# ============================================

    def __str__(self):
        return f"{self.maquina.codigo} - {self.get_periodo_display()} ({self.fecha_inicio})"


# ============================================
# 6. MÓDULO: NOTIFICACIONES
# ============================================

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

