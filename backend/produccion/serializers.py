from rest_framework import serializers

from .models import RegistroProduccion


class RegistroProduccionSerializer(serializers.ModelSerializer):
    """Serializer para registros de producción."""
    
    class Meta:
        model = RegistroProduccion
        fields = [
            "id",
            "hora_inicio",
            "hora_fin",
            "producto",
            "maquina",
            "formula",
            "unidad_medida",
            "cantidad_producida",
            "observaciones",
            "turno",
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
        # Validar que la fórmula corresponda al producto
        if data.get("formula") and data.get("producto"):
            if data["formula"].producto_id != data["producto"].id:
                raise serializers.ValidationError({
                    "formula": "La fórmula debe corresponder al producto seleccionado"
                })
        return data

    def create(self, validated_data):
        """Asigna el usuario que registra la producción."""
        validated_data["registrado_por"] = self.context["request"].user
        return super().create(validated_data)