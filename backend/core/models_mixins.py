from django.core.exceptions import ValidationError
from django.db import models


class TimeWindowMixin(models.Model):
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_minutos = models.PositiveIntegerField(default=0, editable=False)

    class Meta:
        abstract = True

    def clean(self):
        super().clean()
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin <= self.fecha_inicio:
            raise ValidationError({'fecha_fin': 'Fin debe ser posterior a inicio.'})

    def save(self, *args, **kw):
        if self.fecha_inicio and self.fecha_fin:
            self.duracion_minutos = int((self.fecha_fin - self.fecha_inicio).total_seconds() // 60)
        super().save(*args, **kw)
