"""Rutas del dominio de incidencias"""

from rest_framework import routers

from .views import IncidenteViewSet, TipoIncidenteViewSet

router = routers.DefaultRouter()
router.register(r'tipos-incidente', TipoIncidenteViewSet)
router.register(r'incidentes', IncidenteViewSet, basename='incidencia')

urlpatterns = router.urls
