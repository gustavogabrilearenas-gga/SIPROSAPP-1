"""URLs del dominio de Producción"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from backend.produccion.views import (
    ControlCalidadViewSet,
    LoteEtapaViewSet,
    LoteViewSet,
    ParadaViewSet,
)

router = DefaultRouter()
router.register(r'lotes', LoteViewSet, basename='lote')
router.register(r'lotes-etapas', LoteEtapaViewSet, basename='loteetapa')
router.register(r'paradas', ParadaViewSet, basename='parada')
router.register(r'controles-calidad', ControlCalidadViewSet, basename='controlcalidad')

lote_list = LoteViewSet.as_view({'get': 'list', 'post': 'create'})
lote_detail = LoteViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('', lote_list, name='produccion-list'),
    path('<int:pk>/', lote_detail, name='produccion-detail'),
    path('', include(router.urls)),
]
