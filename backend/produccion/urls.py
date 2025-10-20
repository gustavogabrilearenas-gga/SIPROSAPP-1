"""Rutas del módulo de producción."""

from rest_framework.routers import DefaultRouter

from .views import RegistroProduccionViewSet

router = DefaultRouter()
router.register(r"registros", RegistroProduccionViewSet, basename="registro-produccion")

urlpatterns = router.urls
