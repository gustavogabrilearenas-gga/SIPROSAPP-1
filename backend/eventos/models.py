"""Modelos para el registro de eventos de producción, mantenimiento e incidentes."""

from django.db import models
from django.contrib.auth.models import User
from backend.catalogos.models import Maquina, Producto


class RegistroProduccion(models.Model):
    """Registro de eventos de producción."""
    
    fecha_produccion = models.DateField()
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='registros_produccion'
    )
    turno = models.CharField(
        max_length=2, 
        choices=[
            ('M', 'Mañana'),
            ('T', 'Tarde'),
            ('N', 'Noche'),
            ('R', 'Rotativo'),
        ]
    )
    hubo_produccion = models.BooleanField()
    maquina = models.ForeignKey(
        Maquina,
        on_delete=models.PROTECT,
        related_name='registros_produccion'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='registros_produccion'
    )
    UNIDAD_CHOICES = [
        ('COMPRIMIDOS', 'Comprimidos'),
        ('KG', 'Kilogramos'),
        ('LITROS', 'Litros'),
        ('BLISTERS', 'Blisters'),
    ]
    unidad_medida = models.CharField(max_length=20, choices=UNIDAD_CHOICES)
    cantidad_producida = models.DecimalField(max_digits=10, decimal_places=2)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Registro de Producción"
        verbose_name_plural = "Registros de Producción"
        ordering = ['-fecha_produccion']

    def __str__(self):
        return f"Producción {self.maquina.codigo} - {self.fecha_produccion}"


class RegistroMantenimiento(models.Model):
    """Registro de eventos de mantenimiento."""
    
    fecha_mantenimiento = models.DateField()
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='registros_mantenimiento'
    )
    turno = models.CharField(
        max_length=2, 
        choices=[
            ('M', 'Mañana'),
            ('T', 'Tarde'),
            ('N', 'Noche'),
            ('R', 'Rotativo'),
        ]
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
        ordering = ['-fecha_mantenimiento']

    def __str__(self):
        return f"Mantenimiento {self.maquina.codigo} - {self.fecha_mantenimiento}"


class RegistroIncidente(models.Model):
    """Registro de eventos de incidentes o paradas."""
    
    fecha_incidente = models.DateField()
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='registros_incidentes'
    )
    turno = models.CharField(
        max_length=2, 
        choices=[
            ('M', 'Mañana'),
            ('T', 'Tarde'),
            ('N', 'Noche'),
            ('R', 'Rotativo'),
        ]
    )
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    maquina = models.ForeignKey(
        Maquina,
        on_delete=models.PROTECT,
        related_name='registros_incidentes'
    )
    descripcion = models.TextField()
    acciones_correctivas = models.BooleanField(default=False)
    detalle_acciones = models.TextField(blank=True)
    observaciones = models.TextField(blank=True)
    CONTEXTO_CHOICES = [
        ('PRODUCCION', 'Producción'),
        ('MANTENIMIENTO', 'Mantenimiento'),
        ('GENERAL', 'General'),
    ]
    contexto_origen = models.CharField(max_length=20, choices=CONTEXTO_CHOICES)

    class Meta:
        verbose_name = "Registro de Incidente"
        verbose_name_plural = "Registros de Incidentes"
        ordering = ['-fecha_incidente']

    def __str__(self):
        return f"Incidente {self.maquina.codigo} - {self.fecha_incidente}"


class ObservacionGeneral(models.Model):
    """Registro de observaciones generales."""
    
    fecha_observacion = models.DateField()
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='observaciones_registradas'
    )
    turno = models.CharField(
        max_length=2, 
        choices=[
            ('M', 'Mañana'),
            ('T', 'Tarde'),
            ('N', 'Noche'),
            ('R', 'Rotativo'),
        ]
    )
    observaciones = models.TextField()

    class Meta:
        verbose_name = "Observación General"
        verbose_name_plural = "Observaciones Generales"
        ordering = ['-fecha_observacion']

    def __str__(self):
        return f"Observación General - {self.fecha_observacion}"