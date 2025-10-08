"""URLConf del dominio de producción."""

from rest_framework.routers import DefaultRouter

from backend.produccion.views import (
    ControlCalidadViewSet,
    LoteEtapaViewSet,
    LoteViewSet,
    ParadaViewSet,
)

router = DefaultRouter()
router.register(r'lotes', LoteViewSet)
router.register(r'lotes-etapas', LoteEtapaViewSet)
router.register(r'paradas', ParadaViewSet)
router.register(r'controles-calidad', ControlCalidadViewSet)
router.register(r'', LoteViewSet, basename='produccion')

urlpatterns = router.urls
