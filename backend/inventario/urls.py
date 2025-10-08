"""URLConf del dominio de inventario."""

from rest_framework.routers import DefaultRouter

from backend.inventario.views import (
    InsumoViewSet,
    LoteInsumoViewSet,
    MovimientoInventarioViewSet,
    ProductoTerminadoViewSet,
    RepuestoViewSet,
)

router = DefaultRouter()
router.register(r'insumos', InsumoViewSet)
router.register(r'lotes-insumo', LoteInsumoViewSet)
router.register(r'repuestos', RepuestoViewSet)
router.register(r'productos-terminados', ProductoTerminadoViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet)
router.register(r'', MovimientoInventarioViewSet, basename='inventario')

urlpatterns = router.urls
