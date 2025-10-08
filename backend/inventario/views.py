"""Vistas del dominio de Inventario"""

from rest_framework import filters, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.inventario.models import (
    Insumo,
    LoteInsumo,
    MovimientoInventario,
    ProductoTerminado,
    Repuesto,
)
from backend.inventario.serializers import (
    InsumoSerializer,
    LoteInsumoSerializer,
    MovimientoInventarioSerializer,
    ProductoTerminadoSerializer,
    RepuestoSerializer,
)
from core.permissions import IsAdmin, IsAdminOrSupervisor


class InsumoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Insumos"""

    queryset = Insumo.objects.select_related('categoria').all().order_by('codigo')
    serializer_class = InsumoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']

    def get_queryset(self):
        queryset = super().get_queryset()

        categoria_id = self.request.query_params.get('categoria')
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)

        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')

        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class LoteInsumoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Lotes de Insumos"""

    queryset = LoteInsumo.objects.select_related('insumo', 'ubicacion').all().order_by(
        'fecha_vencimiento', 'fecha_recepcion'
    )
    serializer_class = LoteInsumoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['insumo__nombre', 'codigo_lote_proveedor']
    ordering_fields = ['fecha_vencimiento', 'fecha_recepcion']

    def get_queryset(self):
        queryset = super().get_queryset()

        insumo_id = self.request.query_params.get('insumo')
        if insumo_id:
            queryset = queryset.filter(insumo_id=insumo_id)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado.upper())

        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class RepuestoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Repuestos"""

    queryset = Repuesto.objects.select_related('ubicacion').all().order_by('codigo')
    serializer_class = RepuestoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'stock_actual']

    def get_queryset(self):
        queryset = super().get_queryset()

        categoria = self.request.query_params.get('categoria')
        if categoria:
            queryset = queryset.filter(categoria=categoria.upper())

        critico = self.request.query_params.get('critico')
        if critico is not None:
            queryset = queryset.filter(critico=critico.lower() == 'true')

        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class ProductoTerminadoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Productos Terminados"""

    queryset = ProductoTerminado.objects.select_related('lote', 'ubicacion').all().order_by('fecha_vencimiento')
    serializer_class = ProductoTerminadoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['lote__codigo_lote', 'lote__producto__nombre']
    ordering_fields = ['fecha_vencimiento', 'fecha_fabricacion']

    def get_queryset(self):
        queryset = super().get_queryset()

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado.upper())

        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Movimientos de Inventario"""

    queryset = MovimientoInventario.objects.select_related(
        'ubicacion_origen', 'ubicacion_destino', 'registrado_por'
    ).all().order_by('-fecha_movimiento')
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['referencia_documento', 'observaciones']
    ordering_fields = ['fecha_movimiento', 'cantidad']

    def get_queryset(self):
        queryset = super().get_queryset()

        tipo_item = self.request.query_params.get('tipo_item')
        if tipo_item:
            queryset = queryset.filter(tipo_item=tipo_item.upper())

        item_id = self.request.query_params.get('item_id')
        if item_id:
            queryset = queryset.filter(item_id=item_id)

        tipo_movimiento = self.request.query_params.get('tipo_movimiento')
        if tipo_movimiento:
            queryset = queryset.filter(tipo_movimiento=tipo_movimiento.upper())

        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdminOrSupervisor]
        return [p() for p in perm_classes]

    def perform_create(self, serializer):
        data = serializer.validated_data
        if data['tipo_movimiento'] == 'SALIDA' and data['tipo_item'] == 'INSUMO':
            self._validar_fefo(data)
        serializer.save(registrado_por=self.request.user)

    def _validar_fefo(self, data):
        """Validar que se cumpla FEFO (First Expired, First Out) para salidas de insumos."""
        if data.get('lote_item_id'):
            lote_usado = LoteInsumo.objects.filter(
                id=data['lote_item_id'],
                estado='APROBADO'
            ).first()

            if lote_usado:
                lotes_anteriores = LoteInsumo.objects.filter(
                    insumo_id=data['item_id'],
                    estado='APROBADO',
                    cantidad_actual__gt=0,
                    fecha_vencimiento__lt=lote_usado.fecha_vencimiento
                ).exists()

                if lotes_anteriores:
                    raise serializers.ValidationError({
                        'lote_item_id': 'FEFO violado: existen lotes con vencimiento anterior que deben usarse primero'
                    })

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Devuelve un resumen general de movimientos por tipo de ítem."""
        tipo_item = request.query_params.get('tipo_item', 'INSUMO')
        movimientos = MovimientoInventario.objects.filter(tipo_item=tipo_item)
        return Response({
            'tipo_item': tipo_item,
            'total_movimientos': movimientos.count(),
            'message': 'Endpoint en desarrollo - usar modelos específicos (Insumo, Repuesto) para stock actual'
        })
