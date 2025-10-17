"""Enums compartidos en toda la plataforma."""

from django.db import models


class TipoMantenimiento(models.TextChoices):
    CORRECTIVO = "CORRECTIVO", "Correctivo"
    AUTONOMO = "AUTONOMO", "Autónomo"
    PREVENTIVO = "PREVENTIVO", "Preventivo"


class ContextoIncidente(models.TextChoices):
    OPERACIONES = "OPERACIONES", "Operaciones"
    MANTENIMIENTO = "MANTENIMIENTO", "Mantenimiento"
    GENERAL = "GENERAL", "General"
