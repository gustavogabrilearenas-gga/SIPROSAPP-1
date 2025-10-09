"""Rutas del módulo de KPIs."""

from django.urls import path

from .views import (
    AlertasView,
    HistorialProduccionView,
    LiveAlertsView,
    OeeView,
    ResumenDashboardView,
)

urlpatterns = [
    path("resumen_dashboard/", ResumenDashboardView.as_view(), name="kpis-resumen-dashboard"),
    path("oee/", OeeView.as_view(), name="kpis-oee"),
    path("historial_produccion/", HistorialProduccionView.as_view(), name="kpis-historial-produccion"),
    path("alertas/", AlertasView.as_view(), name="kpis-alertas"),
    path("live_alerts/", LiveAlertsView.as_view(), name="kpis-live-alerts"),
]
