"""URLs del módulo de auditoría."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ElectronicSignatureViewSet, LogAuditoriaViewSet

router = DefaultRouter()
router.register('logs', LogAuditoriaViewSet, basename='logs-auditoria')
router.register('firmas', ElectronicSignatureViewSet, basename='firmas-auditoria')

urlpatterns = [
    path('', include(router.urls)),
]
