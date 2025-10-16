"""Vistas para el módulo de eventos."""

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import (
    RegistroProduccion,
    RegistroMantenimiento,
    RegistroIncidente,
    ObservacionGeneral
)
from .serializers import (
    RegistroProduccionSerializer,
    RegistroMantenimientoSerializer,
    RegistroIncidenteSerializer,
    ObservacionGeneralSerializer
)
from core.permissions import IsAdminOrOperario


class RegistroProduccionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar registros de producción."""
    queryset = RegistroProduccion.objects.select_related(
        'registrado_por',
        'maquina',
        'producto'
    ).all().order_by('-fecha_produccion')
    serializer_class = RegistroProduccionSerializer
    permission_classes = [IsAdminOrOperario]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['maquina__codigo', 'producto__nombre', 'registrado_por__username']
    ordering_fields = ['fecha_produccion', 'fecha_registro', 'maquina', 'producto']

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)


class RegistroMantenimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar registros de mantenimiento."""
    queryset = RegistroMantenimiento.objects.select_related(
        'registrado_por',
        'maquina'
    ).all().order_by('-fecha_mantenimiento')
    serializer_class = RegistroMantenimientoSerializer
    permission_classes = [IsAdminOrOperario]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['maquina__codigo', 'descripcion', 'registrado_por__username']
    ordering_fields = ['fecha_mantenimiento', 'fecha_registro', 'maquina', 'tipo_mantenimiento']

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)


class RegistroIncidenteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar registros de incidentes."""
    queryset = RegistroIncidente.objects.select_related(
        'registrado_por',
        'maquina'
    ).all().order_by('-fecha_incidente')
    serializer_class = RegistroIncidenteSerializer
    permission_classes = [IsAdminOrOperario]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['maquina__codigo', 'descripcion', 'registrado_por__username']
    ordering_fields = ['fecha_incidente', 'fecha_registro', 'maquina', 'contexto_origen']

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)


class ObservacionGeneralViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar observaciones generales."""
    queryset = ObservacionGeneral.objects.select_related(
        'registrado_por'
    ).all().order_by('-fecha_observacion')
    serializer_class = ObservacionGeneralSerializer
    permission_classes = [IsAdminOrOperario]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['observaciones', 'registrado_por__username']
    ordering_fields = ['fecha_observacion', 'fecha_registro']

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)