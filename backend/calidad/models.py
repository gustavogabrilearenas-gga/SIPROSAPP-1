"""Modelos del dominio de Calidad"""

from django.contrib.auth.models import User
from django.db import models


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
    lote = models.ForeignKey('core.Lote', on_delete=models.PROTECT, null=True, blank=True, related_name='desviaciones')
    lote_etapa = models.ForeignKey('core.LoteEtapa', on_delete=models.PROTECT, null=True, blank=True, related_name='desviaciones')
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
        app_label = 'core'

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
        app_label = 'core'

    def __str__(self):
        return f"{self.codigo} - {self.titulo} (v{self.version})"


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

    incidente = models.ForeignKey('core.Incidente', on_delete=models.CASCADE, related_name='acciones_correctivas')
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
        app_label = 'core'

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.incidente.codigo}"
