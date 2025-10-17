"""Modelos para el registro de observaciones de mantenimiento, incidentes y generales."""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from backend.catalogos.models import Maquina, Turno


class RegistroMantenimiento(models.Model):
    """Registro de observaciones de mantenimiento."""
    
    fecha_mantenimiento = models.DateField(db_index=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='registros_mantenimiento'
    )
    turno = models.ForeignKey(
        Turno,
        on_delete=models.PROTECT,
        related_name='registros_mantenimiento',
        verbose_name='Turno'
    )
    se_realizo_mantenimiento = models.BooleanField()
    maquina = models.ForeignKey(
        Maquina,
        on_delete=models.PROTECT,
        related_name='registros_mantenimiento'
    )
    TIPO_CHOICES = [
        ('CORRECTIVO', 'Correctivo'),
        ('AUTONOMO', 'Autónomo'),
        ('PREVENTIVO', 'Preventivo'),
    ]
    tipo_mantenimiento = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    registro_materiales = models.BooleanField(default=False)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Registro de Mantenimiento"
        verbose_name_plural = "Registros de Mantenimiento"
        ordering = ['-fecha_mantenimiento', '-fecha_registro']
        indexes = [
            models.Index(fields=['-fecha_mantenimiento', 'maquina']),
            models.Index(fields=['maquina', 'tipo_mantenimiento']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(se_realizo_mantenimiento=True) | models.Q(descripcion__isnull=False),
                name='mantenimiento_requiere_descripcion'
            ),
        ]

    def __str__(self):
        return f"Mantenimiento {self.maquina.codigo} - {self.fecha_mantenimiento}"

    def clean(self):
        """Validaciones de negocio."""
        super().clean()
        if self.hora_fin <= self.hora_inicio:
            raise ValidationError({
                'hora_fin': 'La hora de fin debe ser posterior a la hora de inicio.'
            })


class RegistroIncidente(models.Model):
    """Registro de observaciones de incidentes o paradas."""
    
    fecha_incidente = models.DateField(db_index=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='registros_incidentes'
    )
    turno = models.ForeignKey(
        Turno,
        on_delete=models.PROTECT,
        related_name='registros_incidentes',
        verbose_name='Turno'
    )
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    maquina = models.ForeignKey(
        Maquina,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registros_incidentes'
    )
    descripcion = models.TextField()
    acciones_correctivas = models.BooleanField(default=False)
    detalle_acciones = models.TextField(blank=True)
    observaciones = models.TextField(blank=True)
    CONTEXTO_CHOICES = [
        ('OPERACIONES', 'Operaciones'),
        ('MANTENIMIENTO', 'Mantenimiento'),
        ('GENERAL', 'General'),
    ]
    contexto_origen = models.CharField(max_length=20, choices=CONTEXTO_CHOICES)

    class Meta:
        verbose_name = "Registro de Incidente"
        verbose_name_plural = "Registros de Incidentes"
        ordering = ['-fecha_incidente', '-fecha_registro']
        indexes = [
            models.Index(fields=['-fecha_incidente', 'maquina']),
            models.Index(fields=['contexto_origen', 'fecha_incidente']),
        ]

    def __str__(self):
        maquina_str = self.maquina.codigo if self.maquina else 'Sin máquina'
        return f"Incidente {maquina_str} - {self.fecha_incidente}"

    def clean(self):
        """Validaciones de negocio."""
        super().clean()
        if self.hora_fin <= self.hora_inicio:
            raise ValidationError({
                'hora_fin': 'La hora de fin debe ser posterior a la hora de inicio.'
            })
        if self.acciones_correctivas and not self.detalle_acciones:
            raise ValidationError({
                'detalle_acciones': 'Debe especificar el detalle de las acciones correctivas.'
            })


class ObservacionGeneral(models.Model):
    """Registro de observaciones generales."""
    
    fecha_observacion = models.DateField(db_index=True)
    hora_registro = models.TimeField(default='09:00', verbose_name='Hora de Registro')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='observaciones_registradas'
    )
    observaciones = models.TextField()

    class Meta:
        verbose_name = "Observación General"
        verbose_name_plural = "Observaciones Generales"
        ordering = ['-fecha_observacion', '-hora_registro']
        indexes = [
            models.Index(fields=['-fecha_observacion', 'hora_registro']),
        ]

    def __str__(self):
        return f"Observación General - {self.fecha_observacion} {self.hora_registro}"