"""URLs para los endpoints de catálogos."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    UbicacionViewSet,
    MaquinaViewSet,
    ProductoViewSet,
    FormulaViewSet,
    EtapaProduccionViewSet,
    TurnoViewSet,
    FuncionViewSet,
    ParametroViewSet,
)

router = DefaultRouter()
router.register('ubicaciones', UbicacionViewSet)
router.register('maquinas', MaquinaViewSet)
router.register('productos', ProductoViewSet)
router.register('formulas', FormulaViewSet)
router.register('etapas-produccion', EtapaProduccionViewSet)
router.register('turnos', TurnoViewSet)
router.register('funciones', FuncionViewSet)
router.register('parametros', ParametroViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
