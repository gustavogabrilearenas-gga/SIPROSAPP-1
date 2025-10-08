"""
Serializers para SIPROSA MES
Nota: Esta es una versión inicial. Se expandirá según se necesite.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    # Usuarios
    UserProfile, Rol,
    # Catálogos
    Ubicacion, Maquina, Producto, Formula, EtapaProduccion, Turno,
    # Producción
    Lote, LoteEtapa, Parada, ControlCalidad, Desviacion, DocumentoVersionado,
    # Inventario
    Insumo, LoteInsumo, Repuesto, ProductoTerminado, MovimientoInventario,
    # Mantenimiento
    TipoMantenimiento, OrdenTrabajo,
    # Incidentes
    TipoIncidente, Incidente, AccionCorrectiva,
    # Auditoría
    Notificacion, LogAuditoria, ElectronicSignature,
)


# ============================================
# USUARIOS
# ============================================

class UserSerializer(serializers.ModelSerializer):
    """Serializer básico de usuario"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_staff', 'is_superuser']
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer de perfil de usuario"""
    usuario = UserSerializer(source='user', read_only=True)
    area_display = serializers.CharField(source='get_area_display', read_only=True)
    turno_display = serializers.CharField(source='get_turno_habitual_display', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'usuario', 'legajo', 'area', 'area_display', 
                  'turno_habitual', 'turno_display', 'telefono', 'fecha_ingreso', 'activo']


class UsuarioDetalleSerializer(serializers.ModelSerializer):
    """Serializer completo para gestión de usuarios (admin)"""
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    # Campos del perfil para facilitar edición
    legajo = serializers.CharField(required=False, allow_blank=True)
    area = serializers.CharField(required=False, allow_blank=True)
    turno_habitual = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(required=False, allow_blank=True)
    fecha_ingreso = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login',
            'profile', 'legajo', 'area', 'turno_habitual', 'telefono',
            'fecha_ingreso'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login', 'is_active', 'is_staff', 'is_superuser']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def to_representation(self, instance):
        """Convertir fechas a formato ISO sin zona horaria para evitar problemas con JavaScript"""
        data = super().to_representation(instance)

        # Convertir date_joined a string ISO si existe
        if instance.date_joined:
            data['date_joined'] = instance.date_joined.isoformat()

        # Convertir last_login a string ISO si existe
        if instance.last_login:
            data['last_login'] = instance.last_login.isoformat()

        # Agregar campos del perfil al root para facilitar acceso en frontend
        if hasattr(instance, 'profile'):
            profile = instance.profile
            data['legajo'] = profile.legajo or ''
            data['area'] = profile.area or ''
            data['turno_habitual'] = profile.turno_habitual or ''
            data['telefono'] = profile.telefono or ''
            data['fecha_ingreso'] = profile.fecha_ingreso

        return data
    
    def create(self, validated_data):
        """Crear usuario con perfil"""
        # Extraer campos del perfil
        profile_data = {
            'legajo': validated_data.pop('legajo', ''),
            'area': validated_data.pop('area', ''),
            'turno_habitual': validated_data.pop('turno_habitual', ''),
            'telefono': validated_data.pop('telefono', ''),
            'fecha_ingreso': validated_data.pop('fecha_ingreso', None),
            'activo': validated_data.pop('activo', True),
        }
        
        # Crear usuario
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        # Crear o actualizar perfil
        UserProfile.objects.update_or_create(
            user=user,
            defaults=profile_data
        )
        
        return user
    
    def update(self, instance, validated_data):
        """Actualizar usuario y perfil"""
        # Verificar si es el propio usuario o un admin
        request = self.context.get('request')
        is_self_update = request and request.user == instance

        # Extraer campos del perfil
        profile_data = {
            'legajo': validated_data.pop('legajo', None),
            'area': validated_data.pop('area', None),
            'turno_habitual': validated_data.pop('turno_habitual', None),
            'telefono': validated_data.pop('telefono', None),
            'fecha_ingreso': validated_data.pop('fecha_ingreso', None),
        }

        # Si es el propio usuario, solo permitir ciertos campos
        if is_self_update:
            # Solo permitir actualizar campos básicos del usuario y perfil
            allowed_user_fields = ['first_name', 'last_name', 'email']
            allowed_profile_fields = ['legajo', 'area', 'turno_habitual', 'telefono']

            # Filtrar campos permitidos
            filtered_validated_data = {
                k: v for k, v in validated_data.items()
                if k in allowed_user_fields
            }
            filtered_profile_data = {
                k: v for k, v in profile_data.items()
                if k in allowed_profile_fields and v is not None
            }
        else:
            # Admin puede actualizar todos los campos
            filtered_validated_data = validated_data
            filtered_profile_data = profile_data

        # Actualizar usuario
        for attr, value in filtered_validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar perfil
        profile, created = UserProfile.objects.get_or_create(user=instance)
        for attr, value in filtered_profile_data.items():
            # Manejar campos especiales según su tipo
            if attr == 'fecha_ingreso':
                # Para fechas, None si está vacío
                setattr(profile, attr, value if value else None)
            elif value is not None:
                # Para strings, permitir vacíos
                setattr(profile, attr, value if value is not None else '')
        profile.save()

        return instance


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    """Serializer para que usuarios editen su propio perfil"""
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    # Campos editables del perfil
    legajo = serializers.CharField(required=False, allow_blank=True)
    area = serializers.CharField(required=False, allow_blank=True)
    turno_habitual = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email', 'full_name',
            'profile', 'legajo', 'area', 'turno_habitual', 'telefono'
        ]
        read_only_fields = ['id']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def to_representation(self, instance):
        """Convertir fechas a formato ISO sin zona horaria para evitar problemas con JavaScript"""
        data = super().to_representation(instance)

        # Nota: Este serializer no incluye campos de fecha, pero por si acaso
        return data

    def update(self, instance, validated_data):
        """Actualizar usuario y perfil (solo campos permitidos)"""
        # Extraer campos del perfil
        profile_data = {
            'legajo': validated_data.pop('legajo', None),
            'area': validated_data.pop('area', None),
            'turno_habitual': validated_data.pop('turno_habitual', None),
            'telefono': validated_data.pop('telefono', None),
        }

        # Actualizar usuario (solo campos básicos)
        for attr in ['first_name', 'last_name', 'email']:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])
        instance.save()

        # Actualizar perfil
        profile, created = UserProfile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            # Manejar campos según su tipo (este serializer no tiene fecha_ingreso, pero por consistencia)
            if value is not None:
                setattr(profile, attr, value if value is not None else '')
        profile.save()

        return instance


class CambiarPasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    password_actual = serializers.CharField(required=False, write_only=True)
    password_nueva = serializers.CharField(required=True, write_only=True, min_length=4)
    password_confirmacion = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        """Validar que las contraseñas coincidan"""
        if data['password_nueva'] != data['password_confirmacion']:
            raise serializers.ValidationError({
                'password_confirmacion': 'Las contraseñas no coinciden'
            })
        return data


class CrearUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para crear nuevos usuarios (admin)"""
    password = serializers.CharField(write_only=True, required=True, min_length=4)
    password_confirmacion = serializers.CharField(write_only=True, required=True)
    
    # Campos del perfil
    legajo = serializers.CharField(required=False, allow_blank=True)
    area = serializers.CharField(required=False, allow_blank=True)
    turno_habitual = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(required=False, allow_blank=True)
    fecha_ingreso = serializers.DateField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password', 
            'password_confirmacion', 'is_staff', 'is_superuser',
            'legajo', 'area', 'turno_habitual', 'telefono', 'fecha_ingreso'
        ]
    
    def validate(self, data):
        """Validar campos"""
        # Validar que las contraseñas coincidan
        if data['password'] != data['password_confirmacion']:
            raise serializers.ValidationError({
                'password_confirmacion': 'Las contraseñas no coinciden'
            })

        # Validar turno habitual
        turno = data.get('turno_habitual')
        if turno and turno not in dict(UserProfile.TURNO_CHOICES).keys():
            raise serializers.ValidationError({
                'turno_habitual': f'Valor inválido. Debe ser uno de: {", ".join(dict(UserProfile.TURNO_CHOICES).keys())}'
            })

        return data
    
    def create(self, validated_data):
        """Crear usuario con perfil"""
        validated_data.pop('password_confirmacion')
        
        # Extraer campos del perfil
        profile_data = {
            'legajo': validated_data.pop('legajo', ''),
            'area': validated_data.pop('area', ''),
            'turno_habitual': validated_data.pop('turno_habitual', ''),
            'telefono': validated_data.pop('telefono', ''),
            'fecha_ingreso': validated_data.pop('fecha_ingreso', None),
            'activo': True,
        }
        
        # Crear usuario
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Crear perfil
        UserProfile.objects.create(user=user, **profile_data)
        
        return user


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

class LoteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de lotes"""
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    supervisor_nombre = serializers.CharField(source='supervisor.get_full_name', read_only=True)
    rendimiento_porcentaje = serializers.ReadOnlyField()
    rendimiento = serializers.ReadOnlyField(source='rendimiento_porcentaje')  # Alias para compatibilidad
    
    class Meta:
        model = Lote
        fields = [
            'id', 'codigo_lote', 'producto', 'producto_nombre',
            'estado', 'estado_display', 'prioridad', 'prioridad_display',
            'cantidad_planificada', 'cantidad_producida', 'cantidad_rechazada',
            'unidad', 'rendimiento_porcentaje', 'rendimiento',
            'fecha_planificada_inicio', 'fecha_real_inicio', 
            'fecha_planificada_fin', 'fecha_real_fin',
            'fecha_creacion', 'supervisor', 'supervisor_nombre'
        ]


class LoteSerializer(serializers.ModelSerializer):
    """Serializer completo de lotes"""
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    formula_version = serializers.CharField(source='formula.version', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    turno_nombre = serializers.CharField(source='turno.nombre', read_only=True)
    supervisor_nombre = serializers.CharField(source='supervisor.get_full_name', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    cancelado_por_nombre = serializers.CharField(source='cancelado_por.get_full_name', read_only=True, allow_null=True)
    rendimiento = serializers.ReadOnlyField(source='rendimiento_porcentaje')
    
    class Meta:
        model = Lote
        fields = [
            'id', 'codigo_lote', 'producto', 'producto_nombre',
            'formula', 'formula_version', 'cantidad_planificada', 'cantidad_producida',
            'cantidad_rechazada', 'unidad', 'estado', 'estado_display',
            'prioridad', 'prioridad_display', 'fecha_planificada_inicio',
            'fecha_real_inicio', 'fecha_planificada_fin', 'fecha_real_fin',
            'turno', 'turno_nombre', 'supervisor', 'supervisor_nombre',
            'observaciones', 'creado_por', 'creado_por_nombre',
            'fecha_creacion', 'rendimiento', 'visible',
            'cancelado_por', 'cancelado_por_nombre', 'fecha_cancelacion', 'motivo_cancelacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'creado_por', 'cancelado_por', 'fecha_cancelacion']
    
    def validate(self, data):
        """Validaciones de negocio"""
        # Validar fechas
        if data.get('fecha_real_fin') and data.get('fecha_real_inicio'):
            if data['fecha_real_fin'] < data['fecha_real_inicio']:
                raise serializers.ValidationError({
                    "fecha_real_fin": "La fecha de fin debe ser posterior a la fecha de inicio"
                })
        
        return data


class LoteEtapaSerializer(serializers.ModelSerializer):
    """Serializer de etapas de lote"""
    lote_codigo = serializers.CharField(source='lote.codigo_lote', read_only=True)
    etapa_nombre = serializers.CharField(source='etapa.nombre', read_only=True)
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)
    operario_nombre = serializers.CharField(source='operario.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = LoteEtapa
        fields = [
            'id', 'lote', 'lote_codigo', 'etapa', 'etapa_nombre',
            'orden', 'maquina', 'maquina_nombre', 'estado', 'estado_display',
            'fecha_inicio', 'fecha_fin', 'duracion_minutos',
            'operario', 'operario_nombre', 'cantidad_entrada', 'cantidad_salida',
            'cantidad_merma', 'porcentaje_rendimiento', 'observaciones'
        ]
        read_only_fields = ['id', 'duracion_minutos', 'porcentaje_rendimiento']


class ParadaSerializer(serializers.ModelSerializer):
    """Serializer de paradas"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    
    class Meta:
        model = Parada
        fields = [
            'id', 'lote_etapa', 'tipo', 'tipo_display',
            'categoria', 'categoria_display', 'fecha_inicio', 'fecha_fin',
            'duracion_minutos', 'descripcion', 'solucion', 'registrado_por'
        ]
        read_only_fields = ['id', 'duracion_minutos']


