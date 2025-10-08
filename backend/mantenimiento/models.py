"""Modelos del dominio de Mantenimiento."""

from decimal import Decimal

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models

from core.models import Maquina


class TipoMantenimiento(models.Model):
    """Tipos de mantenimiento."""

    codigo = models.CharField(max_length=10, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Tipo de Mantenimiento"
        verbose_name_plural = "Tipos de Mantenimiento"
        ordering = ['codigo']
        app_label = 'core'

    def __str__(self) -> str:
        return f"{self.codigo} - {self.nombre}"


class PlanMantenimiento(models.Model):
    """Planes de mantenimiento preventivo."""

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
        app_label = 'core'

    def __str__(self) -> str:
        return f"{self.codigo} - {self.nombre}"


class OrdenTrabajo(models.Model):
    """Órdenes de trabajo de mantenimiento."""

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
    plan_mantenimiento = models.ForeignKey(
        PlanMantenimiento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_generadas',
    )
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
        app_label = 'core'

    def __str__(self) -> str:
        return f"{self.codigo} - {self.titulo}"

    def save(self, *args, **kwargs):
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            self.duracion_real_horas = round(Decimal(delta.total_seconds() / 3600), 2)
        super().save(*args, **kwargs)


class OrdenTrabajoRepuesto(models.Model):
    """Repuestos utilizados en órdenes de trabajo."""

    orden_trabajo = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='repuestos_utilizados')
    repuesto = models.ForeignKey('core.Repuesto', on_delete=models.PROTECT)
    cantidad_planificada = models.IntegerField(validators=[MinValueValidator(1)])
    cantidad_real = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    fecha_uso = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Repuesto de Orden de Trabajo"
        verbose_name_plural = "Repuestos de Órdenes de Trabajo"
        app_label = 'core'

    def __str__(self) -> str:
        return f"{self.orden_trabajo.codigo} - {self.repuesto.nombre}"


class HistorialMantenimiento(models.Model):
    """Historial consolidado de mantenimientos por máquina."""

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
        app_label = 'core'

    def __str__(self) -> str:
        return f"{self.maquina.codigo} - {self.fecha.strftime('%Y-%m-%d')}"


class IndicadorMantenimiento(models.Model):
    """KPIs de mantenimiento (MTBF, MTTR, Disponibilidad)."""

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
        app_label = 'core'

    def __str__(self) -> str:
        return f"{self.maquina.codigo} - {self.get_periodo_display()} ({self.fecha_inicio})"
