"""
Serializers para SIPROSA MES
Nota: Esta es una versión inicial. Se expandirá según se necesite.
"""

from rest_framework import serializers
from .models import (
    # Catálogos
    Ubicacion, Maquina, Producto, Formula, EtapaProduccion, Turno,
    # Calidad
    Desviacion, DocumentoVersionado,
    # Mantenimiento
    TipoMantenimiento, OrdenTrabajo,
    # Incidentes
    TipoIncidente, Incidente, AccionCorrectiva,
    # Auditoría
    Notificacion, LogAuditoria, ElectronicSignature,
)



# ============================================
# CATÁLOGOS
# ============================================

class UbicacionSerializer(serializers.ModelSerializer):
    """Serializer de ubicaciones"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Ubicacion
        fields = ['id', 'codigo', 'nombre', 'tipo', 'tipo_display', 'descripcion', 'activa']
        read_only_fields = ['id']


class MaquinaSerializer(serializers.ModelSerializer):
    """Serializer de máquinas"""
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Maquina
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display', 'fabricante', 'modelo',
            'ubicacion', 'ubicacion_nombre', 'descripcion', 'capacidad_nominal',
            'unidad_capacidad', 'activa', 'fecha_instalacion'
        ]
        read_only_fields = ['id']


class ProductoSerializer(serializers.ModelSerializer):
    """Serializer de productos"""
    forma_display = serializers.CharField(source='get_forma_farmaceutica_display', read_only=True)
    
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'nombre', 'forma_farmaceutica', 'forma_display',
            'principio_activo', 'concentracion', 'unidad_medida',
            'lote_minimo', 'lote_optimo', 'activo'
        ]
        read_only_fields = ['id']


class FormulaSerializer(serializers.ModelSerializer):
    """Serializer de fórmulas"""
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    aprobada_por_nombre = serializers.CharField(source='aprobada_por.get_full_name', read_only=True)
    
    class Meta:
        model = Formula
        fields = [
            'id', 'producto', 'producto_nombre', 'version',
            'fecha_vigencia_desde', 'fecha_vigencia_hasta',
            'rendimiento_teorico', 'tiempo_estimado_horas',
            'aprobada_por', 'aprobada_por_nombre', 'activa'
        ]
        read_only_fields = ['id']


class EtapaProduccionSerializer(serializers.ModelSerializer):
    """Serializer de etapas de producción"""
    
    class Meta:
        model = EtapaProduccion
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'orden_tipico', 'activa']
        read_only_fields = ['id']


class TurnoSerializer(serializers.ModelSerializer):
    """Serializer de turnos"""
    nombre_display = serializers.CharField(source='nombre', read_only=True)
    
    class Meta:
        model = Turno
        fields = ['id', 'codigo', 'nombre', 'nombre_display', 'hora_inicio', 'hora_fin', 'activo']
        read_only_fields = ['id']


# ============================================
# PRODUCCIÓN
# ============================================

# ============================================
# MANTENIMIENTO
# ============================================

class TipoMantenimientoSerializer(serializers.ModelSerializer):
    """Serializer de tipos de mantenimiento"""
    
    class Meta:
        model = TipoMantenimiento
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'activo']
        read_only_fields = ['id']


class OrdenTrabajoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de OT"""
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    
    class Meta:
        model = OrdenTrabajo
        fields = [
            'id', 'codigo', 'maquina', 'maquina_nombre',
            'tipo', 'tipo_nombre', 'prioridad', 'prioridad_display',
            'estado', 'estado_display', 'titulo', 'fecha_creacion',
            'fecha_planificada', 'asignada_a'
        ]


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    """Serializer completo de órdenes de trabajo"""
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    creada_por_nombre = serializers.CharField(source='creada_por.get_full_name', read_only=True)
    
    class Meta:
        model = OrdenTrabajo
        fields = [
            'id', 'codigo', 'tipo', 'tipo_nombre', 'maquina', 'maquina_nombre',
            'prioridad', 'prioridad_display', 'estado', 'estado_display',
            'titulo', 'descripcion', 'fecha_creacion', 'fecha_planificada',
            'fecha_inicio', 'fecha_fin', 'duracion_real_horas',
            'creada_por', 'creada_por_nombre', 'asignada_a', 'completada_por',
            'trabajo_realizado', 'observaciones', 'requiere_parada_produccion',
            'costo_estimado', 'costo_real'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'duracion_real_horas', 'creada_por']


