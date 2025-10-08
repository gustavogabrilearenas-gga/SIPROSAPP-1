"""
URLs para SIPROSA MES
"""

from django.urls import include, path
from rest_framework import routers
from .views import (
    # Catálogos
    UbicacionViewSet, MaquinaViewSet, ProductoViewSet, FormulaViewSet,
    EtapaProduccionViewSet, TurnoViewSet,
    # Calidad
    DesviacionViewSet, AccionCorrectivaViewSet, DocumentoVersionadoViewSet,
    # Incidentes
    TipoIncidenteViewSet, IncidenteViewSet,
    # Notificaciones
    NotificacionViewSet,
    # Firmas
    ElectronicSignatureViewSet,
    # KPIs
    KpiOEEView, KpiDashboardView, KpiExportCSVView,
    # Búsqueda y Auditoría
    BusquedaGlobalView, AuditoriaGenericaView,
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

# Calidad
router.register(r'desviaciones', DesviacionViewSet)
router.register(r'acciones-correctivas', AccionCorrectivaViewSet)
router.register(r'documentos', DocumentoVersionadoViewSet)

# Incidentes
router.register(r'tipos-incidente', TipoIncidenteViewSet)
router.register(r'incidentes', IncidenteViewSet)

# Notificaciones
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')

# Firmas Electrónicas
router.register(r'firmas', ElectronicSignatureViewSet)

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
    
    # Búsqueda y Auditoría
    path("buscar/", BusquedaGlobalView.as_view(), name="busqueda_global"),
    path("auditoria/", AuditoriaGenericaView.as_view(), name="auditoria_generica"),
] + router.urls
