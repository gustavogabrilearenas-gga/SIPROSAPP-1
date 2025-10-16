"""
Views para los modelos de catálogos
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Ubicacion, Maquina, Producto, Formula, EtapaProduccion, Turno
from .serializers import (
    UbicacionSerializer,
    MaquinaSerializer,
    ProductoSerializer,
    FormulaSerializer,
    EtapaProduccionSerializer,
    TurnoSerializer,
)


class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activa', 'planta']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']


class MaquinaViewSet(viewsets.ModelViewSet):
    queryset = Maquina.objects.all()
    serializer_class = MaquinaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activa', 'tipo', 'ubicacion', 'requiere_calificacion']
    search_fields = ['codigo', 'nombre', 'fabricante', 'modelo']
    ordering_fields = ['codigo', 'nombre']


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activo', 'tipo', 'presentacion']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']


class FormulaViewSet(viewsets.ModelViewSet):
    queryset = Formula.objects.all()
    serializer_class = FormulaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activa', 'aprobada', 'producto']
    search_fields = ['codigo', 'producto__nombre']
    ordering_fields = ['codigo', 'version']


class EtapaProduccionViewSet(viewsets.ModelViewSet):
    queryset = EtapaProduccion.objects.all()
    serializer_class = EtapaProduccionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activa', 'requiere_validacion']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']


class TurnoViewSet(viewsets.ModelViewSet):
    queryset = Turno.objects.all()
    serializer_class = TurnoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activo']
    search_fields = ['nombre']
    ordering_fields = ['codigo']