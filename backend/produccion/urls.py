"""URLs del dominio de Producción"""

from rest_framework.routers import DefaultRouter

from backend.produccion.views import (
    RegistroProduccionViewSet,
    LoteEtapaViewSet,
    LoteViewSet,
)

router = DefaultRouter()
router.register(r"registros", RegistroProduccionViewSet, basename="registro-produccion")
router.register(r"lotes", LoteViewSet, basename="lote")
router.register(r"lotes-etapas", LoteEtapaViewSet, basename="loteetapa")

urlpatterns = router.urls
