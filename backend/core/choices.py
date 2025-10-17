"""Enums compartidos en toda la plataforma."""

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


class UnidadProduccion(models.TextChoices):
    COMPRIMIDOS = "COMPRIMIDOS", "Comprimidos"
    KG = "KG", "Kilogramos"
    LITROS = "LITROS", "Litros"
    BLISTERS = "BLISTERS", "Blisters"


class TipoMantenimiento(models.TextChoices):
    CORRECTIVO = "CORRECTIVO", "Correctivo"
    AUTONOMO = "AUTONOMO", "Autónomo"
    PREVENTIVO = "PREVENTIVO", "Preventivo"


class ContextoIncidente(models.TextChoices):
    OPERACIONES = "OPERACIONES", "Operaciones"
    MANTENIMIENTO = "MANTENIMIENTO", "Mantenimiento"
    GENERAL = "GENERAL", "General"
