"""Serializers del dominio de Producción"""

from django.utils import timezone
from rest_framework import serializers

from backend.produccion.models import Lote, LoteEtapa, Parada, ControlCalidad


class LoteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de lotes"""

    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    supervisor_nombre = serializers.CharField(source='supervisor.get_full_name', read_only=True)
    rendimiento_porcentaje = serializers.ReadOnlyField()
    rendimiento = serializers.ReadOnlyField(source='rendimiento_porcentaje')

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
    lote_id = serializers.IntegerField(source='lote_etapa.lote_id', read_only=True)
    lote_codigo = serializers.CharField(source='lote_etapa.lote.codigo_lote', read_only=True)
    etapa_id = serializers.IntegerField(source='lote_etapa.etapa_id', read_only=True)
    etapa_codigo = serializers.CharField(source='lote_etapa.etapa.codigo', read_only=True)
    etapa_nombre = serializers.CharField(source='lote_etapa.etapa.nombre', read_only=True)
    registrado_por_nombre = serializers.CharField(
        source='registrado_por.get_full_name', read_only=True
    )
    duracion_actual_minutos = serializers.SerializerMethodField()
    duracion_legible = serializers.SerializerMethodField()

    class Meta:
        model = Parada
        fields = [
            'id', 'lote_etapa', 'lote_id', 'lote_codigo', 'etapa_id', 'etapa_codigo',
            'etapa_nombre', 'tipo', 'tipo_display', 'categoria', 'categoria_display',
            'fecha_inicio', 'fecha_fin', 'duracion_minutos', 'duracion_actual_minutos',
            'duracion_legible', 'descripcion', 'solucion', 'registrado_por',
            'registrado_por_nombre'
        ]
        read_only_fields = ['id', 'duracion_minutos']

    def get_duracion_actual_minutos(self, obj):
        """Devuelve la duración en minutos considerando paradas en curso."""
        if obj.duracion_minutos is not None:
            return obj.duracion_minutos

        if not obj.fecha_inicio:
            return None

        delta = timezone.now() - obj.fecha_inicio
        minutos = int(delta.total_seconds() // 60)
        return max(minutos, 0)

    def get_duracion_legible(self, obj):
        """Formato amigable de la duración."""
        minutos = self.get_duracion_actual_minutos(obj)

        if minutos is None:
            return None

        if minutos <= 0:
            return 'En curso (<1 min)'

        if minutos < 60:
            return f"{minutos} min"

        horas, mins = divmod(minutos, 60)
        if mins == 0:
            return f"{horas} h"
        return f"{horas} h {mins} min"


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
