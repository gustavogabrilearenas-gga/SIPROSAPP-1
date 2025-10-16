"""Vistas del dominio de Producción"""

from django.db.models import Count
from django.utils import timezone
from django.utils.dateparse import parse_datetime
import logging

logger = logging.getLogger(__name__)
from django.utils.dateparse import parse_datetime
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.produccion.models import Lote, LoteEtapa
from backend.produccion.serializers import (
    LoteEtapaSerializer,
    LoteListSerializer,
    LoteSerializer,
)

from backend.auditoria.models import ElectronicSignature, LogAuditoria
from backend.auditoria.serializers import ElectronicSignatureSerializer
from core.permissions import IsAdmin, IsAdminOrOperario, IsAdminOrSupervisor


class LoteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Lotes de Producción"""
    queryset = Lote.objects.select_related(
        'producto', 'formula', 'turno', 'supervisor', 'creado_por'
    ).all().order_by('-fecha_creacion')
    serializer_class = LoteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo_lote', 'producto__nombre']
    ordering_fields = ['fecha_creacion', 'fecha_planificada_inicio', 'codigo_lote']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Por defecto, solo mostrar lotes visibles (a menos que sea admin y pida ver todos)
        mostrar_ocultos = self.request.query_params.get('mostrar_ocultos', 'false')
        if mostrar_ocultos.lower() != 'true' or not self.request.user.is_superuser:
            queryset = queryset.filter(visible=True)
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        
        # Filtro por producto
        producto_id = self.request.query_params.get('producto', None)
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        
        # Filtro por turno
        turno_id = self.request.query_params.get('turno', None)
        if turno_id:
            queryset = queryset.filter(turno_id=turno_id)
        
        # Filtro por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        
        if fecha_desde:
            queryset = queryset.filter(fecha_real_inicio__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_real_inicio__lte=fecha_hasta)
        
        # Filtro por en proceso
        en_proceso = self.request.query_params.get('en_proceso', None)
        if en_proceso is not None:
            if en_proceso.lower() == 'true':
                queryset = queryset.filter(estado='EN_PROCESO')
        
        return queryset
    
    def get_object(self):
        """
        Permite a los superadmins acceder a lotes ocultos
        """
        # Si es superuser, puede acceder a cualquier lote (incluyendo ocultos)
        if self.request.user.is_superuser:
            queryset = Lote.objects.select_related(
                'producto', 'formula', 'turno', 'supervisor', 'creado_por'
            ).all()
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_value = self.kwargs[lookup_url_kwarg]
            filter_kwargs = {self.lookup_field: lookup_value}
            obj = queryset.get(**filter_kwargs)
            self.check_object_permissions(self.request, obj)
            return obj
        else:
            # Para usuarios normales, usar el queryset filtrado normal
            return super().get_object()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LoteListSerializer
        return LoteSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            # Ver lotes: Admin, Supervisor o Operario
            perm_classes = [permissions.IsAuthenticated]
        elif self.request.method == 'POST':
            # Crear lote: Admin, Supervisor o Operario
            perm_classes = [IsAdminOrSupervisor]
        elif self.request.method in ['PUT', 'PATCH']:
            # Editar lote: Admin, Supervisor o Operario (para cambiar estados, etc.)
            perm_classes = [IsAdminOrSupervisor]
        else:
            # Eliminar: Solo Admin (por seguridad)
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]
    
    def perform_create(self, serializer):
        instance = serializer.save(creado_por=self.request.user)
        # Adjuntar usuario e IP para auditoria
        instance._usuario_actual = self.request.user
        instance._ip_address = self.get_client_ip(self.request)
        instance._user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        instance.save()
    
    def perform_update(self, serializer):
        instance = serializer.instance
        # Adjuntar usuario e IP para auditoria antes de guardar
        instance._usuario_actual = self.request.user
        instance._ip_address = self.get_client_ip(self.request)
        instance._user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        serializer.save()
        # El save() se ejecuta dentro del serializer, las senales detectar�n los cambios
    
    def get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrOperario])
    def iniciar(self, request, pk=None):
        """
        Endpoint: /api/produccion/lotes/{id}/iniciar/
        Inicia un lote (cambia estado a EN_PROCESO)
        """
        lote = self.get_object()

        # Validar que solo se puedan iniciar lotes PLANIFICADOS o PAUSADOS
        if lote.estado not in ['PLANIFICADO', 'PAUSADO']:
            return Response(
                {
                    'error': 'Solo se pueden iniciar lotes en estado PLANIFICADO o PAUSADO',
                    'estado_actual': lote.estado
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Iniciar el lote
        lote.estado = 'EN_PROCESO'
        lote.fecha_real_inicio = timezone.now()

        # Adjuntar información para auditoria
        lote._usuario_actual = request.user
        lote._ip_address = self.get_client_ip(request)
        lote._user_agent = request.META.get('HTTP_USER_AGENT', '')

        lote.save()

        serializer = self.get_serializer(lote)
        return Response({
            'message': 'Lote iniciado exitosamente',
            'lote': serializer.data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrOperario])
    def completar(self, request, pk=None):
        """
        Endpoint: /api/produccion/lotes/{id}/completar/
        Completa un lote (cambia estado a FINALIZADO)
        """
        lote = self.get_object()

        # Validar que solo se puedan completar lotes EN_PROCESO
        if lote.estado != 'EN_PROCESO':
            mensaje_error = ''
            if lote.estado == 'PAUSADO':
                mensaje_error = 'Para completar un lote pausado, primero debe reanudarlo usando el botón "Iniciar"'
            elif lote.estado == 'PLANIFICADO':
                mensaje_error = 'El lote aún no ha sido iniciado. Use el botón "Iniciar" para comenzar la producción'
            elif lote.estado == 'FINALIZADO':
                mensaje_error = 'Este lote ya fue completado'
            elif lote.estado == 'CANCELADO':
                mensaje_error = 'No se puede completar un lote cancelado'
            else:
                mensaje_error = 'Solo se pueden completar lotes en estado EN_PROCESO'
            
            # Log details to help debugging client 422s
            logger.warning(
                'Attempt to completar lote denied: lote_id=%s estado=%s request_data=%s',
                lote.id,
                lote.estado,
                request.data,
            )

            return Response(
                {
                    'error': mensaje_error,
                    'estado_actual': lote.estado,
                    'accion_sugerida': 'iniciar' if lote.estado == 'PAUSADO' else None
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        # Completar el lote
        # Allow client to provide an explicit fecha_real_fin (ISO format). If invalid or not provided, use server now().
        fecha_real_fin_input = request.data.get('fecha_real_fin', None)
        if fecha_real_fin_input:
            # parse_datetime can handle ISO 8601 strings like 'YYYY-MM-DDTHH:MM:SS' optionally with timezone
            parsed = parse_datetime(fecha_real_fin_input)
            if parsed is None:
                logger.warning(
                    'Invalid fecha_real_fin provided to completar: lote_id=%s value=%s',
                    lote.id,
                    fecha_real_fin_input,
                )
                return Response(
                    {'error': 'Formato de fecha inválido para fecha_real_fin. Use ISO8601: YYYY-MM-DDTHH:MM:SS'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # If parsed datetime is naive, make it timezone-aware using current timezone
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())

            lote.fecha_real_fin = parsed
        else:
            lote.fecha_real_fin = timezone.now()

        lote.estado = 'FINALIZADO'

        # Adjuntar información para auditoria
        lote._usuario_actual = request.user
        lote._ip_address = self.get_client_ip(request)
        lote._user_agent = request.META.get('HTTP_USER_AGENT', '')

        lote.save()

        serializer = self.get_serializer(lote)
        return Response({
            'message': 'Lote completado exitosamente',
            'lote': serializer.data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrOperario])
    def pausar(self, request, pk=None):
        """
        Endpoint: /api/produccion/lotes/{id}/pausar/
        Pausa un lote (cambia estado a PAUSADO)
        """
        lote = self.get_object()

        # Validar que solo se puedan pausar lotes EN_PROCESO
        if lote.estado != 'EN_PROCESO':
            return Response(
                {
                    'error': 'Solo se pueden pausar lotes en estado EN_PROCESO',
                    'estado_actual': lote.estado
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener motivo de pausa
        motivo = request.data.get('motivo', '')
        if not motivo.strip():
            return Response(
                {'error': 'Debe proporcionar un motivo para pausar el lote'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pausar el lote
        lote.estado = 'PAUSADO'
        lote.observaciones = f"{lote.observaciones}\n\nPAUSADO: {motivo}".strip() if lote.observaciones else f"PAUSADO: {motivo}"

        # Adjuntar información para auditoria
        lote._usuario_actual = request.user
        lote._ip_address = self.get_client_ip(request)
        lote._user_agent = request.META.get('HTTP_USER_AGENT', '')

        lote.save()

        serializer = self.get_serializer(lote)
        return Response({
            'message': 'Lote pausado exitosamente',
            'lote': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def cancelar(self, request, pk=None):
        """
        Endpoint: /api/lotes/{id}/cancelar/
        Cancela un lote (solo si est� en estado PLANIFICADO)
        """
        lote = self.get_object()
        
        # Validar que solo se puedan cancelar lotes PLANIFICADOS
        if lote.estado != 'PLANIFICADO':
            mensaje_error = ''
            if lote.estado == 'EN_PROCESO':
                mensaje_error = 'No se puede cancelar un lote en proceso. Debe pausarlo primero si necesita detener la producción'
            elif lote.estado == 'PAUSADO':
                mensaje_error = 'No se puede cancelar un lote pausado. Si necesita detenerlo definitivamente, consulte con un supervisor'
            elif lote.estado == 'FINALIZADO':
                mensaje_error = 'No se puede cancelar un lote finalizado'
            elif lote.estado == 'LIBERADO':
                mensaje_error = 'No se puede cancelar un lote liberado. Si hay problemas de calidad, registre una desviación'
            elif lote.estado == 'RECHAZADO':
                mensaje_error = 'Este lote ya fue rechazado'
            elif lote.estado == 'CANCELADO':
                mensaje_error = 'Este lote ya fue cancelado'
            else:
                mensaje_error = 'Solo se pueden cancelar lotes en estado PLANIFICADO'
            
            return Response(
                {
                    'error': mensaje_error,
                    'estado_actual': lote.estado,
                    'accion_sugerida': 'pausar' if lote.estado == 'EN_PROCESO' else None
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        
        # Obtener motivo de cancelaci�n
        motivo = request.data.get('motivo', '')
        if not motivo:
            return Response(
                {'error': 'Debe proporcionar un motivo de cancelaci�n'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancelar el lote
        lote.estado = 'CANCELADO'
        lote.cancelado_por = request.user
        lote.fecha_cancelacion = timezone.now()
        lote.motivo_cancelacion = motivo
        
        # Adjuntar informaci�n para auditoria
        lote._usuario_actual = request.user
        lote._ip_address = self.get_client_ip(request)
        lote._user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        lote.save()
        
        serializer = self.get_serializer(lote)
        return Response({
            'message': 'Lote cancelado exitosamente',
            'lote': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def logs_auditoria(self, request, pk=None):
        """
        Endpoint: /api/lotes/{id}/logs_auditoria/
        Obtiene todos los logs de auditoria de un lote espec�fico
        """
        lote = self.get_object()
        
        logs = LogAuditoria.objects.filter(
            modelo='Lote',
            objeto_id=lote.id
        ).select_related('usuario').order_by('-fecha')
        
        logs_data = []
        for log in logs:
            logs_data.append({
                'id': log.id,
                'usuario': log.usuario.username if log.usuario else 'Sistema',
                'usuario_nombre_completo': log.usuario.get_full_name() if log.usuario else 'Sistema',
                'accion': log.get_accion_display(),
                'cambios': log.cambios,
                'fecha': log.fecha,
                'ip_address': log.ip_address,
            })
        
        return Response(logs_data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def ocultar(self, request, pk=None):
        """
        Endpoint: /api/lotes/{id}/ocultar/
        Oculta un lote del listado general (solo admin)
        """
        lote = self.get_object()
        
        # Obtener motivo de ocultaci�n
        motivo = request.data.get('motivo', '')
        if not motivo.strip():
            return Response(
                {'error': 'Debe proporcionar un motivo para ocultar el lote'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ocultar el lote
        lote.visible = False
        lote._usuario_actual = request.user
        lote._ip_address = self.get_client_ip(request)
        lote._user_agent = request.META.get('HTTP_USER_AGENT', '')
        lote.save()
        
        # Crear log de auditoria manual
        LogAuditoria.objects.create(
            usuario=request.user,
            modelo='Lote',
            objeto_id=lote.id,
            accion='MODIFICAR',
            cambios={
                "visible": {"antes": True, "despues": False},
                "motivo": motivo,
            },
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = self.get_serializer(lote)
        return Response({
            'message': 'Lote ocultado exitosamente',
            'lote': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mostrar(self, request, pk=None):
        """
        Endpoint: /api/lotes/{id}/mostrar/
        Muestra un lote oculto en el listado general (solo admin)
        """
        lote = self.get_object()
        
        # Mostrar el lote
        lote.visible = True
        lote._usuario_actual = request.user
        lote._ip_address = self.get_client_ip(request)
        lote._user_agent = request.META.get('HTTP_USER_AGENT', '')
        lote.save()
        
        # Crear log de auditoria manual
        LogAuditoria.objects.create(
            usuario=request.user,
            modelo='Lote',
            objeto_id=lote.id,
            accion='MODIFICAR',
            cambios={
                "visible": {"antes": False, "despues": True},
            },
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = self.get_serializer(lote)
        return Response({
            'message': 'Lote hecho visible exitosamente',
            'lote': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def en_proceso(self, request):
        """Endpoint: /api/lotes/en_proceso/"""
        lotes = self.get_queryset().filter(estado='EN_PROCESO')
        serializer = self.get_serializer(lotes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def resumen_hoy(self, request):
        """Endpoint: /api/lotes/resumen_hoy/"""
        hoy = timezone.now().date()
        lotes_hoy = self.get_queryset().filter(
            fecha_real_inicio__date=hoy
        )
        
        resumen = {
            'fecha': hoy,
            'total_lotes': lotes_hoy.count(),
            'en_proceso': lotes_hoy.filter(estado='EN_PROCESO').count(),
            'finalizados': lotes_hoy.filter(estado='FINALIZADO').count(),
            'cantidad_total_planificada': sum(l.cantidad_planificada for l in lotes_hoy),
            'cantidad_total_producida': sum(l.cantidad_producida for l in lotes_hoy),
            'por_estado': list(
                lotes_hoy.values('estado')
                .annotate(total=Count('id'))
                .order_by('-total')
            ),
            'por_producto': list(
                lotes_hoy.values('producto__nombre')
                .annotate(total=Count('id'))
                .order_by('-total')
            )
        }
        
        return Response(resumen)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def liberar(self, request, pk=None):
        """
        Endpoint: /api/lotes/{id}/liberar/
        Libera un lote (calidad aprueba) - requiere firma electrónica
        """
        lote = self.get_object()
        
        # Validar que solo se puedan liberar lotes FINALIZADOS
        if lote.estado != 'FINALIZADO':
            return Response(
                {
                    'error': 'Solo se pueden liberar lotes en estado FINALIZADO',
                    'estado_actual': lote.estado
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que se proporcione firma electrónica
        password = request.data.get('password')
        motivo = request.data.get('motivo', '')
        comentarios = request.data.get('comentarios', '')
        
        if not password:
            return Response(
                {'error': 'Debe proporcionar su contraseña para firmar electrónicamente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not motivo:
            return Response(
                {'error': 'Debe proporcionar un motivo para la liberación'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar contraseña
        if not request.user.check_password(password):
            return Response(
                {'error': 'Contraseña incorrecta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear firma electrónica
        import hashlib
        import json
        from django.utils import timezone
        
        data_to_sign = {
            'lote_id': lote.id,
            'codigo_lote': lote.codigo_lote,
            'producto': lote.producto.nombre,
            'cantidad_producida': lote.cantidad_producida,
            'cantidad_rechazada': lote.cantidad_rechazada,
            'estado_anterior': lote.estado,
            'estado_nuevo': 'LIBERADO',
            'timestamp': timezone.now().isoformat()
        }
        
        data_string = json.dumps(data_to_sign, sort_keys=True)
        data_hash = hashlib.sha256(data_string.encode()).hexdigest()
        password_hash = hashlib.sha256(f"{request.user.username}{password}{timezone.now().isoformat()}".encode()).hexdigest()
        
        firma = ElectronicSignature.objects.create(
            user=request.user,
            action='RELEASE',
            meaning='RELEASED_BY',
            content_type='Lote',
            object_id=lote.id,
            object_str=str(lote),
            reason=motivo,
            comments=comentarios,
            data_hash=data_hash,
            password_hash=password_hash,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Cambiar estado del lote
        lote.estado = 'LIBERADO'
        lote._usuario_actual = request.user
        lote._ip_address = self.get_client_ip(request)
        lote._user_agent = request.META.get('HTTP_USER_AGENT', '')
        lote.save()
        

        
        serializer = self.get_serializer(lote)
        return Response({
            'message': 'Lote liberado exitosamente',
            'lote': serializer.data,
            'firma': ElectronicSignatureSerializer(firma).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def rechazar(self, request, pk=None):
        """
        Endpoint: /api/lotes/{id}/rechazar/
        Rechaza un lote (calidad no aprueba) - requiere firma electrónica
        """
        lote = self.get_object()
        
        # Validar que solo se puedan rechazar lotes FINALIZADOS
        if lote.estado != 'FINALIZADO':
            return Response(
                {
                    'error': 'Solo se pueden rechazar lotes en estado FINALIZADO',
                    'estado_actual': lote.estado
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que se proporcione firma electrónica
        password = request.data.get('password')
        motivo = request.data.get('motivo', '')
        comentarios = request.data.get('comentarios', '')
        
        if not password:
            return Response(
                {'error': 'Debe proporcionar su contraseña para firmar electrónicamente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not motivo:
            return Response(
                {'error': 'Debe proporcionar un motivo para el rechazo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar contraseña
        if not request.user.check_password(password):
            return Response(
                {'error': 'Contraseña incorrecta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear firma electrónica
        import hashlib
        import json
        from django.utils import timezone
        
        data_to_sign = {
            'lote_id': lote.id,
            'codigo_lote': lote.codigo_lote,
            'producto': lote.producto.nombre,
            'cantidad_producida': lote.cantidad_producida,
            'cantidad_rechazada': lote.cantidad_rechazada,
            'estado_anterior': lote.estado,
            'estado_nuevo': 'RECHAZADO',
            'timestamp': timezone.now().isoformat()
        }
        
        data_string = json.dumps(data_to_sign, sort_keys=True)
        data_hash = hashlib.sha256(data_string.encode()).hexdigest()
        password_hash = hashlib.sha256(f"{request.user.username}{password}{timezone.now().isoformat()}".encode()).hexdigest()
        
        firma = ElectronicSignature.objects.create(
            user=request.user,
            action='REJECT',
            meaning='REJECTED_BY',
            content_type='Lote',
            object_id=lote.id,
            object_str=str(lote),
            reason=motivo,
            comments=comentarios,
            data_hash=data_hash,
            password_hash=password_hash,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Cambiar estado del lote
        lote.estado = 'RECHAZADO'
        lote._usuario_actual = request.user
        lote._ip_address = self.get_client_ip(request)
        lote._user_agent = request.META.get('HTTP_USER_AGENT', '')
        lote.save()
        

        
        serializer = self.get_serializer(lote)
        return Response({
            'message': 'Lote rechazado exitosamente',
            'lote': serializer.data,
            'firma': ElectronicSignatureSerializer(firma).data
        })


class LoteEtapaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Etapas de Lotes"""
    queryset = LoteEtapa.objects.select_related(
        'lote', 'etapa', 'maquina', 'operario'
    ).all().order_by('-fecha_inicio')
    serializer_class = LoteEtapaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['lote__codigo_lote', 'etapa__nombre']
    ordering_fields = ['fecha_inicio', 'orden']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por lote
        lote_id = self.request.query_params.get('lote', None)
        if lote_id:
            queryset = queryset.filter(lote_id=lote_id)
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        elif self.request.method == 'POST':
            perm_classes = [IsAdminOrOperario]  # Registrar etapa: Admin u Operario
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrOperario])
    def iniciar(self, request, pk=None):
        """
        Endpoint: /api/lotes-etapas/{id}/iniciar/
        Inicia una etapa de lote (cambia estado a EN_PROCESO)
        """
        lote_etapa = self.get_object()

        # Validar que solo se puedan iniciar etapas PENDIENTES
        if lote_etapa.estado != 'PENDIENTE':
            return Response(
                {
                    'error': 'Solo se pueden iniciar etapas en estado PENDIENTE',
                    'estado_actual': lote_etapa.estado
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Iniciar la etapa
        lote_etapa.estado = 'EN_PROCESO'
        lote_etapa.fecha_inicio = timezone.now()
        lote_etapa.operario = request.user

        # Adjuntar informaci�n para auditoria
        lote_etapa._usuario_actual = request.user
        lote_etapa._ip_address = self.get_client_ip(request)
        lote_etapa._user_agent = request.META.get('HTTP_USER_AGENT', '')

        lote_etapa.save()

        serializer = self.get_serializer(lote_etapa)
        return Response({
            'message': 'Etapa iniciada exitosamente',
            'lote_etapa': serializer.data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrOperario])
    def completar(self, request, pk=None):
        """
        Endpoint: /api/lotes-etapas/{id}/completar/
        Completa una etapa de lote (cambia estado a COMPLETADO)
        """
        lote_etapa = self.get_object()

        # Validar que solo se puedan completar etapas EN_PROCESO
        if lote_etapa.estado != 'EN_PROCESO':
            return Response(
                {
                    'error': 'Solo se pueden completar etapas en estado EN_PROCESO',
                    'estado_actual': lote_etapa.estado
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        


        # Obtener datos adicionales
        cantidad_salida = request.data.get('cantidad_salida')
        cantidad_merma = request.data.get('cantidad_merma', 0)
        observaciones = request.data.get('observaciones', '')
        requiere_aprobacion_calidad = request.data.get('requiere_aprobacion_calidad', False)

        # Completar la etapa
        lote_etapa.estado = 'COMPLETADO'
        lote_etapa.fecha_fin = timezone.now()

        if cantidad_salida is not None:
            lote_etapa.cantidad_salida = cantidad_salida
        if cantidad_merma is not None:
            lote_etapa.cantidad_merma = cantidad_merma
        if observaciones:
            lote_etapa.observaciones = observaciones
        if requiere_aprobacion_calidad is not None:
            lote_etapa.requiere_aprobacion_calidad = requiere_aprobacion_calidad

        # Adjuntar informaci�n para auditoria
        lote_etapa._usuario_actual = request.user
        lote_etapa._ip_address = self.get_client_ip(request)
        lote_etapa._user_agent = request.META.get('HTTP_USER_AGENT', '')

        lote_etapa.save()

        serializer = self.get_serializer(lote_etapa)
        return Response({
            'message': 'Etapa completada exitosamente',
            'lote_etapa': serializer.data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrOperario])
    def pausar(self, request, pk=None):
        """
        Endpoint: /api/lotes-etapas/{id}/pausar/
        Pausa una etapa de lote (cambia estado a PAUSADO)
        """
        lote_etapa = self.get_object()

        # Validar que solo se puedan pausar etapas EN_PROCESO
        if lote_etapa.estado != 'EN_PROCESO':
            return Response(
                {
                    'error': 'Solo se pueden pausar etapas en estado EN_PROCESO',
                    'estado_actual': lote_etapa.estado
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener motivo de pausa
        motivo = request.data.get('motivo', '')
        if not motivo.strip():
            return Response(
                {'error': 'Debe proporcionar un motivo para pausar la etapa'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pausar la etapa
        lote_etapa.estado = 'PAUSADO'
        lote_etapa.observaciones = f"{lote_etapa.observaciones}\n\nPAUSADO: {motivo}".strip()

        # Adjuntar informaci�n para auditoria
        lote_etapa._usuario_actual = request.user
        lote_etapa._ip_address = self.get_client_ip(request)
        lote_etapa._user_agent = request.META.get('HTTP_USER_AGENT', '')

        lote_etapa.save()

        serializer = self.get_serializer(lote_etapa)
        return Response({
            'message': 'Etapa pausada exitosamente',
            'lote_etapa': serializer.data
        })



