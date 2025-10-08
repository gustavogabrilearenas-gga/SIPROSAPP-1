"""ViewSets para el dominio de Calidad"""

from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsAdmin, IsAdminOrSupervisor

from .models import AccionCorrectiva, Desviacion, DocumentoVersionado
from .serializers import (
    AccionCorrectivaSerializer,
    DesviacionSerializer,
    DocumentoVersionadoSerializer,
)


class DesviacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Desviaciones"""

    queryset = Desviacion.objects.select_related(
        'lote', 'lote_etapa', 'detectado_por', 'cerrado_por'
    ).all().order_by('-fecha_deteccion')
    serializer_class = DesviacionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'titulo', 'descripcion']
    ordering_fields = ['fecha_deteccion', 'severidad']

    def get_queryset(self):
        queryset = super().get_queryset()

        severidad = self.request.query_params.get('severidad', None)
        if severidad:
            queryset = queryset.filter(severidad=severidad.upper())

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())

        lote_id = self.request.query_params.get('lote', None)
        if lote_id:
            queryset = queryset.filter(lote_id=lote_id)

        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdminOrSupervisor]
        return [p() for p in perm_classes]

    def perform_create(self, serializer):
        serializer.save(detectado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def abiertas(self, request):
        """Endpoint: /api/calidad/desviaciones/abiertas/"""

        desviaciones = self.get_queryset().exclude(estado='CERRADA')
        serializer = self.get_serializer(desviaciones, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def cerrar(self, request, pk=None):
        """Endpoint: /api/calidad/desviaciones/{id}/cerrar/"""

        desviacion = self.get_object()

        if desviacion.estado == 'CERRADA':
            return Response(
                {'error': 'Esta desviación ya está cerrada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        desviacion.estado = 'CERRADA'
        desviacion.fecha_cierre = timezone.now()
        desviacion.cerrado_por = request.user
        desviacion.save()

        serializer = self.get_serializer(desviacion)
        return Response({
            'message': 'Desviación cerrada exitosamente',
            'desviacion': serializer.data
        })


class AccionCorrectivaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Acciones Correctivas (CAPA)"""

    queryset = AccionCorrectiva.objects.select_related(
        'incidente', 'responsable', 'verificado_por'
    ).all().order_by('-fecha_planificada')
    serializer_class = AccionCorrectivaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['descripcion', 'incidente__codigo']
    ordering_fields = ['fecha_planificada', 'fecha_implementacion']

    def get_queryset(self):
        queryset = super().get_queryset()

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())

        incidente_id = self.request.query_params.get('incidente', None)
        if incidente_id:
            queryset = queryset.filter(incidente_id=incidente_id)

        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdminOrSupervisor]
        return [p() for p in perm_classes]

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Endpoint: /api/calidad/acciones-correctivas/pendientes/"""

        acciones = self.get_queryset().exclude(estado__in=['COMPLETADA', 'CANCELADA'])
        serializer = self.get_serializer(acciones, many=True)
        return Response(serializer.data)


class DocumentoVersionadoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Documentos Versionados"""

    queryset = DocumentoVersionado.objects.select_related(
        'creado_por', 'revisado_por', 'aprobado_por', 'documento_anterior'
    ).all().order_by('-fecha_creacion')
    serializer_class = DocumentoVersionadoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'titulo', 'contenido']
    ordering_fields = ['fecha_creacion', 'fecha_vigencia_inicio']

    def get_queryset(self):
        queryset = super().get_queryset()

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())

        vigentes = self.request.query_params.get('vigentes', None)
        if vigentes and vigentes.lower() == 'true':
            queryset = queryset.filter(estado='VIGENTE')

        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def aprobar(self, request, pk=None):
        """Endpoint: /api/calidad/documentos/{id}/aprobar/"""

        documento = self.get_object()

        if documento.estado not in ['BORRADOR', 'EN_REVISION']:
            return Response(
                {'error': f'No se puede aprobar un documento en estado {documento.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        documento.estado = 'APROBADO'
        documento.fecha_aprobacion = timezone.now()
        documento.aprobado_por = request.user
        documento.save()

        serializer = self.get_serializer(documento)
        return Response({
            'message': 'Documento aprobado correctamente',
            'documento': serializer.data
        })
