"""Modelos del dominio de incidencias"""

from django.contrib.auth.models import User
from django.db import models


class TipoIncidente(models.Model):
    """Categorías de incidentes"""

    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    requiere_investigacion = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        app_label = 'core'
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
    ubicacion = models.ForeignKey('core.Ubicacion', on_delete=models.PROTECT, related_name='incidentes')
    maquina = models.ForeignKey('core.Maquina', on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes')
    lote_afectado = models.ForeignKey('core.Lote', on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes')
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
        app_label = 'core'
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
        app_label = 'core'
        verbose_name = "Investigación de Incidente"
        verbose_name_plural = "Investigaciones de Incidentes"

    def __str__(self):
        return f"Investigación - {self.incidente.codigo}"
