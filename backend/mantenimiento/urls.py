from rest_framework.routers import DefaultRouter

from .views import RegistroMantenimientoViewSet

router = DefaultRouter()
router.register(
    r"registros",
    RegistroMantenimientoViewSet,
    basename="registro-mantenimiento"
)

urlpatterns = router.urls