# ============================================
# INCIDENTES
# ============================================

class TipoIncidenteSerializer(serializers.ModelSerializer):
    """Serializer de tipos de incidente"""
    
    class Meta:
        model = TipoIncidente
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'requiere_investigacion', 'activo']
        read_only_fields = ['id']


class IncidenteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de incidentes"""
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    reportado_por_nombre = serializers.CharField(source='reportado_por.get_full_name', read_only=True)
    
    class Meta:
        model = Incidente
        fields = [
            'id', 'codigo', 'tipo', 'tipo_nombre',
            'severidad', 'severidad_display', 'estado', 'estado_display',
            'titulo', 'fecha_ocurrencia', 'reportado_por', 'reportado_por_nombre'
        ]


class IncidenteSerializer(serializers.ModelSerializer):
    """Serializer completo de incidentes"""
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True, allow_null=True)
    lote_codigo = serializers.CharField(source='lote_afectado.codigo_lote', read_only=True, allow_null=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    reportado_por_nombre = serializers.CharField(source='reportado_por.get_full_name', read_only=True)
    
    class Meta:
        model = Incidente
        fields = [
            'id', 'codigo', 'tipo', 'tipo_nombre', 'severidad', 'severidad_display',
            'estado', 'estado_display', 'titulo', 'descripcion',
            'fecha_ocurrencia', 'ubicacion', 'ubicacion_nombre',
            'maquina', 'maquina_nombre', 'lote_afectado', 'lote_codigo',
            'reportado_por', 'reportado_por_nombre', 'fecha_reporte',
            'asignado_a', 'impacto_produccion', 'impacto_calidad',
            'impacto_seguridad', 'requiere_notificacion_anmat'
        ]
        read_only_fields = ['id', 'fecha_reporte', 'reportado_por']


# ============================================
# NOTIFICACIONES
# ============================================

class NotificacionSerializer(serializers.ModelSerializer):
    """Serializer de notificaciones"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = Notificacion
        fields = [
            'id', 'usuario', 'usuario_nombre', 'tipo', 'tipo_display',
            'titulo', 'mensaje', 'referencia_modelo', 'referencia_id',
            'leida', 'fecha_creacion', 'fecha_lectura'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_lectura']


# ============================================
# AUDITORÍA
# ============================================

class LogAuditoriaSerializer(serializers.ModelSerializer):
    """Serializer de logs de auditoría"""
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True, allow_null=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)
    
    class Meta:
        model = LogAuditoria
        fields = [
            'id', 'usuario', 'usuario_nombre', 'accion', 'accion_display',
            'modelo', 'objeto_id', 'objeto_str', 'cambios',
            'ip_address', 'user_agent', 'fecha'
        ]
        read_only_fields = ['id', 'fecha']


# ============================================
# FIRMAS ELECTRÓNICAS
# ============================================

