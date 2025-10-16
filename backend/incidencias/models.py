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
    ubicacion = models.ForeignKey('catalogos.Ubicacion', on_delete=models.PROTECT, related_name='incidentes')
    maquina = models.ForeignKey('catalogos.Maquina', on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes')
    lote_afectado = models.ForeignKey('produccion.Lote', on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes')
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


