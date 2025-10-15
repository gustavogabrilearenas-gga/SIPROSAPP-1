"""
Views (ViewSets) para SIPROSA MES
"""

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.http import JsonResponse
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from datetime import datetime, timedelta

from .models import (
    # Catálogos
    Ubicacion, Maquina, Producto, Formula, EtapaProduccion, Turno,
    # Mantenimiento
    OrdenTrabajo,
    # Notificaciones
    Notificacion,
)
from backend.incidencias.models import Incidente

from .serializers import (
    # Catálogos
    UbicacionSerializer, MaquinaSerializer, ProductoSerializer,
    FormulaSerializer, EtapaProduccionSerializer, TurnoSerializer,
    # Notificaciones
    NotificacionSerializer,
)

from .permissions import (
    IsAdmin, IsAdminOrSupervisor, IsAdminOrOperario
)

from backend.produccion.models import Lote, Parada
from backend.produccion.serializers import LoteListSerializer


# ============================================
# CAT�LOGOS
# ============================================

class UbicacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Ubicaciones"""
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
        return [p() for p in perm_classes]


class MaquinaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar M�quinas"""
    queryset = Maquina.objects.select_related('ubicacion').all().order_by('codigo')
    serializer_class = MaquinaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'fabricante', 'modelo']
    ordering_fields = ['codigo', 'nombre', 'tipo']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por estado activo/inactivo
        activa = self.request.query_params.get('activa', None)
        if activa is not None:
            activa = activa.lower() == 'true'
            queryset = queryset.filter(activa=activa)
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())
        
        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]
    
    @action(detail=True, methods=['get'])
    def lotes_recientes(self, request, pk=None):
        """Endpoint: /api/maquinas/{id}/lotes_recientes/"""
        maquina = self.get_object()
        lotes = Lote.objects.filter(
            etapas__maquina=maquina
        ).distinct().order_by('-fecha_creacion')[:10]
        serializer = LoteListSerializer(lotes, many=True)
        return Response(serializer.data)


class ProductoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Productos"""
    queryset = Producto.objects.all().order_by('codigo')
    serializer_class = ProductoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'principio_activo']
    ordering_fields = ['codigo', 'nombre']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por forma farmac�utica
        forma = self.request.query_params.get('forma', None)
        if forma:
            queryset = queryset.filter(forma_farmaceutica=forma.upper())
        
        # Filtro por activo
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            activo = activo.lower() == 'true'
            queryset = queryset.filter(activo=activo)
        
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class FormulaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar F�rmulas"""
    queryset = Formula.objects.select_related('producto', 'aprobada_por').all()
    serializer_class = FormulaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['producto__nombre', 'version']
    ordering_fields = ['fecha_vigencia_desde']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por producto
        producto_id = self.request.query_params.get('producto', None)
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        
        # Filtro por activa
        activa = self.request.query_params.get('activa', None)
        if activa is not None:
            activa = activa.lower() == 'true'
            queryset = queryset.filter(activa=activa)
        
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]

class EtapaProduccionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Etapas de Producci�n"""
    queryset = EtapaProduccion.objects.all().order_by('orden_tipico')
    serializer_class = EtapaProduccionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden_tipico', 'codigo']
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class TurnoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Turnos"""
    queryset = Turno.objects.annotate(
        lotes_count=Count('lotes', filter=Q(lotes__visible=True), distinct=True)
    ).order_by('codigo')
    serializer_class = TurnoSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


# ============================================
# PRODUCCI�N
# ============================================




# ============================================
# INVENTARIO
# ============================================




# ============================================
# NOTIFICACIONES
# ============================================


# ============================================
# BÚSQUEDA GLOBAL
# ============================================

from rest_framework.views import APIView

