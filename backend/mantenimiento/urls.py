"""URLs del dominio de Mantenimiento."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from backend.mantenimiento.views import OrdenTrabajoViewSet, TipoMantenimientoViewSet

router = DefaultRouter()
router.register(r'tipos-mantenimiento', TipoMantenimientoViewSet, basename='tipomantenimiento')
router.register(r'ordenes-trabajo', OrdenTrabajoViewSet, basename='ordentrabajo')

orden_trabajo_list = OrdenTrabajoViewSet.as_view({'get': 'list', 'post': 'create'})
orden_trabajo_detail = OrdenTrabajoViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('', orden_trabajo_list, name='mantenimiento-list'),
    path('<int:pk>/', orden_trabajo_detail, name='mantenimiento-detail'),
    path('', include(router.urls)),
]
