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
from django.contrib.auth.models import User
from datetime import datetime, timedelta
import django

from .models import (
    # Usuarios
    UserProfile,
    # Cat�logos
    Ubicacion, Maquina, Producto, Formula, EtapaProduccion, Turno,
    # Producci�n
    Lote, LoteEtapa, Parada, ControlCalidad, Desviacion, DocumentoVersionado,
    # Inventario
    Insumo, LoteInsumo, Repuesto, ProductoTerminado, MovimientoInventario,
    # Mantenimiento
    TipoMantenimiento, OrdenTrabajo,
    # Incidentes
    TipoIncidente, Incidente, AccionCorrectiva,
    # Auditor�a
    LogAuditoria, Notificacion, ElectronicSignature,
)

from .serializers import (
    # Usuarios
    UserSerializer, UsuarioDetalleSerializer, UsuarioPerfilSerializer, CrearUsuarioSerializer, CambiarPasswordSerializer,
    # Cat�logos
    UbicacionSerializer, MaquinaSerializer, ProductoSerializer,
    FormulaSerializer, EtapaProduccionSerializer, TurnoSerializer,
    # Producci�n
    LoteSerializer, LoteListSerializer, LoteEtapaSerializer,
    ParadaSerializer, ControlCalidadSerializer, DesviacionSerializer, DocumentoVersionadoSerializer,
    # Inventario
    InsumoSerializer, LoteInsumoSerializer, RepuestoSerializer,
    ProductoTerminadoSerializer, MovimientoInventarioSerializer,
    # Mantenimiento
    TipoMantenimientoSerializer, OrdenTrabajoSerializer, OrdenTrabajoListSerializer,
    # Incidentes
    TipoIncidenteSerializer, IncidenteSerializer, IncidenteListSerializer, AccionCorrectivaSerializer,
    # Notificaciones y Auditoría
    NotificacionSerializer, LogAuditoriaSerializer,
    # Firmas Electr�nicas
    ElectronicSignatureSerializer, CreateSignatureSerializer,
)

from .permissions import (
    IsAdmin, IsAdminOrSupervisor, IsAdminOrOperario
)


# ============================================
# USUARIOS
# ============================================

class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gesti�n de usuarios (solo admin/superuser)"""
    queryset = User.objects.all().select_related('profile').order_by('username')
    serializer_class = UsuarioDetalleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email', 'profile__legajo']
    ordering_fields = ['username', 'date_joined', 'last_login', 'is_active']
    
    def get_permissions(self):
        """Permisos personalizados seg�n la acci�n"""
        if self.action in ['me', 'cambiar_mi_password', 'update_me']:
            # Cualquier usuario autenticado puede ver/editar su perfil
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update'] and self.kwargs.get('pk'):
            # Un usuario puede editar su propio perfil
            user_id = self.kwargs['pk']
            if str(self.request.user.id) == str(user_id):
                return [permissions.IsAuthenticated()]
            else:
                return [IsAdmin()]
        else:
            # Solo admin/superuser puede gestionar otros usuarios
            return [IsAdmin()]
    
    def get_serializer_class(self):
        """Usar diferentes serializers seg�n la acci�n"""
        if self.action == 'create':
            return CrearUsuarioSerializer
        elif self.action in ['cambiar_password', 'cambiar_mi_password']:
            return CambiarPasswordSerializer
        elif self.action == 'me':
            return UsuarioDetalleSerializer
        elif self.action == 'update_me':
            return UsuarioPerfilSerializer
        elif self.action in ['update', 'partial_update'] and self.kwargs.get('pk'):
            # Si es el propio usuario editando su perfil, usar serializer simplificado
            user_id = self.kwargs['pk']
            if str(self.request.user.id) == str(user_id):
                return UsuarioPerfilSerializer
            else:
                return UsuarioDetalleSerializer
        return UsuarioDetalleSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener perfil del usuario actual"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Actualizar perfil del usuario actual"""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def cambiar_mi_password(self, request):
        """Cambiar contrase�a del usuario actual"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        password_actual = serializer.validated_data.get('password_actual')
        
        # Verificar contrase�a actual
        if password_actual and not user.check_password(password_actual):
            return Response(
                {'error': 'La contrase�a actual es incorrecta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar contrase�a
        user.set_password(serializer.validated_data['password_nueva'])
        user.save()
        
        return Response({'message': 'Contrase�a cambiada exitosamente'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def cambiar_password(self, request, pk=None):
        """Cambiar contrase�a de otro usuario (solo admin)"""
        usuario = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Admin puede cambiar sin verificar contrase�a actual
        usuario.set_password(serializer.validated_data['password_nueva'])
        usuario.save()
        
        return Response({'message': f'Contrase�a de {usuario.username} cambiada exitosamente'})
    
    def destroy(self, request, *args, **kwargs):
        """Desactivar usuario en lugar de eliminarlo (soft delete)"""
        usuario = self.get_object()
        
        # No permitir eliminar al propio usuario
        if usuario == request.user:
            return Response(
                {'error': 'No puedes eliminar tu propia cuenta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Desactivar en lugar de eliminar
        usuario.is_active = False
        usuario.save()
        
        # Tambi�n desactivar el perfil si existe
        if hasattr(usuario, 'profile'):
            usuario.profile.activo = False
            usuario.profile.save()
        
        return Response({'message': f'Usuario {usuario.username} desactivado exitosamente'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reactivar(self, request, pk=None):
        """Reactivar un usuario desactivado"""
        usuario = self.get_object()
        usuario.is_active = True
        usuario.save()
        
        if hasattr(usuario, 'profile'):
            usuario.profile.activo = True
            usuario.profile.save()
        
        return Response({'message': f'Usuario {usuario.username} reactivado exitosamente'})


# ============================================
# CAT�LOGOS
# ============================================

class UbicacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Ubicaciones"""
    queryset = Ubicacion.objects.all().order_by('codigo')
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
    queryset = Turno.objects.all().order_by('codigo')
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

class LoteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Lotes de Producci�n"""
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def cancelar(self, request, pk=None):
        """
        Endpoint: /api/lotes/{id}/cancelar/
        Cancela un lote (solo si est� en estado PLANIFICADO)
        """
        lote = self.get_object()
        
        # Validar que solo se puedan cancelar lotes PLANIFICADOS
        if lote.estado != 'PLANIFICADO':
            return Response(
                {
                    'error': 'Solo se pueden cancelar lotes en estado PLANIFICADO',
                    'estado_actual': lote.estado
                },
                status=status.HTTP_400_BAD_REQUEST
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
        
        # Crear notificación para el supervisor
        Notificacion.objects.create(
            usuario=lote.supervisor,
            tipo='INFO',
            titulo=f'Lote {lote.codigo_lote} liberado',
            mensaje=f'El lote {lote.codigo_lote} ha sido liberado por {request.user.get_full_name()}. Motivo: {motivo}',
            referencia_modelo='Lote',
            referencia_id=lote.id
        )
        
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
        
        # Crear notificación para el supervisor
        Notificacion.objects.create(
            usuario=lote.supervisor,
            tipo='URGENTE',
            titulo=f'Lote {lote.codigo_lote} rechazado',
            mensaje=f'El lote {lote.codigo_lote} ha sido RECHAZADO por {request.user.get_full_name()}. Motivo: {motivo}',
            referencia_modelo='Lote',
            referencia_id=lote.id
        )
        
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
        
        # VALIDACIÓN QC: Verificar controles de calidad pendientes
        controles_requeridos = lote_etapa.etapa.parametros_esperados if lote_etapa.etapa.requiere_registro_parametros else []
        if controles_requeridos:
            # Verificar si hay controles de calidad registrados
            controles_registrados = ControlCalidad.objects.filter(
                lote_etapa=lote_etapa
            ).count()
            
            # Si se requieren controles y no hay ninguno registrado, bloquear
            if controles_registrados == 0:
                return Response(
                    {
                        'error': 'No se puede completar la etapa sin registrar controles de calidad',
                        'codigo': 'QC_PENDIENTE',
                        'controles_requeridos': len(controles_requeridos),
                        'controles_registrados': 0,
                        'message': f'Esta etapa requiere {len(controles_requeridos)} control(es) de calidad antes de completarse'
                    },
                    status=status.HTTP_409_CONFLICT
                )
            
            # Verificar si hay controles NO conformes
            controles_no_conformes = ControlCalidad.objects.filter(
                lote_etapa=lote_etapa,
                conforme=False
            )
            
            if controles_no_conformes.exists():
                return Response(
                    {
                        'error': 'No se puede completar la etapa con controles de calidad no conformes',
                        'codigo': 'QC_NO_CONFORME',
                        'controles_no_conformes': controles_no_conformes.count(),
                        'detalles': [
                            {
                                'tipo_control': c.tipo_control,
                                'valor_medido': float(c.valor_medido),
                                'rango': f"{c.valor_minimo} - {c.valor_maximo}"
                            }
                            for c in controles_no_conformes
                        ],
                        'message': 'Hay controles de calidad que no cumplen especificaciones'
                    },
                    status=status.HTTP_409_CONFLICT
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


class ParadaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Paradas"""
    queryset = Parada.objects.select_related(
        'lote_etapa', 'registrado_por'
    ).all().order_by('-fecha_inicio')
    serializer_class = ParadaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['descripcion', 'lote_etapa__lote__codigo_lote']
    ordering_fields = ['fecha_inicio', 'duracion_minutos']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())
        
        # Filtro por categor�a
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria=categoria.upper())
        
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdminOrOperario]
        return [p() for p in perm_classes]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrOperario])
    def finalizar(self, request, pk=None):
        """
        Endpoint: /api/paradas/{id}/finalizar/
        Finaliza una parada (establece fecha_fin)
        """
        parada = self.get_object()

        # Validar que la parada no est� ya finalizada
        if parada.fecha_fin:
            return Response(
                {
                    'error': 'Esta parada ya est� finalizada',
                    'fecha_fin': parada.fecha_fin
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener soluci�n
        solucion = request.data.get('solucion', '')
        if not solucion.strip():
            return Response(
                {'error': 'Debe proporcionar una soluci�n para finalizar la parada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Finalizar la parada
        parada.fecha_fin = timezone.now()
        parada.solucion = solucion

        parada.save()

        serializer = self.get_serializer(parada)
        return Response({
            'message': 'Parada finalizada exitosamente',
            'parada': serializer.data
        })


class ControlCalidadViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Controles de Calidad"""
    queryset = ControlCalidad.objects.select_related(
        'lote_etapa', 'controlado_por'
    ).all().order_by('-fecha_control')
    serializer_class = ControlCalidadSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tipo_control', 'lote_etapa__lote__codigo_lote']
    ordering_fields = ['fecha_control', 'conforme']
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [IsAdminOrSupervisor]
        else:
            perm_classes = [IsAdmin]  # Solo Calidad/Admin puede registrar controles
        return [p() for p in perm_classes]


# ============================================
# INVENTARIO
# ============================================

class InsumoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Insumos"""
    queryset = Insumo.objects.select_related('categoria').all().order_by('codigo')
    serializer_class = InsumoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por categor�a
        categoria_id = self.request.query_params.get('categoria', None)
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)
        
        # Filtro por activo
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            activo = activo.lower() == 'true'
            queryset = queryset.filter(activo=activo)
        
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class LoteInsumoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Lotes de Insumos"""
    queryset = LoteInsumo.objects.select_related(
        'insumo', 'ubicacion'
    ).all().order_by('fecha_vencimiento', 'fecha_recepcion')  # FEFO
    serializer_class = LoteInsumoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['insumo__nombre', 'codigo_lote_proveedor']
    ordering_fields = ['fecha_vencimiento', 'fecha_recepcion']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por insumo
        insumo_id = self.request.query_params.get('insumo', None)
        if insumo_id:
            queryset = queryset.filter(insumo_id=insumo_id)
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
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
        
        # Filtro por categor�a
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria=categoria.upper())
        
        # Filtro por cr�tico
        critico = self.request.query_params.get('critico', None)
        if critico is not None:
            critico = critico.lower() == 'true'
            queryset = queryset.filter(critico=critico)
        
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class ProductoTerminadoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Productos Terminados"""
    queryset = ProductoTerminado.objects.select_related(
        'lote', 'ubicacion'
    ).all().order_by('fecha_vencimiento')
    serializer_class = ProductoTerminadoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['lote__codigo_lote', 'lote__producto__nombre']
    ordering_fields = ['fecha_vencimiento', 'fecha_fabricacion']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


# ============================================
# MANTENIMIENTO
# ============================================

class TipoMantenimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Tipos de Mantenimiento"""
    queryset = TipoMantenimiento.objects.all().order_by('codigo')
    serializer_class = TipoMantenimientoSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar �rdenes de Trabajo"""
    queryset = OrdenTrabajo.objects.select_related(
        'tipo', 'maquina', 'creada_por', 'asignada_a'
    ).all().order_by('-fecha_creacion')
    serializer_class = OrdenTrabajoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'titulo', 'maquina__nombre']
    ordering_fields = ['fecha_creacion', 'fecha_planificada', 'prioridad']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por m�quina
        maquina_id = self.request.query_params.get('maquina', None)
        if maquina_id:
            queryset = queryset.filter(maquina_id=maquina_id)
        
        # Filtro por tipo
        tipo_id = self.request.query_params.get('tipo', None)
        if tipo_id:
            queryset = queryset.filter(tipo_id=tipo_id)
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        
        # Filtro por prioridad
        prioridad = self.request.query_params.get('prioridad', None)
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
        return [p() for p in perm_classes]
    
    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def abiertas(self, request):
        """Endpoint: /api/ordenes-trabajo/abiertas/"""
        ordenes = self.get_queryset().exclude(estado__in=['COMPLETADA', 'CANCELADA'])
        serializer = self.get_serializer(ordenes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def asignar(self, request, pk=None):
        """Endpoint: /api/ordenes-trabajo/{id}/asignar/"""
        ot = self.get_object()
        
        if ot.estado not in ['ABIERTA', 'ASIGNADA']:
            return Response(
                {'error': f'No se puede asignar una OT en estado {ot.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tecnico_id = request.data.get('tecnico_id')
        if not tecnico_id:
            return Response(
                {'error': 'Debe proporcionar el ID del técnico (tecnico_id)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tecnico = User.objects.get(id=tecnico_id)
        except User.DoesNotExist:
            return Response(
                {'error': f'Usuario con ID {tecnico_id} no existe'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        ot.asignada_a = tecnico
        ot.estado = 'ASIGNADA'
        ot.save()
        
        serializer = self.get_serializer(ot)
        return Response({
            'message': f'OT asignada a {tecnico.get_full_name()}',
            'orden_trabajo': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def iniciar(self, request, pk=None):
        """Endpoint: /api/ordenes-trabajo/{id}/iniciar/"""
        ot = self.get_object()
        
        # Solo el técnico asignado o un admin puede iniciar
        if ot.asignada_a and ot.asignada_a != request.user and not request.user.is_superuser:
            return Response(
                {'error': 'Solo el técnico asignado puede iniciar esta OT'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if ot.estado not in ['ASIGNADA', 'PAUSADA']:
            return Response(
                {'error': f'No se puede iniciar una OT en estado {ot.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ot.estado = 'EN_PROCESO'
        if not ot.fecha_inicio:
            ot.fecha_inicio = timezone.now()
        ot.save()
        
        serializer = self.get_serializer(ot)
        return Response({
            'message': 'OT iniciada exitosamente',
            'orden_trabajo': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def pausar(self, request, pk=None):
        """Endpoint: /api/ordenes-trabajo/{id}/pausar/"""
        ot = self.get_object()
        
        if ot.estado != 'EN_PROCESO':
            return Response(
                {'error': 'Solo se pueden pausar OT en proceso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        motivo = request.data.get('motivo', '')
        if not motivo:
            return Response(
                {'error': 'Debe proporcionar un motivo de pausa'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ot.estado = 'PAUSADA'
        ot.observaciones = f"{ot.observaciones}\n\nPAUSADA: {motivo} ({timezone.now()})".strip()
        ot.save()
        
        serializer = self.get_serializer(ot)
        return Response({
            'message': 'OT pausada exitosamente',
            'orden_trabajo': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def completar(self, request, pk=None):
        """Endpoint: /api/ordenes-trabajo/{id}/completar/"""
        ot = self.get_object()
        
        if ot.estado not in ['EN_PROCESO', 'PAUSADA']:
            return Response(
                {'error': f'No se puede completar una OT en estado {ot.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        trabajo_realizado = request.data.get('trabajo_realizado', '')
        if not trabajo_realizado:
            return Response(
                {'error': 'Debe describir el trabajo realizado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        costo_real = request.data.get('costo_real')
        
        ot.estado = 'COMPLETADA'
        ot.fecha_fin = timezone.now()
        ot.trabajo_realizado = trabajo_realizado
        ot.completada_por = request.user
        
        if costo_real:
            ot.costo_real = costo_real
        
        ot.save()
        
        serializer = self.get_serializer(ot)
        return Response({
            'message': 'OT completada exitosamente',
            'orden_trabajo': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def cerrar(self, request, pk=None):
        """Endpoint: /api/ordenes-trabajo/{id}/cerrar/ - Cierre administrativo"""
        ot = self.get_object()
        
        if ot.estado != 'COMPLETADA':
            return Response(
                {'error': 'Solo se pueden cerrar OT completadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comentarios = request.data.get('comentarios', '')
        if comentarios:
            ot.observaciones = f"{ot.observaciones}\n\nCERRADA: {comentarios} ({timezone.now()})".strip()
        
        ot.save()
        
        serializer = self.get_serializer(ot)
        return Response({
            'message': 'OT cerrada exitosamente',
            'orden_trabajo': serializer.data
        })


# ============================================
# INCIDENTES
# ============================================

class TipoIncidenteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Tipos de Incidente"""
    queryset = TipoIncidente.objects.all().order_by('codigo')
    serializer_class = TipoIncidenteSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]


class IncidenteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Incidentes"""
    queryset = Incidente.objects.select_related(
        'tipo', 'ubicacion', 'maquina', 'lote_afectado', 'reportado_por'
    ).all().order_by('-fecha_ocurrencia')
    serializer_class = IncidenteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'titulo', 'descripcion']
    ordering_fields = ['fecha_ocurrencia', 'severidad']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por tipo
        tipo_id = self.request.query_params.get('tipo', None)
        if tipo_id:
            queryset = queryset.filter(tipo_id=tipo_id)
        
        # Filtro por severidad
        severidad = self.request.query_params.get('severidad', None)
        if severidad:
            queryset = queryset.filter(severidad=severidad.upper())
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return IncidenteListSerializer
        return IncidenteSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            perm_classes = [permissions.IsAuthenticated]
        else:
            perm_classes = [IsAdmin]
        return [p() for p in perm_classes]
    
    def perform_create(self, serializer):
        serializer.save(reportado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def abiertos(self, request):
        """Endpoint: /api/incidentes/abiertos/"""
        incidentes = self.get_queryset().exclude(estado='CERRADO')
        serializer = self.get_serializer(incidentes, many=True)
        return Response(serializer.data)


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
# FIRMAS ELECTRÓNICAS
# ============================================

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
        
        # Filtro por content_type y object_id
        content_type = self.request.query_params.get('content_type', None)
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        object_id = self.request.query_params.get('object_id', None)
        if object_id:
            queryset = queryset.filter(object_id=object_id)
        
        # Filtro por validez
        is_valid = self.request.query_params.get('is_valid', None)
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
            perm_classes = [IsAdmin]  # Invalidar solo admin
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
        
        serializer = self.get_serializer(firma)
        return Response({
            'message': 'Firma invalidada exitosamente',
            'firma': serializer.data
        })


# ============================================
# MOVIMIENTOS DE INVENTARIO
# ============================================

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
        
        # Filtro por tipo de item
        tipo_item = self.request.query_params.get('tipo_item', None)
        if tipo_item:
            queryset = queryset.filter(tipo_item=tipo_item.upper())
        
        # Filtro por item_id
        item_id = self.request.query_params.get('item_id', None)
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        
        # Filtro por tipo de movimiento
        tipo_movimiento = self.request.query_params.get('tipo_movimiento', None)
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
        # Validar FEFO si es salida
        data = serializer.validated_data
        if data['tipo_movimiento'] == 'SALIDA' and data['tipo_item'] == 'INSUMO':
            self._validar_fefo(data)
        
        serializer.save(registrado_por=self.request.user)
    
    def _validar_fefo(self, data):
        """Validar que se respete FEFO (First Expired, First Out)"""
        # Obtener lote de insumo más próximo a vencer con stock disponible
        if data.get('lote_item_id'):
            from django.db.models import F
            lote_usado = LoteInsumo.objects.filter(
                id=data['lote_item_id'],
                estado='APROBADO'
            ).first()
            
            if lote_usado:
                # Verificar si hay lotes que vencen antes con stock disponible
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
        """Endpoint: /api/movimientos/resumen/ - Resumen de inventario"""
        tipo_item = request.query_params.get('tipo_item', 'INSUMO')
        
        # Calcular stock actual por item
        from django.db.models import Sum, Case, When, IntegerField
        
        movimientos = MovimientoInventario.objects.filter(tipo_item=tipo_item)
        
        # Aquí iría lógica más compleja para calcular stock actual
        # Por ahora retornamos estructura básica
        return Response({
            'tipo_item': tipo_item,
            'total_movimientos': movimientos.count(),
            'message': 'Endpoint en desarrollo - usar modelos específicos (Insumo, Repuesto) para stock actual'
        })


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
# AUDITORÍA GENÉRICA
# ============================================

class AuditoriaGenericaView(APIView):
    """
    Vista para consultar logs de auditoría de cualquier modelo
    GET /api/auditoria?modelo=Lote&objeto_id=123&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&usuario=1
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Parámetros de filtro
        modelo = request.query_params.get('modelo')
        objeto_id = request.query_params.get('objeto_id')
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        usuario_id = request.query_params.get('usuario')
        accion = request.query_params.get('accion')
        
        # Construir query
        logs = LogAuditoria.objects.all()
        
        if modelo:
            logs = logs.filter(modelo=modelo)
        
        if objeto_id:
            logs = logs.filter(objeto_id=objeto_id)
        
        if desde:
            fecha_desde = datetime.strptime(desde, '%Y-%m-%d')
            logs = logs.filter(fecha__gte=fecha_desde)
        
        if hasta:
            fecha_hasta = datetime.strptime(hasta, '%Y-%m-%d')
            # Incluir todo el día
            fecha_hasta = fecha_hasta.replace(hour=23, minute=59, second=59)
            logs = logs.filter(fecha__lte=fecha_hasta)
        
        if usuario_id:
            logs = logs.filter(usuario_id=usuario_id)
        
        if accion:
            logs = logs.filter(accion=accion.upper())
        
        # Limitar y ordenar
        logs = logs.select_related('usuario').order_by('-fecha')[:100]
        
        # Serializar
        serializer = LogAuditoriaSerializer(logs, many=True)
        
        return Response({
            'total': logs.count(),
            'filtros': {
                'modelo': modelo,
                'objeto_id': objeto_id,
                'desde': desde,
                'hasta': hasta,
                'usuario': usuario_id,
                'accion': accion
            },
            'logs': serializer.data
        })


# ============================================
# DESVIACIONES Y CAPA
# ============================================

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
        
        # Filtro por severidad
        severidad = self.request.query_params.get('severidad', None)
        if severidad:
            queryset = queryset.filter(severidad=severidad.upper())
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        
        # Filtro por lote
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
        """Endpoint: /api/desviaciones/abiertas/"""
        desviaciones = self.get_queryset().exclude(estado='CERRADA')
        serializer = self.get_serializer(desviaciones, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSupervisor])
    def cerrar(self, request, pk=None):
        """Endpoint: /api/desviaciones/{id}/cerrar/"""
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
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        
        # Filtro por incidente
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
        """Endpoint: /api/acciones-correctivas/pendientes/"""
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
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        
        # Solo documentos vigentes
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
        """Endpoint: /api/documentos/{id}/aprobar/"""
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
            'message': 'Documento aprobado exitosamente',
            'documento': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def publicar(self, request, pk=None):
        """Endpoint: /api/documentos/{id}/publicar/ - Hacer vigente el documento"""
        documento = self.get_object()
        
        if documento.estado != 'APROBADO':
            return Response(
                {'error': 'Solo se pueden publicar documentos APROBADOS'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documento.estado = 'VIGENTE'
        if not documento.fecha_vigencia_inicio:
            documento.fecha_vigencia_inicio = timezone.now().date()
        documento.save()
        
        serializer = self.get_serializer(documento)
        return Response({
            'message': 'Documento publicado exitosamente',
            'documento': serializer.data
        })


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
    """
    Devuelve el estado general del backend
    """
    db_ok = True
    try:
        connections['default'].cursor()
    except OperationalError:
        db_ok = False

    data = {
        "status": "ok" if db_ok else "error",
        "database": db_ok,
        "debug": settings.DEBUG,
        "django_version": django.get_version(),
        "server_time": datetime.now().isoformat(timespec='seconds'),
        "environment": "development" if settings.DEBUG else "production",
        "models_count": {
            "maquinas": Maquina.objects.count(),
            "productos": Producto.objects.count(),
            "lotes": Lote.objects.count(),
            "ordenes_trabajo": OrdenTrabajo.objects.count(),
            "incidentes": Incidente.objects.count(),
        }
    }

    return JsonResponse(data)
