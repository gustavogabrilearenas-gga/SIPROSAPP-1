"""URLs del dominio de Producción"""

from rest_framework.routers import DefaultRouter

from backend.produccion.views import (
    RegistroProduccionViewSet,
    LoteEtapaViewSet,
    LoteViewSet,
)

router = DefaultRouter()
router.register(
    r"planificacion-lotes", LoteViewSet, basename="planificacion-lote"
)
router.register(
    r"ejecucion-etapas-operario",
    LoteEtapaViewSet,
    basename="ejecucion-etapa-operario",
)
router.register(
    r"resumen-produccion-automatico",
    RegistroProduccionViewSet,
    basename="resumen-produccion",
)

urlpatterns = router.urls
