"""Modelos del dominio de mantenimiento."""

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


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

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class PlanMantenimiento(models.Model):
    """Planes de mantenimiento preventivo."""

    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    maquina = models.ForeignKey(
        'catalogos.Maquina',
        on_delete=models.CASCADE,
        related_name='planes_mantenimiento',
    )
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    tipo = models.ForeignKey(TipoMantenimiento, on_delete=models.PROTECT)
    frecuencia_dias = models.IntegerField(
        null=True,
        blank=True,
        help_text="Frecuencia en días",
    )
    frecuencia_horas_uso = models.IntegerField(
        null=True,
        blank=True,
        help_text="Frecuencia en horas de uso",
    )
    frecuencia_ciclos = models.IntegerField(
        null=True,
        blank=True,
        help_text="Frecuencia en ciclos de operación",
    )
    tareas = models.JSONField(
        default=list,
        help_text="Lista de tareas: [{nombre, descripcion, duracion_min}]",
    )
    repuestos_necesarios = models.JSONField(
        default=list,
        help_text="Lista de repuestos: [{repuesto_id, cantidad}]",
    )
    duracion_estimada_horas = models.DecimalField(max_digits=5, decimal_places=2)
    activo = models.BooleanField(default=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='planes_creados',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Plan de Mantenimiento"
        verbose_name_plural = "Planes de Mantenimiento"
        ordering = ['maquina', 'codigo']

    def __str__(self):
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
    maquina = models.ForeignKey(
        'catalogos.Maquina',
        on_delete=models.PROTECT,
        related_name='ordenes_trabajo',
    )
    plan_mantenimiento = models.ForeignKey(
        PlanMantenimiento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_generadas',
    )
    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='NORMAL',
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='ABIERTA',
    )
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_planificada = models.DateTimeField(null=True, blank=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_real_horas = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
    )
    creada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ordenes_creadas',
    )
    asignada_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_asignadas',
    )
    completada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_completadas',
    )
    trabajo_realizado = models.TextField(blank=True)
    observaciones = models.TextField(blank=True)
    requiere_parada_produccion = models.BooleanField(default=False)
    costo_estimado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    costo_real = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

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


class HistorialMantenimiento(models.Model):
    """Historial consolidado de mantenimientos por máquina."""

    maquina = models.ForeignKey(
        'catalogos.Maquina',
        on_delete=models.CASCADE,
        related_name='historial_mantenimiento',
    )
    orden_trabajo = models.ForeignKey(
        OrdenTrabajo,
        on_delete=models.CASCADE,
        related_name='historial',
    )
    fecha = models.DateTimeField()
    tipo = models.ForeignKey(TipoMantenimiento, on_delete=models.PROTECT)
    descripcion = models.TextField()
    tiempo_parada_horas = models.DecimalField(max_digits=6, decimal_places=2)
    costo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='mantenimientos_realizados',
    )

    class Meta:
        verbose_name = "Historial de Mantenimiento"
        verbose_name_plural = "Historiales de Mantenimiento"
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.maquina.codigo} - {self.fecha.strftime('%Y-%m-%d')}"



