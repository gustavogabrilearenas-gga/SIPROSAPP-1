"""
URLs para SIPROSA MES
"""

from django.urls import include, path
from rest_framework import routers
from .views import (
    # Catálogos
    UbicacionViewSet, MaquinaViewSet, ProductoViewSet, FormulaViewSet,
    EtapaProduccionViewSet, TurnoViewSet,
    # KPIs
    KpiOEEView, KpiDashboardView, KpiExportCSVView,
    # Health check
    health_check,
)
from .auth_views import (
    login_view, logout_view, me_view, refresh_token_view, register_view
)

router = routers.DefaultRouter()

# Catálogos Maestros
router.register(r'ubicaciones', UbicacionViewSet)
router.register(r'maquinas', MaquinaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'formulas', FormulaViewSet)
router.register(r'etapas-produccion', EtapaProduccionViewSet)
router.register(r'turnos', TurnoViewSet)

urlpatterns = [
    # Health check
    path("health/", health_check, name="health_check"),
    
    path("usuarios/", include("backend.usuarios.urls")),

    # Autenticación
    path("auth/login/", login_view, name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/me/", me_view, name="me"),
    path("auth/refresh/", refresh_token_view, name="refresh_token"),
    path("auth/register/", register_view, name="register"),
    
    # KPIs
    path("kpis/oee/", KpiOEEView.as_view(), name="kpi_oee"),
    path("kpis/resumen_dashboard/", KpiDashboardView.as_view(), name="kpi_dashboard"),
    path("kpis/export.csv", KpiExportCSVView.as_view(), name="kpi_export_csv"),
    
] + router.urls
