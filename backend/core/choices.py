from django.db import models


class EstadoLote(models.TextChoices):
    PLANIFICADO = "PLANIFICADO", "Planificado"
    EN_PROCESO = "EN_PROCESO", "En Proceso"
    PAUSADO = "PAUSADO", "Pausado"
    FINALIZADO = "FINALIZADO", "Finalizado"
    CANCELADO = "CANCELADO", "Cancelado"
    RECHAZADO = "RECHAZADO", "Rechazado"
    LIBERADO = "LIBERADO", "Liberado"


class Prioridad(models.TextChoices):
    BAJA = "BAJA", "Baja"
    NORMAL = "NORMAL", "Normal"
    ALTA = "ALTA", "Alta"
    URGENTE = "URGENTE", "Urgente"


class EstadoEtapa(models.TextChoices):
    PENDIENTE = "PENDIENTE", "Pendiente"
    EN_PROCESO = "EN_PROCESO", "En Proceso"
    PAUSADO = "PAUSADO", "Pausado"
    COMPLETADO = "COMPLETADO", "Completado"
    RECHAZADO = "RECHAZADO", "Rechazado"
