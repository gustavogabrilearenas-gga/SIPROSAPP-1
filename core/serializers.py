"""
Serializers para SIPROSA MES
Nota: Esta es una versión inicial. Se expandirá según se necesite.
"""

from rest_framework import serializers
from .models import (
    # Catálogos
    Ubicacion, Maquina, Producto, Formula, EtapaProduccion, Turno, TipoDocumento,
    # Notificaciones
    Notificacion,
)
# ============================================
# CATÁLOGOS
# ============================================

class UbicacionSerializer(serializers.ModelSerializer):
    """Serializer de ubicaciones"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    maquinas_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ubicacion
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display', 'descripcion', 'activa',
            'maquinas_count'
        ]
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
    lotes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Turno
        fields = [
            'id', 'codigo', 'nombre', 'nombre_display', 'hora_inicio', 'hora_fin',
            'activo', 'lotes_count'
        ]
        read_only_fields = ['id']


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

