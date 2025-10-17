"""ViewSets de catálogos maestros."""

from django.db.models import Count, Q
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.core.permissions import IsAdmin, IsAdminOrSupervisor
from backend.produccion.models import Lote
from backend.produccion.serializers import LoteListSerializer

from .models import (
    Ubicacion,
    Maquina,
    Producto,
    Formula,
    EtapaProduccion,
    Turno,
)
from .serializers import (
    UbicacionSerializer,
    MaquinaSerializer,
    ProductoSerializer,
    FormulaSerializer,
    EtapaProduccionSerializer,
    TurnoSerializer,
)


class UbicacionViewSet(viewsets.ModelViewSet):
    """Gestión de ubicaciones con estadísticas de máquinas."""

    queryset = Ubicacion.objects.annotate(
        maquinas_count=Count('maquinas', distinct=True),
    ).order_by('codigo')
    serializer_class = UbicacionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'tipo']

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdmin]
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
            perm_classes = [IsAdmin]
        return [perm() for perm in perm_classes]

    @action(detail=True, methods=['get'])
    def lotes_recientes(self, request, pk=None):
        """Devuelve los últimos lotes asociados a la máquina."""

        maquina = self.get_object()
        lotes = (
            Lote.objects.filter(etapas__maquina=maquina)
            .distinct()
            .order_by('-fecha_creacion')[:10]
        )
        serializer = LoteListSerializer(lotes, many=True)
        return Response(serializer.data)


class ProductoViewSet(viewsets.ModelViewSet):
    """Gestión de productos con filtros por forma y estado."""

    queryset = Producto.objects.all().order_by('codigo')
    serializer_class = ProductoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'principio_activo']
    ordering_fields = ['codigo', 'nombre']

    def get_queryset(self):
        queryset = super().get_queryset()

        forma = self.request.query_params.get('forma')
        if forma:
            queryset = queryset.filter(forma_farmaceutica=forma.upper())

        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')

        return queryset

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdmin]
        return [perm() for perm in perm_classes]


class FormulaViewSet(viewsets.ModelViewSet):
    """Gestión de fórmulas por producto y vigencia."""

    queryset = Formula.objects.select_related('producto', 'aprobada_por').all()
    serializer_class = FormulaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['producto__nombre', 'version']
    ordering_fields = ['fecha_vigencia_desde']

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
            perm_classes = [IsAdmin]
        return [perm() for perm in perm_classes]


class EtapaProduccionViewSet(viewsets.ModelViewSet):
    """Gestión de etapas de producción."""

    queryset = EtapaProduccion.objects.all().order_by('codigo')
    serializer_class = EtapaProduccionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdmin]
        return [perm() for perm in perm_classes]


class TurnoViewSet(viewsets.ModelViewSet):
    """Gestión de turnos con conteo de lotes."""

    queryset = Turno.objects.annotate(
        lotes_count=Count('lotes', filter=Q(lotes__visible=True), distinct=True)
    ).order_by('codigo')
    serializer_class = TurnoSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [perm() for perm in perm_classes]