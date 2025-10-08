from django.urls import include, path
from rest_framework import routers

from .views import (
    AccionCorrectivaViewSet,
    DesviacionViewSet,
    DocumentoVersionadoViewSet,
)

router = routers.DefaultRouter()
router.register(r'desviaciones', DesviacionViewSet, basename='desviacion')
router.register(r'acciones-correctivas', AccionCorrectivaViewSet, basename='accioncorrectiva')
router.register(r'documentos', DocumentoVersionadoViewSet, basename='documentoversionado')

urlpatterns = [
    path('', include(router.urls)),
]
