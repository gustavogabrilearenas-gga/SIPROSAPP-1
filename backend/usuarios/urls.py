"""URLConf del dominio de usuarios."""

from rest_framework.routers import DefaultRouter

from backend.usuarios.views import UsuarioViewSet

router = DefaultRouter()
router.register(r'', UsuarioViewSet, basename='usuario')

urlpatterns = router.urls
