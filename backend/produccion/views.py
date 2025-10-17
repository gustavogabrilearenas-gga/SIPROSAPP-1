"""Vistas del dominio de Producción"""

import logging
from decimal import Decimal

from django.db.models import (
    Count,
    DateTimeField,
    DecimalField,
    F,
    Max,
    Min,
    OuterRef,
    Q,
    Subquery,
    Sum,
    TimeField,
    Value,
)
from django.db.models.functions import Coalesce, Cast
from django.utils import timezone
from django.utils.dateparse import parse_date

logger = logging.getLogger(__name__)
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.utils.serializer_helpers import ReturnDict

from backend.auditoria.models import ElectronicSignature, LogAuditoria
from backend.auditoria.serializers import ElectronicSignatureSerializer
from backend.produccion.models import Lote, LoteEtapa, RegistroProduccion
from backend.produccion.serializers import (
    RegistroProduccionSerializer,
    LoteEtapaSerializer,
    LoteListSerializer,
    LoteSerializer,
)
from backend.core.permissions import (
    IsAdmin,
    IsAdminOrOperario,
    IsAdminOrSupervisor,
    IsAdminSupervisorOperarioOrCalidad,
    IsAdminSupervisorOrCalidad,
    IsAdminSupervisorOrOperario,
)


class RegistroProduccionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para gestionar registros de producción."""

    queryset = (
        RegistroProduccion.objects.select_related(
            "maquina",
            "producto",
            "turno",
            "registrado_por",
        )
        .all()
        .order_by("-fecha_produccion", "-fecha_registro")
    )
    serializer_class = RegistroProduccionSerializer
    permission_classes = [IsAdminSupervisorOperarioOrCalidad]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "maquina__codigo",
        "producto__nombre",
        "registrado_por__username",
    ]
    ordering_fields = [
        "fecha_produccion",
        "fecha_registro",
        "maquina",
        "producto",
        "turno",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        params = self.request.query_params

        fecha = parse_date(params.get("fecha")) if params.get("fecha") else None
        fecha_desde = parse_date(params.get("fecha_desde")) if params.get("fecha_desde") else None
        fecha_hasta = parse_date(params.get("fecha_hasta")) if params.get("fecha_hasta") else None
        turno_id = params.get("turno")
        maquina_id = params.get("maquina")

        if fecha is not None:
            queryset = queryset.filter(fecha_produccion=fecha)
        if fecha_desde is not None:
            queryset = queryset.filter(fecha_produccion__gte=fecha_desde)
        if fecha_hasta is not None:
            queryset = queryset.filter(fecha_produccion__lte=fecha_hasta)
        if turno_id:
            queryset = queryset.filter(turno_id=turno_id)
        if maquina_id:
            queryset = queryset.filter(maquina_id=maquina_id)

        suma_cantidades = (
            LoteEtapa.objects.filter(
                maquina_id=OuterRef("maquina_id"),
                lote__turno_id=OuterRef("turno_id"),
            )
            .filter(fecha_inicio__date__lte=OuterRef("fecha_produccion"))
            .filter(
                Q(fecha_fin__date__gte=OuterRef("fecha_produccion"))
                | (
                    Q(fecha_fin__isnull=True)
                    & Q(fecha_inicio__date=OuterRef("fecha_produccion"))
                )
            )
            .values("maquina_id")
            .annotate(total=Sum("cantidad_salida"))
            .values("total")
        )

        cantidad_field = DecimalField(max_digits=10, decimal_places=2)

        etapas_mismo_dia = LoteEtapa.objects.filter(
            maquina_id=OuterRef("maquina_id"),
            lote__turno_id=OuterRef("turno_id"),
            fecha_inicio__date=OuterRef("fecha_produccion"),
        )

        hora_inicio_subquery = (
            etapas_mismo_dia.filter(fecha_inicio__isnull=False)
            .order_by()
            .values("maquina_id")
            .annotate(valor=Min("fecha_inicio"))
            .values("valor")[:1]
        )

        hora_fin_subquery = (
            etapas_mismo_dia.filter(fecha_fin__isnull=False)
            .order_by()
            .values("maquina_id")
            .annotate(valor=Max("fecha_fin"))
            .values("valor")[:1]
        )

        hora_inicio_expr = Cast(
            Subquery(hora_inicio_subquery, output_field=DateTimeField()),
            output_field=TimeField(),
        )
        hora_fin_expr = Cast(
            Subquery(hora_fin_subquery, output_field=DateTimeField()),
            output_field=TimeField(),
        )

        return queryset.annotate(
            cantidad_producida=Coalesce(
                Subquery(suma_cantidades, output_field=cantidad_field),
                Value(Decimal("0"), output_field=cantidad_field),
            ),
            hora_inicio=Coalesce(hora_inicio_expr, F("hora_inicio")),
            hora_fin=Coalesce(hora_fin_expr, F("hora_fin")),
        )


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
            # Ver lotes: Admin, Supervisor, Operario o Calidad
            perm_classes = [IsAdminSupervisorOperarioOrCalidad]
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminSupervisorOrOperario])
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

    @action(detail=True, methods=['post'], permission_classes=[IsAdminSupervisorOrOperario])
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

    @action(detail=True, methods=['post'], permission_classes=[IsAdminSupervisorOrOperario])
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminSupervisorOrCalidad])
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminSupervisorOrCalidad])
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
        action = getattr(self, "action", None)

        if action:
            bound_action = getattr(self, action, None)
            custom_permissions = getattr(bound_action, "permission_classes", None)
            if custom_permissions is not None:
                return [permission() for permission in custom_permissions]

        if action in ["list", "retrieve"]:
            perm_classes = [IsAdminSupervisorOperarioOrCalidad]
        elif action == "create":
            perm_classes = [IsAdminSupervisorOrOperario]
        elif action in ["update", "partial_update"]:
            perm_classes = [IsAdminSupervisorOperarioOrCalidad]
        elif action == "destroy":
            perm_classes = [IsAdmin]
        else:
            perm_classes = [IsAdmin]
        return [permission() for permission in perm_classes]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminSupervisorOrOperario])
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

    def perform_create(self, serializer):
        self._last_serializer = serializer
        serializer.save()

    def perform_update(self, serializer):
        self._last_serializer = serializer
        serializer.save()

    def _attach_warnings(self, response):
        serializer = getattr(self, "_last_serializer", None)
        if not serializer:
            return response

        warnings = getattr(serializer, "warnings", None)
        if warnings:
            data = response.data
            if isinstance(data, (dict, ReturnDict)):
                data_with_warnings = dict(data)
                data_with_warnings["warnings"] = warnings
                response.data = data_with_warnings
        self._last_serializer = None
        return response

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return self._attach_warnings(response)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return self._attach_warnings(response)

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        return self._attach_warnings(response)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminSupervisorOrOperario])
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
        cantidad_entrada = request.data.get('cantidad_entrada')
        cantidad_salida = request.data.get('cantidad_salida')
        observaciones = request.data.get('observaciones', '')

        # Completar la etapa
        lote_etapa.estado = 'COMPLETADO'
        lote_etapa.fecha_fin = timezone.now()

        if cantidad_entrada is not None:
            lote_etapa.cantidad_entrada = cantidad_entrada
        if cantidad_salida is not None:
            lote_etapa.cantidad_salida = cantidad_salida
        if observaciones:
            lote_etapa.observaciones = observaciones

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

    @action(detail=True, methods=['post'], permission_classes=[IsAdminSupervisorOrOperario])
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



