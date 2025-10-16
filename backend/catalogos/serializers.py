"""
Serializers para los modelos de catálogos
"""
from rest_framework import serializers
from .models import Ubicacion, Maquina, Producto, Formula, EtapaProduccion, Turno


class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = '__all__'


class MaquinaSerializer(serializers.ModelSerializer):
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)
    
    class Meta:
        model = Maquina
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'


class FormulaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    
    class Meta:
        model = Formula
        fields = '__all__'


class EtapaProduccionSerializer(serializers.ModelSerializer):
    maquinas_permitidas_nombres = serializers.SerializerMethodField()
    
    class Meta:
        model = EtapaProduccion
        fields = '__all__'
    
    def get_maquinas_permitidas_nombres(self, obj):
        return [
            {'id': maq.id, 'nombre': str(maq)}
            for maq in obj.maquinas_permitidas.all()
        ]


class TurnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turno
        fields = '__all__'