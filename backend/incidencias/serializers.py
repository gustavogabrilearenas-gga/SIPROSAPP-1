"""Serializers del dominio de incidencias"""

from rest_framework import serializers

from .models import Incidente, TipoIncidente


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