class ControlCalidadSerializer(serializers.ModelSerializer):
    """Serializer de controles de calidad"""
    
    class Meta:
        model = ControlCalidad
        fields = [
            'id', 'lote_etapa', 'tipo_control', 'valor_medido', 'unidad',
            'valor_minimo', 'valor_maximo', 'conforme',
            'fecha_control', 'controlado_por', 'observaciones'
        ]
        read_only_fields = ['id', 'conforme', 'fecha_control']


# ============================================
# INVENTARIO
# ============================================

class InsumoSerializer(serializers.ModelSerializer):
    """Serializer de insumos"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    stock_disponible = serializers.ReadOnlyField(source='stock_actual')
    
    class Meta:
        model = Insumo
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_nombre',
            'unidad_medida', 'stock_minimo', 'stock_maximo', 'punto_reorden',
            'stock_disponible', 'activo'
        ]
        read_only_fields = ['id']


class LoteInsumoSerializer(serializers.ModelSerializer):
    """Serializer de lotes de insumo"""
    insumo_nombre = serializers.CharField(source='insumo.nombre', read_only=True)
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    dias_vencimiento = serializers.ReadOnlyField(source='dias_para_vencimiento')
    
    class Meta:
        model = LoteInsumo
        fields = [
            'id', 'insumo', 'insumo_nombre', 'codigo_lote_proveedor',
            'fecha_recepcion', 'fecha_vencimiento', 'dias_vencimiento',
            'cantidad_inicial', 'cantidad_actual', 'unidad',
            'ubicacion', 'ubicacion_nombre', 'ubicacion_detalle',
            'estado', 'estado_display', 'proveedor'
        ]
        read_only_fields = ['id']


class RepuestoSerializer(serializers.ModelSerializer):
    """Serializer de repuestos"""
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)
    
    class Meta:
        model = Repuesto
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_display',
            'stock_minimo', 'stock_actual', 'punto_reorden',
            'ubicacion', 'ubicacion_nombre', 'critico', 'activo'
        ]
        read_only_fields = ['id']


class ProductoTerminadoSerializer(serializers.ModelSerializer):
    """Serializer de productos terminados"""
    lote_codigo = serializers.CharField(source='lote.codigo_lote', read_only=True)
    producto_nombre = serializers.CharField(source='lote.producto.nombre', read_only=True)
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = ProductoTerminado
        fields = [
            'id', 'lote', 'lote_codigo', 'producto_nombre',
            'cantidad', 'unidad', 'fecha_fabricacion', 'fecha_vencimiento',
            'ubicacion', 'ubicacion_nombre', 'ubicacion_detalle',
            'estado', 'estado_display'
        ]
        read_only_fields = ['id']


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
# MOVIMIENTOS DE INVENTARIO
# ============================================

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    """Serializer de movimientos de inventario"""
    tipo_item_display = serializers.CharField(source='get_tipo_item_display', read_only=True)
    tipo_movimiento_display = serializers.CharField(source='get_tipo_movimiento_display', read_only=True)
    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)
    ubicacion_origen_nombre = serializers.CharField(source='ubicacion_origen.nombre', read_only=True, allow_null=True)
    ubicacion_destino_nombre = serializers.CharField(source='ubicacion_destino.nombre', read_only=True, allow_null=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    
    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'tipo_item', 'tipo_item_display', 'item_id', 'lote_item_id',
            'tipo_movimiento', 'tipo_movimiento_display', 'motivo', 'motivo_display',
            'cantidad', 'unidad', 'ubicacion_origen', 'ubicacion_origen_nombre',
            'ubicacion_destino', 'ubicacion_destino_nombre', 'referencia_documento',
            'fecha_movimiento', 'registrado_por', 'registrado_por_nombre', 'observaciones'
        ]
        read_only_fields = ['id', 'fecha_movimiento', 'registrado_por']


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