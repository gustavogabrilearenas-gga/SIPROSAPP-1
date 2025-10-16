"""Vistas del dominio de auditoría"""

from datetime import datetime

from rest_framework import filters, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .permissions import IsAdmin, IsAdminOrSupervisor
from .auditoria_models import ElectronicSignature, LogAuditoria
from .auditoria_serializers import (
    CreateSignatureSerializer,
    ElectronicSignatureSerializer,
    LogAuditoriaSerializer,
)


class LogAuditoriaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Consulta de logs de auditoría con filtros"""

    serializer_class = LogAuditoriaSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return LogAuditoria.objects.select_related('usuario').all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        modelo = request.query_params.get('modelo')
        objeto_id = request.query_params.get('objeto_id')
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        usuario_id = request.query_params.get('usuario')
        accion = request.query_params.get('accion')

        if modelo:
            queryset = queryset.filter(modelo=modelo)

        if objeto_id:
            queryset = queryset.filter(objeto_id=objeto_id)

        if desde:
            fecha_desde = datetime.strptime(desde, '%Y-%m-%d')
            queryset = queryset.filter(fecha__gte=fecha_desde)

        if hasta:
            fecha_hasta = datetime.strptime(hasta, '%Y-%m-%d')
            fecha_hasta = fecha_hasta.replace(hour=23, minute=59, second=59)
            queryset = queryset.filter(fecha__lte=fecha_hasta)

        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)

        if accion:
            queryset = queryset.filter(accion=accion.upper())

        queryset = queryset.order_by('-fecha')
        total = queryset.count()
        logs = list(queryset[:100])

        serializer = self.get_serializer(logs, many=True)
        return Response({
            'total': total,
            'filtros': {
                'modelo': modelo,
                'objeto_id': objeto_id,
                'desde': desde,
                'hasta': hasta,
                'usuario': usuario_id,
                'accion': accion,
            },
            'logs': serializer.data,
        })


class ElectronicSignatureViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Firmas Electrónicas"""

    queryset = ElectronicSignature.objects.select_related(
        'user', 'invalidated_by'
    ).all().order_by('-timestamp')
    serializer_class = ElectronicSignatureSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp']

    def get_queryset(self):
        queryset = super().get_queryset()

        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)

        object_id = self.request.query_params.get('object_id')
        if object_id:
            queryset = queryset.filter(object_id=object_id)

        is_valid = self.request.query_params.get('is_valid')
        if is_valid is not None:
            is_valid = is_valid.lower() == 'true'
            queryset = queryset.filter(is_valid=is_valid)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateSignatureSerializer
        return ElectronicSignatureSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            perm_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def invalidar(self, request, pk=None):
        """Endpoint: /api/firmas/{id}/invalidar/"""
        firma = self.get_object()

        if not firma.is_valid:
            return Response(
                {'error': 'Esta firma ya está invalidada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'error': 'Debe proporcionar un motivo de invalidación'},
                status=status.HTTP_400_BAD_REQUEST
            )

        firma.invalidate(user=request.user, reason=reason)

        serializer = ElectronicSignatureSerializer(firma)
        return Response({
            'message': 'Firma invalidada exitosamente',
            'firma': serializer.data,
        })
