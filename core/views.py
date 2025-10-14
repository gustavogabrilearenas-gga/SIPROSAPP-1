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

class NotificacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Notificaciones"""
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['fecha_creacion']
    
    def get_queryset(self):
        """Solo devolver notificaciones del usuario actual"""
        queryset = Notificacion.objects.filter(usuario=self.request.user).order_by('-fecha_creacion')
        
        # Filtro por leída/no leída
        leida = self.request.query_params.get('leida', None)
        if leida is not None:
            leida = leida.lower() == 'true'
            queryset = queryset.filter(leida=leida)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        """Endpoint: /api/notificaciones/{id}/marcar_leida/"""
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.fecha_lectura = timezone.now()
        notificacion.save()
        
        serializer = self.get_serializer(notificacion)
        return Response({
            'message': 'Notificación marcada como leída',
            'notificacion': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        """Endpoint: /api/notificaciones/marcar_todas_leidas/"""
        notificaciones = self.get_queryset().filter(leida=False)
        count = notificaciones.update(leida=True, fecha_lectura=timezone.now())
        
        return Response({
            'message': f'{count} notificaciones marcadas como leídas',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        """Endpoint: /api/notificaciones/no_leidas/ - Contador de no leídas"""
        count = self.get_queryset().filter(leida=False).count()
        return Response({'count': count})


# ============================================
# KPIs Y DASHBOARD
# ============================================

from rest_framework.views import APIView
from django.db.models import Avg, F, ExpressionWrapper, fields as django_fields
from django.http import HttpResponse
import csv

class KpiOEEView(APIView):
    """
    Vista para calcular OEE (Overall Equipment Effectiveness)
    GET /api/kpis/oee/?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&turno=M
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Parámetros
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        turno = request.query_params.get('turno')
        
        # Por defecto, últimos 7 días
        if not desde:
            desde = (timezone.now() - timedelta(days=7)).date()
        else:
            desde = datetime.strptime(desde, '%Y-%m-%d').date()
        
        if not hasta:
            hasta = timezone.now().date()
        else:
            hasta = datetime.strptime(hasta, '%Y-%m-%d').date()
        
        # Filtrar lotes en el rango
        lotes = Lote.objects.filter(
            fecha_real_inicio__date__gte=desde,
            fecha_real_inicio__date__lte=hasta,
            estado__in=['FINALIZADO', 'LIBERADO']
        )
        
        if turno:
            lotes = lotes.filter(turno__codigo=turno)
        
        # Calcular métricas
        total_lotes = lotes.count()
        
        if total_lotes == 0:
            return Response({
                'desde': desde,
                'hasta': hasta,
                'turno': turno,
                'total_lotes': 0,
                'oee': 0,
                'disponibilidad': 0,
                'rendimiento': 0,
                'calidad': 0,
                'message': 'No hay lotes finalizados en el período seleccionado'
            })
        
        # 1. DISPONIBILIDAD: Tiempo operativo / Tiempo planificado
        # Calcular tiempo planificado y tiempo real
        tiempo_planificado_total = 0
        tiempo_real_total = 0
        tiempo_paradas_total = 0
        
        for lote in lotes:
            if lote.fecha_planificada_inicio and lote.fecha_planificada_fin:
                tiempo_planificado = (lote.fecha_planificada_fin - lote.fecha_planificada_inicio).total_seconds() / 3600
                tiempo_planificado_total += tiempo_planificado
            
            if lote.fecha_real_inicio and lote.fecha_real_fin:
                tiempo_real = (lote.fecha_real_fin - lote.fecha_real_inicio).total_seconds() / 3600
                tiempo_real_total += tiempo_real
            
            # Sumar tiempo de paradas de todas las etapas del lote
            paradas = Parada.objects.filter(
                lote_etapa__lote=lote,
                fecha_fin__isnull=False
            )
            for parada in paradas:
                if parada.duracion_minutos:
                    tiempo_paradas_total += parada.duracion_minutos / 60
        
        tiempo_operativo = tiempo_real_total - tiempo_paradas_total
        disponibilidad = (tiempo_operativo / tiempo_planificado_total * 100) if tiempo_planificado_total > 0 else 0
        
        # 2. RENDIMIENTO: Cantidad producida / Cantidad planificada
        cantidad_planificada_total = lotes.aggregate(Sum('cantidad_planificada'))['cantidad_planificada__sum'] or 0
        cantidad_producida_total = lotes.aggregate(Sum('cantidad_producida'))['cantidad_producida__sum'] or 0
        rendimiento = (cantidad_producida_total / cantidad_planificada_total * 100) if cantidad_planificada_total > 0 else 0
        
        # 3. CALIDAD: Buenos / Total producido
        cantidad_rechazada_total = lotes.aggregate(Sum('cantidad_rechazada'))['cantidad_rechazada__sum'] or 0
        cantidad_buena = cantidad_producida_total - cantidad_rechazada_total
        calidad = (cantidad_buena / cantidad_producida_total * 100) if cantidad_producida_total > 0 else 0
        
        # OEE = Disponibilidad × Rendimiento × Calidad
        oee = (disponibilidad / 100) * (rendimiento / 100) * (calidad / 100) * 100
        
        # Datos para series de tiempo (opcional, por día)
        series = []
        current_date = desde
        while current_date <= hasta:
            lotes_dia = lotes.filter(fecha_real_inicio__date=current_date)
            if lotes_dia.exists():
                series.append({
                    'fecha': current_date.isoformat(),
                    'lotes': lotes_dia.count(),
                    'cantidad_producida': lotes_dia.aggregate(Sum('cantidad_producida'))['cantidad_producida__sum'] or 0
                })
            current_date += timedelta(days=1)
        
        return Response({
            'desde': desde,
            'hasta': hasta,
            'turno': turno,
            'total_lotes': total_lotes,
            'oee': round(oee, 2),
            'disponibilidad': round(disponibilidad, 2),
            'rendimiento': round(rendimiento, 2),
            'calidad': round(calidad, 2),
            'metricas': {
                'tiempo_planificado_horas': round(tiempo_planificado_total, 2),
                'tiempo_real_horas': round(tiempo_real_total, 2),
                'tiempo_paradas_horas': round(tiempo_paradas_total, 2),
                'tiempo_operativo_horas': round(tiempo_operativo, 2),
                'cantidad_planificada': cantidad_planificada_total,
                'cantidad_producida': cantidad_producida_total,
                'cantidad_rechazada': cantidad_rechazada_total,
                'cantidad_buena': cantidad_buena
            },
            'series': series
        })


