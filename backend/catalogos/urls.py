"""
URLs para los endpoints de catálogos
"""
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    UbicacionViewSet,
    MaquinaViewSet,
    ProductoViewSet,
    FormulaViewSet,
    EtapaProduccionViewSet,
    TurnoViewSet,
)

router = DefaultRouter()
router.register('ubicaciones', UbicacionViewSet)
router.register('maquinas', MaquinaViewSet)
router.register('productos', ProductoViewSet)
router.register('formulas', FormulaViewSet)
router.register('etapas', EtapaProduccionViewSet)
router.register('turnos', TurnoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
