"""Rutas del dominio de mantenimiento."""

from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import OrdenTrabajoViewSet, TipoMantenimientoViewSet

router = SimpleRouter()
router.register(r'ordenes-trabajo', OrdenTrabajoViewSet, basename='ordenestrabajo')
router.register(r'tipos-mantenimiento', TipoMantenimientoViewSet, basename='tipomantenimiento')

orden_trabajo_list = OrdenTrabajoViewSet.as_view({'get': 'list', 'post': 'create'})
orden_trabajo_detail = OrdenTrabajoViewSet.as_view(
    {
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    }
)

extra_patterns = [
    path('abiertas/', OrdenTrabajoViewSet.as_view({'get': 'abiertas'}), name='mantenimiento-abiertas'),
    path('<int:pk>/asignar/', OrdenTrabajoViewSet.as_view({'post': 'asignar'}), name='mantenimiento-asignar'),
    path('<int:pk>/iniciar/', OrdenTrabajoViewSet.as_view({'post': 'iniciar'}), name='mantenimiento-iniciar'),
    path('<int:pk>/pausar/', OrdenTrabajoViewSet.as_view({'post': 'pausar'}), name='mantenimiento-pausar'),
    path('<int:pk>/completar/', OrdenTrabajoViewSet.as_view({'post': 'completar'}), name='mantenimiento-completar'),
    path('<int:pk>/cerrar/', OrdenTrabajoViewSet.as_view({'post': 'cerrar'}), name='mantenimiento-cerrar'),
]

urlpatterns = [
    path('', orden_trabajo_list, name='mantenimiento-list'),
    path('<int:pk>/', orden_trabajo_detail, name='mantenimiento-detail'),
    *extra_patterns,
    path('', include(router.urls)),
]