class KpiDashboardView(APIView):
    """
    Vista para resumen del dashboard
    GET /api/kpis/resumen_dashboard/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Calcular métricas del dashboard
        hoy = timezone.now().date()
        
        # Lotes activos
        lotes_activos = Lote.objects.filter(
            estado__in=['EN_PROCESO', 'PAUSADO']
        ).count()
        
        # Lotes de hoy
        lotes_hoy = Lote.objects.filter(
            fecha_real_inicio__date=hoy
        ).count()
        
        # Incidentes abiertos
        incidentes_abiertos = Incidente.objects.exclude(
            estado='CERRADO'
        ).count()
        
        # Incidentes críticos
        incidentes_criticos = Incidente.objects.filter(
            severidad='CRITICA',
            estado__in=['ABIERTO', 'EN_INVESTIGACION']
        ).count()
        
        # OT abiertas
        ot_abiertas = OrdenTrabajo.objects.exclude(
            estado__in=['COMPLETADA', 'CANCELADA']
        ).count()
        
        # OT urgentes
        ot_urgentes = OrdenTrabajo.objects.filter(
            prioridad='URGENTE',
            estado__in=['ABIERTA', 'ASIGNADA', 'EN_PROCESO']
        ).count()
        
        # OEE de los últimos 7 días (llamar a la función de OEE)
        desde = hoy - timedelta(days=7)
        lotes_semana = Lote.objects.filter(
            fecha_real_inicio__date__gte=desde,
            estado__in=['FINALIZADO', 'LIBERADO']
        )
        
        if lotes_semana.exists():
            cantidad_planificada = lotes_semana.aggregate(Sum('cantidad_planificada'))['cantidad_planificada__sum'] or 0
            cantidad_producida = lotes_semana.aggregate(Sum('cantidad_producida'))['cantidad_producida__sum'] or 0
            cantidad_rechazada = lotes_semana.aggregate(Sum('cantidad_rechazada'))['cantidad_rechazada__sum'] or 0
            
            rendimiento_semana = (cantidad_producida / cantidad_planificada * 100) if cantidad_planificada > 0 else 0
            calidad_semana = ((cantidad_producida - cantidad_rechazada) / cantidad_producida * 100) if cantidad_producida > 0 else 0
            
            # Disponibilidad simplificada (sin paradas detalladas)
            disponibilidad_semana = 85.0  # Valor por defecto si no calculamos con paradas
            
            oee_semana = (disponibilidad_semana / 100) * (rendimiento_semana / 100) * (calidad_semana / 100) * 100
        else:
            oee_semana = 0
            disponibilidad_semana = 0
            rendimiento_semana = 0
            calidad_semana = 0
        
        return Response({
            'fecha': hoy,
            'lotes': {
                'activos': lotes_activos,
                'hoy': lotes_hoy,
                'total': Lote.objects.count()
            },
            'incidentes': {
                'abiertos': incidentes_abiertos,
                'criticos': incidentes_criticos,
                'total': Incidente.objects.count()
            },
            'ordenes_trabajo': {
                'abiertas': ot_abiertas,
                'urgentes': ot_urgentes,
                'total': OrdenTrabajo.objects.count()
            },
            'oee_7_dias': {
                'oee': round(oee_semana, 2),
                'disponibilidad': round(disponibilidad_semana, 2),
                'rendimiento': round(rendimiento_semana, 2),
                'calidad': round(calidad_semana, 2)
            }
        })


class KpiExportCSVView(APIView):
    """
    Vista para exportar KPIs en CSV
    GET /api/kpis/export.csv?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Obtener datos de OEE
        kpi_view = KpiOEEView()
        kpi_view.request = request
        response_data = kpi_view.get(request).data
        
        # Crear respuesta CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="kpis_oee_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        
        # Encabezados
        writer.writerow(['Métrica', 'Valor', 'Unidad'])
        writer.writerow(['Período', f"{response_data['desde']} a {response_data['hasta']}", ''])
        writer.writerow([])
        writer.writerow(['OEE', response_data['oee'], '%'])
        writer.writerow(['Disponibilidad', response_data['disponibilidad'], '%'])
        writer.writerow(['Rendimiento', response_data['rendimiento'], '%'])
        writer.writerow(['Calidad', response_data['calidad'], '%'])
        writer.writerow([])
        writer.writerow(['Total Lotes', response_data['total_lotes'], 'unidades'])
        
        # Métricas detalladas
        writer.writerow([])
        writer.writerow(['Métricas Detalladas', '', ''])
        metricas = response_data['metricas']
        for key, value in metricas.items():
            writer.writerow([key.replace('_', ' ').title(), value, ''])
        
        # Series de tiempo
        if response_data.get('series'):
            writer.writerow([])
            writer.writerow(['Series de Tiempo', '', ''])
            writer.writerow(['Fecha', 'Lotes', 'Cantidad Producida'])
            for item in response_data['series']:
                writer.writerow([item['fecha'], item['lotes'], item['cantidad_producida']])
        
        return response


# ============================================
# BÚSQUEDA GLOBAL
# ============================================

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
