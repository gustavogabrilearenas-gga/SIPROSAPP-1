from django.db import models
from backend.catalogos.models import Maquina

class Incidente(models.Model):
    ORIGEN_CHOICES = [
        ('produccion', 'Producción'),
        ('mantenimiento', 'Mantenimiento'),
        ('general', 'General/No asociado'),
    ]

    fecha_inicio = models.DateTimeField('Fecha de inicio')
    fecha_fin = models.DateTimeField('Fecha de fin')
    es_parada_no_planificada = models.BooleanField('¿Es parada no planificada?', default=True,
        help_text='Si está marcado, se considera un incidente (parada no planificada). Si no, es una parada planificada.')
    origen = models.CharField('Contexto de origen', max_length=20, choices=ORIGEN_CHOICES)
    maquina = models.ForeignKey(
        Maquina,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Máquina asociada'
    )
    descripcion = models.TextField('Descripción del incidente')
    requiere_acciones_correctivas = models.BooleanField('¿Requiere acciones correctivas?', default=False)
    acciones_correctivas = models.TextField('Acciones correctivas', blank=True,
        help_text='Descripción de las acciones correctivas aplicadas')
    observaciones = models.TextField('Observaciones adicionales', blank=True)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Incidente'
        verbose_name_plural = 'Incidentes'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"Incidente del {self.fecha_inicio.strftime('%d/%m/%Y %H:%M')}"