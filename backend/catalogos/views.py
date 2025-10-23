"""ViewSets de catálogos maestros."""

from django.db.models import Count
from rest_framework import filters, permissions, viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from backend.core.permissions import (
    IsAdmin,
    IsAdminOrSupervisor,
    IsSuperuser,
)

from .models import (
    Ubicacion,
    Maquina,
    MaquinaAttachment,
    Producto,
    Formula,
    EtapaProduccion,
    Turno,
    Funcion,
    Parametro,
)
from .serializers import (
    UbicacionSerializer,
    MaquinaSerializer,
    MaquinaAttachmentSerializer,
    ProductoSerializer,
    FormulaSerializer,
    EtapaProduccionSerializer,
    TurnoSerializer,
    FuncionSerializer,
    ParametroSerializer,
)


class ParametroViewSet(viewsets.ModelViewSet):
    queryset = Parametro.objects.all()
    serializer_class = ParametroSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["codigo", "nombre", "unidad"]
    ordering_fields = ["nombre", "codigo", "unidad"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAdmin()]
        return super().get_permissions()


class UbicacionViewSet(viewsets.ModelViewSet):
    """Gestión de ubicaciones con estadísticas de máquinas."""

    queryset = Ubicacion.objects.annotate(
        maquinas_count=Count('maquinas', distinct=True),
    ).order_by('codigo')
    serializer_class = UbicacionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsSuperuser]
        return [perm() for perm in perm_classes]


class MaquinaViewSet(viewsets.ModelViewSet):
    """Gestión de máquinas con filtros avanzados."""

    queryset = Maquina.objects.select_related('ubicacion').all().order_by('codigo')
    serializer_class = MaquinaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'fabricante', 'modelo']
    ordering_fields = ['codigo', 'nombre', 'tipo']

    def get_queryset(self):
        queryset = super().get_queryset()

        activa = self.request.query_params.get('activa')
        if activa is not None:
            queryset = queryset.filter(activa=activa.lower() == 'true')

        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())

        return queryset

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsSuperuser]
        return [perm() for perm in perm_classes]


class MaquinaAttachmentViewSet(viewsets.ModelViewSet):
    queryset = MaquinaAttachment.objects.all()
    serializer_class = MaquinaAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        request = getattr(self, "request", None)
        user = request.user if request and request.user.is_authenticated else None
        file_obj = request.FILES.get("archivo") if request else None
        content_type = getattr(file_obj, "content_type", "") if file_obj else ""
        size = getattr(file_obj, "size", None) if file_obj else None
        serializer.save(subido_por=user, content_type=content_type, tamano_bytes=size)


class ProductoViewSet(viewsets.ModelViewSet):
    """Gestión de productos con filtros por tipo, presentación y estado."""

    queryset = Producto.objects.all().order_by('codigo')
    serializer_class = ProductoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'tipo', 'presentacion']

    def get_queryset(self):
        queryset = super().get_queryset()

        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())

        presentacion = self.request.query_params.get('presentacion')
        if presentacion:
            queryset = queryset.filter(presentacion=presentacion.upper())

        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')

        return queryset

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsSuperuser]
        return [perm() for perm in perm_classes]


class FormulaViewSet(viewsets.ModelViewSet):
    """Gestión de fórmulas por producto y vigencia."""

    queryset = (
        Formula.objects.select_related('producto')
        .prefetch_related('ingredientes__material', 'relaciones_etapas__etapa')
        .all()
    )
    serializer_class = FormulaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['producto__nombre', 'codigo', 'version']
    ordering_fields = ['codigo', 'version', 'activa']

    def get_queryset(self):
        queryset = super().get_queryset()

        producto_id = self.request.query_params.get('producto')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)

        activa = self.request.query_params.get('activa')
        if activa is not None:
            queryset = queryset.filter(activa=activa.lower() == 'true')

        return queryset

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsSuperuser]
        return [perm() for perm in perm_classes]


class EtapaProduccionViewSet(viewsets.ModelViewSet):
    """Gestión de etapas de producción."""

    queryset = (
        EtapaProduccion.objects.prefetch_related('maquinas_permitidas', 'parametros')
        .all()
        .order_by('codigo')
    )
    serializer_class = EtapaProduccionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsSuperuser]
        return [perm() for perm in perm_classes]


class TurnoViewSet(viewsets.ModelViewSet):
    """Gestión de turnos."""

    queryset = Turno.objects.all().order_by('codigo')
    serializer_class = TurnoSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsSuperuser]
        return [perm() for perm in perm_classes]


class FuncionViewSet(viewsets.ModelViewSet):
    queryset = Funcion.objects.all()
    serializer_class = FuncionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["codigo", "nombre"]
    ordering_fields = ["nombre", "codigo"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAdmin()]
        return super().get_permissions()