from django.conf import settings
from django.db import models


class ObservacionGeneral(models.Model):
    texto = models.TextField()
    fecha_hora = models.DateTimeField(auto_now_add=True, editable=False)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        editable=False,
        related_name="observaciones",
    )

    class Meta:
        verbose_name = "Observación general"
        verbose_name_plural = "Observaciones generales"

    def __str__(self) -> str:
        return f"Observación {self.pk}"
