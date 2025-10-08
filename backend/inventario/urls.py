"""URLs del dominio de Inventario"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from backend.inventario.views import (
    InsumoViewSet,
    LoteInsumoViewSet,
    MovimientoInventarioViewSet,
    ProductoTerminadoViewSet,
    RepuestoViewSet,
)

router = DefaultRouter()
router.register(r'insumos', InsumoViewSet, basename='insumo')
router.register(r'lotes-insumo', LoteInsumoViewSet, basename='loteinsumo')
router.register(r'repuestos', RepuestoViewSet, basename='repuesto')
router.register(r'productos-terminados', ProductoTerminadoViewSet, basename='productoterminado')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimiento')

insumo_list = InsumoViewSet.as_view({'get': 'list', 'post': 'create'})
insumo_detail = InsumoViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('', insumo_list, name='inventario-list'),
    path('<int:pk>/', insumo_detail, name='inventario-detail'),
    path('', include(router.urls)),
]
