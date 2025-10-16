"""Serializadores para el módulo de eventos."""

from rest_framework import serializers
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

    class Meta:
        model = RegistroProduccion
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'registrado_por']


class RegistroMantenimientoSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)

    class Meta:
        model = RegistroMantenimiento
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'registrado_por']


class RegistroIncidenteSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)

    class Meta:
        model = RegistroIncidente
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'registrado_por']


class ObservacionGeneralSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)

    class Meta:
        model = ObservacionGeneral
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'registrado_por']