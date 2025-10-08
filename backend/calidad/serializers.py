"""Serializadores para el dominio de Calidad"""

from rest_framework import serializers

from .models import AccionCorrectiva, Desviacion, DocumentoVersionado


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


class DocumentoVersionadoSerializer(serializers.ModelSerializer):
    """Serializer para documentos versionados"""

    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    revisado_por_nombre = serializers.CharField(source='revisado_por.get_full_name', read_only=True, allow_null=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True, allow_null=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = DocumentoVersionado
        fields = [
            'id', 'codigo', 'titulo', 'tipo', 'tipo_display', 'estado', 'estado_display', 'version',
            'fecha_creacion', 'creado_por', 'creado_por_nombre', 'fecha_revision', 'revisado_por',
            'revisado_por_nombre', 'fecha_aprobacion', 'aprobado_por', 'aprobado_por_nombre',
            'fecha_vigencia_inicio', 'fecha_vigencia_fin', 'contenido', 'archivo_url', 'hash_sha256',
            'cambios_version', 'documento_anterior'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'creado_por', 'hash_sha256']
