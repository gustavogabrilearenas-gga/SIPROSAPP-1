from rest_framework import serializers

from .models import Incidente


class IncidenteSerializer(serializers.ModelSerializer):
    maquina_detalle = serializers.SerializerMethodField()

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
            'modified',
        ]
        read_only_fields = ['created', 'modified']

    def get_maquina_detalle(self, obj):
        if not obj.maquina:
            return None
        return {
            'id': obj.maquina_id,
            'codigo': obj.maquina.codigo,
            'nombre': obj.maquina.nombre,
        }

    def validate(self, data):
        fecha_inicio = data.get('fecha_inicio') or getattr(self.instance, 'fecha_inicio', None)
        fecha_fin = data.get('fecha_fin') or getattr(self.instance, 'fecha_fin', None)

        if fecha_inicio and fecha_fin and fecha_fin <= fecha_inicio:
            raise serializers.ValidationError(
                {"fecha_fin": "La fecha de fin debe ser posterior a la fecha de inicio"}
            )

        requiere_acciones = data.get('requiere_acciones_correctivas')
        if requiere_acciones is None and self.instance:
            requiere_acciones = self.instance.requiere_acciones_correctivas

        acciones = data.get('acciones_correctivas')
        if requiere_acciones and not (acciones or getattr(self.instance, 'acciones_correctivas', '')):
            raise serializers.ValidationError(
                {"acciones_correctivas": "Se requiere especificar las acciones correctivas"}
            )

        return data
