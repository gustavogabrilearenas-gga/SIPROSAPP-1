from rest_framework import serializers
from .models import Incidente
from backend.catalogos.serializers import MaquinaSerializer

class IncidenteSerializer(serializers.ModelSerializer):
    maquina_detalle = MaquinaSerializer(source='maquina', read_only=True)
    
    class Meta:
        model = Incidente
        fields = [
            'id',
            'fecha_inicio',
            'fecha_fin',
            'es_parada_no_planificada',
            'origen',
            'maquina',
            'maquina_detalle',
            'descripcion',
            'requiere_acciones_correctivas',
            'acciones_correctivas',
            'observaciones',
            'created',
            'modified'
        ]
        read_only_fields = ['created', 'modified']
    
    def validate(self, data):
        if data.get('fecha_fin') <= data.get('fecha_inicio'):
            raise serializers.ValidationError(
                {"fecha_fin": "La fecha de fin debe ser posterior a la fecha de inicio"}
            )
        
        if data.get('requiere_acciones_correctivas') and not data.get('acciones_correctivas'):
            raise serializers.ValidationError(
                {"acciones_correctivas": "Se requiere especificar las acciones correctivas"}
            )
            
        return data