"""Serializadores para el módulo de observaciones."""

from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import (
    RegistroProduccion,
    RegistroMantenimiento,
    RegistroIncidente,
    ObservacionGeneral
)


class RegistroProduccionSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    turno_nombre = serializers.CharField(source='turno.nombre', read_only=True)
    turno_display = serializers.CharField(source='turno.get_codigo_display', read_only=True)
    unidad_display = serializers.CharField(source='get_unidad_medida_display', read_only=True)

    class Meta:
        model = RegistroProduccion
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'registrado_por']

    def validate(self, data):
        """Validaciones cruzadas."""
        if data.get('hora_fin') and data.get('hora_inicio'):
            if data['hora_fin'] <= data['hora_inicio']:
                raise serializers.ValidationError({
                    'hora_fin': 'La hora de fin debe ser posterior a la hora de inicio.'
                })
        
        if data.get('cantidad_producida') and data['cantidad_producida'] < 0:
            raise serializers.ValidationError({
                'cantidad_producida': 'La cantidad no puede ser negativa.'
            })
        
        return data

    def create(self, validated_data):
        """Crea el registro con validaciones del modelo."""
        instance = RegistroProduccion(**validated_data)
        try:
            instance.full_clean()  # Ejecuta validaciones del modelo
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        instance.save()
        return instance


class RegistroMantenimientoSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)
    turno_nombre = serializers.CharField(source='turno.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_mantenimiento_display', read_only=True)

    class Meta:
        model = RegistroMantenimiento
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'registrado_por']

    def validate(self, data):
        """Validaciones cruzadas."""
        if data.get('hora_fin') and data.get('hora_inicio'):
            if data['hora_fin'] <= data['hora_inicio']:
                raise serializers.ValidationError({
                    'hora_fin': 'La hora de fin debe ser posterior a la hora de inicio.'
                })
        return data

    def create(self, validated_data):
        """Crea el registro con validaciones del modelo."""
        instance = RegistroMantenimiento(**validated_data)
        try:
            instance.full_clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        instance.save()
        return instance


class RegistroIncidenteSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True, allow_null=True)
    turno_nombre = serializers.CharField(source='turno.nombre', read_only=True)
    contexto_display = serializers.CharField(source='get_contexto_origen_display', read_only=True)

    class Meta:
        model = RegistroIncidente
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'registrado_por']

    def validate(self, data):
        """Validaciones cruzadas."""
        if data.get('hora_fin') and data.get('hora_inicio'):
            if data['hora_fin'] <= data['hora_inicio']:
                raise serializers.ValidationError({
                    'hora_fin': 'La hora de fin debe ser posterior a la hora de inicio.'
                })
        
        if data.get('acciones_correctivas') and not data.get('detalle_acciones'):
            raise serializers.ValidationError({
                'detalle_acciones': 'Debe especificar el detalle de las acciones correctivas.'
            })
        
        return data

    def create(self, validated_data):
        """Crea el registro con validaciones del modelo."""
        instance = RegistroIncidente(**validated_data)
        try:
            instance.full_clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        instance.save()
        return instance


class ObservacionGeneralSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)

    class Meta:
        model = ObservacionGeneral
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'registrado_por']

    def validate_observaciones(self, value):
        """Valida que las observaciones no estén vacías."""
        if not value or not value.strip():
            raise serializers.ValidationError('Las observaciones no pueden estar vacías.')
        return value