class ElectronicSignatureSerializer(serializers.ModelSerializer):
    """Serializer de firmas electrónicas"""
    user_fullname = serializers.CharField(source='user.get_full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    meaning_display = serializers.CharField(source='get_meaning_display', read_only=True)
    invalidated_by_name = serializers.CharField(source='invalidated_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = ElectronicSignature
        fields = [
            'id', 'user', 'user_fullname', 'action', 'action_display',
            'meaning', 'meaning_display', 'timestamp', 'content_type',
            'object_id', 'object_str', 'reason', 'comments',
            'signature_hash', 'data_hash', 'is_valid',
            'invalidated_at', 'invalidated_by', 'invalidated_by_name',
            'invalidation_reason'
        ]
        read_only_fields = [
            'id', 'timestamp', 'signature_hash', 'data_hash',
            'is_valid', 'invalidated_at', 'invalidated_by'
        ]


class CreateSignatureSerializer(serializers.Serializer):
    """Serializer para crear una firma electrónica"""
    action = serializers.ChoiceField(choices=ElectronicSignature.ACTION_CHOICES)
    meaning = serializers.ChoiceField(choices=ElectronicSignature.MEANING_CHOICES)
    content_type = serializers.CharField(max_length=100)
    object_id = serializers.IntegerField()
    object_str = serializers.CharField(max_length=200)
    reason = serializers.CharField()
    comments = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    data_to_sign = serializers.JSONField()
    
    def validate_password(self, value):
        """Verificar que la contraseña sea correcta"""
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Usuario no autenticado")
        
        if not request.user.check_password(value):
            raise serializers.ValidationError("Contraseña incorrecta")
        
        return value
    
    def create(self, validated_data):
        """Crear la firma electrónica"""
        import hashlib
        import json
        from django.utils import timezone
        
        request = self.context.get('request')
        user = request.user
        password = validated_data.pop('password')
        data_to_sign = validated_data.pop('data_to_sign')
        
        # Crear hash de los datos
        data_string = json.dumps(data_to_sign, sort_keys=True)
        data_hash = hashlib.sha256(data_string.encode()).hexdigest()
        
        # Crear hash de password (para auditoría, no para verificación)
        password_hash = hashlib.sha256(
            f"{user.username}{password}{timezone.now().isoformat()}".encode()
        ).hexdigest()
        
        # Obtener IP y user agent
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip_address:
            ip_address = ip_address.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Crear firma
        signature = ElectronicSignature.objects.create(
            user=user,
            data_hash=data_hash,
            password_hash=password_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            **validated_data
        )
        
        return signature


# ============================================
# CALIDAD - DESVIACIONES Y CAPA
# ============================================

class DesviacionSerializer(serializers.ModelSerializer):
    """Serializer para desviaciones"""
    lote_codigo = serializers.CharField(source='lote.codigo_lote', read_only=True, allow_null=True)
    lote_etapa_descripcion = serializers.SerializerMethodField(read_only=True)
    detectado_por_nombre = serializers.CharField(source='detectado_por.get_full_name', read_only=True)
    cerrado_por_nombre = serializers.CharField(source='cerrado_por.get_full_name', read_only=True, allow_null=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Desviacion
        fields = [
            'id', 'codigo', 'lote', 'lote_codigo', 'lote_etapa', 'lote_etapa_descripcion',
            'titulo', 'descripcion', 'severidad', 'severidad_display', 'estado', 'estado_display',
            'fecha_deteccion', 'detectado_por', 'detectado_por_nombre', 'area_responsable',
            'impacto_calidad', 'impacto_seguridad', 'impacto_eficacia',
            'investigacion_realizada', 'causa_raiz', 'accion_inmediata',
            'requiere_capa', 'fecha_cierre', 'cerrado_por', 'cerrado_por_nombre'
        ]
        read_only_fields = ['id', 'fecha_cierre', 'cerrado_por']
    
    def get_lote_etapa_descripcion(self, obj):
        if obj.lote_etapa:
            return f"{obj.lote_etapa.etapa.nombre} - Orden {obj.lote_etapa.orden}"
        return None


class AccionCorrectivaSerializer(serializers.ModelSerializer):
    """Serializer para acciones correctivas (CAPA)"""
    incidente_codigo = serializers.CharField(source='incidente.codigo', read_only=True)
    incidente_titulo = serializers.CharField(source='incidente.titulo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    verificado_por_nombre = serializers.CharField(source='verificado_por.get_full_name', read_only=True, allow_null=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = AccionCorrectiva
        fields = [
            'id', 'incidente', 'incidente_codigo', 'incidente_titulo',
            'tipo', 'tipo_display', 'descripcion', 'responsable', 'responsable_nombre',
            'fecha_planificada', 'fecha_implementacion', 'estado', 'estado_display',
            'eficacia_verificada', 'verificado_por', 'verificado_por_nombre',
            'fecha_verificacion', 'observaciones'
        ]
        read_only_fields = ['id']


# ============================================
# DOCUMENTOS VERSIONADOS
# ============================================

class DocumentoVersionadoSerializer(serializers.ModelSerializer):
    """Serializer para documentos versionados"""
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    revisado_por_nombre = serializers.CharField(source='revisado_por.get_full_name', read_only=True, allow_null=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True, allow_null=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    documento_anterior_codigo = serializers.CharField(source='documento_anterior.codigo', read_only=True, allow_null=True)
    
    class Meta:
        model = DocumentoVersionado
        fields = [
            'id', 'codigo', 'titulo', 'tipo', 'tipo_display', 'version', 'estado', 'estado_display',
            'fecha_creacion', 'creado_por', 'creado_por_nombre',
            'fecha_revision', 'revisado_por', 'revisado_por_nombre',
            'fecha_aprobacion', 'aprobado_por', 'aprobado_por_nombre',
            'fecha_vigencia_inicio', 'fecha_vigencia_fin',
            'contenido', 'archivo_url', 'hash_sha256', 'cambios_version',
            'documento_anterior', 'documento_anterior_codigo'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'hash_sha256']