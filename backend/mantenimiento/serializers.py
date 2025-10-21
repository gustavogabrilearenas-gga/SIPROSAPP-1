from rest_framework import serializers

from .models import RegistroMantenimiento


class RegistroMantenimientoSerializer(serializers.ModelSerializer):
    """Serializer para registros de mantenimiento."""
    
    class Meta:
        model = RegistroMantenimiento
        fields = [
            "id",
            "hora_inicio",
            "hora_fin",
            "maquina",
            "tipo_mantenimiento",
            "descripcion",
            "tiene_anomalias",
            "descripcion_anomalias",
            "observaciones",
            "registrado_por",  # Solo para lectura
            "fecha_registro",
        ]
        read_only_fields = [
            "id",
            "registrado_por",  # No se puede modificar
            "fecha_registro",
        ]

    def validate(self, data):
        """Validaciones adicionales."""
        # Validar que si hay anomalías, se proporcione su descripción
        if data.get("tiene_anomalias") and not data.get("descripcion_anomalias"):
            raise serializers.ValidationError({
                "descripcion_anomalias": "Debe proporcionar una descripción de las anomalías encontradas"
            })
        return data

    def create(self, validated_data):
        """Asigna el usuario que registra el mantenimiento."""
        validated_data["registrado_por"] = self.context["request"].user
        return super().create(validated_data)