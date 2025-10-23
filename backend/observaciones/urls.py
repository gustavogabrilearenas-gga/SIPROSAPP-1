from rest_framework.routers import DefaultRouter

from .views import ObservacionGeneralViewSet

router = DefaultRouter()
router.register(
    r"observaciones", ObservacionGeneralViewSet, basename="observacion-general"
)

urlpatterns = router.urls
