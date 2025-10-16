"""URLs para el módulo de observaciones."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegistroProduccionViewSet,
    RegistroMantenimientoViewSet,
    RegistroIncidenteViewSet,
    ObservacionGeneralViewSet
)

router = DefaultRouter()
router.register(r'registros-produccion', RegistroProduccionViewSet)
router.register(r'registros-mantenimiento', RegistroMantenimientoViewSet)
router.register(r'registros-incidentes', RegistroIncidenteViewSet)
router.register(r'observaciones-generales', ObservacionGeneralViewSet)

urlpatterns = [
    path('', include(router.urls)),
]