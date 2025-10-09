"""Configuración de la aplicación de KPIs."""

from django.apps import AppConfig


class KpisConfig(AppConfig):
    """Config de la app KPIs."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.kpis"
    verbose_name = "KPIs y Métricas"
