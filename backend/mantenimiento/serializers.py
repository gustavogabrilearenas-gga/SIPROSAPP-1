"""Serializers del dominio de mantenimiento."""

from rest_framework import serializers

from .models import OrdenTrabajo, TipoMantenimiento


class TipoMantenimientoSerializer(serializers.ModelSerializer):
    """Serializer de tipos de mantenimiento."""

    class Meta:
        model = TipoMantenimiento
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'activo']
        read_only_fields = ['id']


class OrdenTrabajoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de OT."""

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
            'fecha_planificada', 'asignada_a',
        ]


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    """Serializer completo de órdenes de trabajo."""

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
            'costo_estimado', 'costo_real',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'duracion_real_horas', 'creada_por']
