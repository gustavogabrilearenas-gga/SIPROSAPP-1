from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IncidenteViewSet

router = DefaultRouter()
router.register('incidentes', IncidenteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]