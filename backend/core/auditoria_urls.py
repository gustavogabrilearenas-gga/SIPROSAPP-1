"""Rutas del dominio de auditoría"""

from rest_framework import routers

from .auditoria_views import ElectronicSignatureViewSet, LogAuditoriaViewSet

router = routers.DefaultRouter()
router.register(r'logs', LogAuditoriaViewSet, basename='auditoria')
router.register(r'firmas', ElectronicSignatureViewSet)

urlpatterns = router.urls