class BusquedaGlobalView(APIView):
    """
    Vista para búsqueda global en el sistema
    GET /api/buscar?q=texto&limit=20
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        limit = int(request.query_params.get('limit', 20))
        
        if len(query) < 2:
            return Response({
                'query': query,
                'resultados': [],
                'total': 0,
                'message': 'La búsqueda debe tener al menos 2 caracteres'
            })
        
        resultados = []
        
        # 1. Buscar en Lotes
        lotes = Lote.objects.filter(
            Q(codigo_lote__icontains=query) |
            Q(producto__nombre__icontains=query) |
            Q(producto__codigo__icontains=query)
        ).select_related('producto', 'supervisor')[:limit]
        
        for lote in lotes:
            resultados.append({
                'tipo': 'lote',
                'id': lote.id,
                'titulo': lote.codigo_lote,
                'subtitulo': lote.producto.nombre,
                'snippet': f"Estado: {lote.get_estado_display()} - Supervisor: {lote.supervisor.get_full_name()}",
                'url': f'/lotes/{lote.id}',
                'fecha': lote.fecha_creacion.isoformat(),
                'estado': lote.estado,
                'estado_display': lote.get_estado_display()
            })
        
        # 2. Buscar en Órdenes de Trabajo
        ots = OrdenTrabajo.objects.filter(
            Q(codigo__icontains=query) |
            Q(titulo__icontains=query) |
            Q(maquina__nombre__icontains=query) |
            Q(maquina__codigo__icontains=query)
        ).select_related('maquina', 'tipo')[:limit]
        
        for ot in ots:
            resultados.append({
                'tipo': 'orden_trabajo',
                'id': ot.id,
                'titulo': ot.codigo,
                'subtitulo': ot.titulo,
                'snippet': f"Máquina: {ot.maquina.nombre} - {ot.get_estado_display()} - {ot.get_prioridad_display()}",
                'url': f'/mantenimiento/{ot.id}',
                'fecha': ot.fecha_creacion.isoformat(),
                'estado': ot.estado,
                'estado_display': ot.get_estado_display(),
                'prioridad': ot.prioridad
            })
        
        # 3. Buscar en Incidentes
        incidentes = Incidente.objects.filter(
            Q(codigo__icontains=query) |
            Q(titulo__icontains=query) |
            Q(descripcion__icontains=query)
        ).select_related('tipo', 'ubicacion')[:limit]
        
        for incidente in incidentes:
            resultados.append({
                'tipo': 'incidente',
                'id': incidente.id,
                'titulo': incidente.codigo,
                'subtitulo': incidente.titulo,
                'snippet': f"{incidente.tipo.nombre} - {incidente.get_severidad_display()} - {incidente.ubicacion.nombre}",
                'url': f'/incidentes/{incidente.id}',
                'fecha': incidente.fecha_ocurrencia.isoformat(),
                'estado': incidente.estado,
                'estado_display': incidente.get_estado_display(),
                'severidad': incidente.severidad
            })
        
        # Ordenar por fecha (más reciente primero)
        resultados.sort(key=lambda x: x['fecha'], reverse=True)
        
        # Limitar resultados totales
        resultados = resultados[:limit]
        
        return Response({
            'query': query,
            'resultados': resultados,
            'total': len(resultados),
            'tipos': {
                'lotes': sum(1 for r in resultados if r['tipo'] == 'lote'),
                'ordenes_trabajo': sum(1 for r in resultados if r['tipo'] == 'orden_trabajo'),
                'incidentes': sum(1 for r in resultados if r['tipo'] == 'incidente')
            }
        })


# ============================================
# DESVIACIONES Y CAPA
# ============================================

# ============================================
# HOME & HEALTH CHECK
# ============================================

def home(request):
    """
    P�gina de bienvenida - redirige al panel de administraci�n
    """
    from django.shortcuts import redirect
    return redirect('/admin/')


def health_check(request):
    """Comprueba la conexión a la base de datos y responde rápidamente."""

    try:
        with connections['default'].cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except OperationalError:
        return JsonResponse({"status": "error"}, status=503)

    return JsonResponse({"status": "ok"})
