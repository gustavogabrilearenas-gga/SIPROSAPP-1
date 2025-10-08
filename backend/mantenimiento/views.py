"""Vistas del dominio de Mantenimiento."""

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.mantenimiento.models import OrdenTrabajo, TipoMantenimiento
from backend.mantenimiento.serializers import (
    OrdenTrabajoListSerializer,
    OrdenTrabajoSerializer,
    TipoMantenimientoSerializer,
)
from core.permissions import IsAdmin, IsAdminOrSupervisor


class TipoMantenimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Tipos de Mantenimiento."""

    queryset = TipoMantenimiento.objects.all().order_by('codigo')
    serializer_class = TipoMantenimientoSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [perm() for perm in perm_classes]


class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Órdenes de Trabajo."""

    queryset = OrdenTrabajo.objects.select_related(
        'tipo',
        'maquina',
        'creada_por',
        'asignada_a',
    ).all().order_by('-fecha_creacion')
    serializer_class = OrdenTrabajoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'titulo', 'maquina__nombre']
    ordering_fields = ['fecha_creacion', 'fecha_planificada', 'prioridad']

    def get_queryset(self):
        queryset = super().get_queryset()

        maquina_id = self.request.query_params.get('maquina')
        if maquina_id:
            queryset = queryset.filter(maquina_id=maquina_id)

        tipo_id = self.request.query_params.get('tipo')
        if tipo_id:
            queryset = queryset.filter(tipo_id=tipo_id)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado.upper())

        prioridad = self.request.query_params.get('prioridad')
        if prioridad:
            queryset = queryset.filter(prioridad=prioridad.upper())

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return OrdenTrabajoListSerializer
        return OrdenTrabajoSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [perm() for perm in perm_classes]

    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)

    @action(detail=False, methods=['get'])
    def abiertas(self, request):
        """Endpoint: /api/mantenimiento/ordenes-trabajo/abiertas/"""
        ordenes = self.get_queryset().exclude(estado__in=['COMPLETADA', 'CANCELADA'])
        serializer = self.get_serializer(ordenes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def asignar(self, request, pk=None):
        """Endpoint: /api/mantenimiento/ordenes-trabajo/{id}/asignar/"""
        ot = self.get_object()

        if ot.estado not in ['ABIERTA', 'ASIGNADA']:
            return Response(
                {'error': f'No se puede asignar una OT en estado {ot.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tecnico_id = request.data.get('tecnico_id')
        if not tecnico_id:
            return Response(
                {'error': 'Debe proporcionar el ID del técnico (tecnico_id)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            tecnico = User.objects.get(id=tecnico_id)
        except User.DoesNotExist:
            return Response(
                {'error': f'Usuario con ID {tecnico_id} no existe'},
                status=status.HTTP_404_NOT_FOUND,
            )

        ot.asignada_a = tecnico
        ot.estado = 'ASIGNADA'
        ot.save()

        serializer = self.get_serializer(ot)
        return Response({
            'message': f'OT asignada a {tecnico.get_full_name()}',
            'orden_trabajo': serializer.data,
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def iniciar(self, request, pk=None):
        """Endpoint: /api/mantenimiento/ordenes-trabajo/{id}/iniciar/"""
        ot = self.get_object()

        if ot.asignada_a and ot.asignada_a != request.user and not request.user.is_superuser:
            return Response(
                {'error': 'Solo el técnico asignado puede iniciar esta OT'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if ot.estado not in ['ASIGNADA', 'PAUSADA']:
            return Response(
                {'error': f'No se puede iniciar una OT en estado {ot.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ot.estado = 'EN_PROCESO'
        if not ot.fecha_inicio:
            ot.fecha_inicio = timezone.now()
        ot.save()

        serializer = self.get_serializer(ot)
        return Response({
            'message': 'OT iniciada exitosamente',
            'orden_trabajo': serializer.data,
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def pausar(self, request, pk=None):
        """Endpoint: /api/mantenimiento/ordenes-trabajo/{id}/pausar/"""
        ot = self.get_object()

        if ot.estado != 'EN_PROCESO':
            return Response(
                {'error': 'Solo se pueden pausar OT en proceso'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        motivo = request.data.get('motivo', '')
        if not motivo:
            return Response(
                {'error': 'Debe proporcionar un motivo de pausa'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ot.estado = 'PAUSADA'
        ot.observaciones = f"{ot.observaciones}\n\nPAUSADA: {motivo} ({timezone.now()})".strip()
        ot.save()

        serializer = self.get_serializer(ot)
        return Response({
            'message': 'OT pausada exitosamente',
            'orden_trabajo': serializer.data,
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def completar(self, request, pk=None):
        """Endpoint: /api/mantenimiento/ordenes-trabajo/{id}/completar/"""
        ot = self.get_object()

        if ot.estado not in ['EN_PROCESO', 'PAUSADA']:
            return Response(
                {'error': f'No se puede completar una OT en estado {ot.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trabajo_realizado = request.data.get('trabajo_realizado', '').strip()
        if not trabajo_realizado:
            return Response(
                {'error': 'Debe detallar el trabajo realizado'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ot.estado = 'COMPLETADA'
        ot.fecha_fin = timezone.now()
        ot.completada_por = request.user
        ot.trabajo_realizado = trabajo_realizado
        ot.observaciones = request.data.get('observaciones', ot.observaciones)
        ot.costo_real = request.data.get('costo_real', ot.costo_real)
        ot.save()

        serializer = self.get_serializer(ot)
        return Response({
            'message': 'OT completada exitosamente',
            'orden_trabajo': serializer.data,
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancelar(self, request, pk=None):
        """Endpoint: /api/mantenimiento/ordenes-trabajo/{id}/cancelar/"""
        ot = self.get_object()

        if ot.estado in ['COMPLETADA', 'CANCELADA']:
            return Response(
                {'error': 'No se puede cancelar una OT ya finalizada'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        motivo = request.data.get('motivo', '').strip()
        if not motivo:
            return Response(
                {'error': 'Debe indicar un motivo de cancelación'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ot.estado = 'CANCELADA'
        ot.observaciones = f"{ot.observaciones}\n\nCANCELADA: {motivo} ({timezone.now()})".strip()
        ot.save()

        serializer = self.get_serializer(ot)
        return Response({
            'message': 'OT cancelada exitosamente',
            'orden_trabajo': serializer.data,
        })
