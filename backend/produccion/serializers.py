from rest_framework import serializers

from .models import RegistroProduccion


class RegistroProduccionSerializer(serializers.ModelSerializer):
    """Serializer para registros de producción."""
    
    class Meta:
        model = RegistroProduccion
        fields = [
            "id",
            "estado",
            "producto",
            "formula",
            "maquina",
            "turno",
            "hora_inicio",
            "hora_fin",
            "cantidad_producida",
            "unidad_medida",
            "observaciones",
            "registrado_por",
            "fecha_registro",
        ]
        read_only_fields = [
            "id",
            "estado",
            "registrado_por",
            "fecha_registro",
        ]

    def validate(self, data):
        producto = data.get("producto") or getattr(self.instance, "producto", None)
        formula = data.get("formula") or getattr(self.instance, "formula", None)
        hora_inicio = data.get("hora_inicio") or getattr(self.instance, "hora_inicio", None)
        hora_fin = data.get("hora_fin") or getattr(self.instance, "hora_fin", None)
        cantidad = data.get("cantidad_producida") or getattr(self.instance, "cantidad_producida", None)

        if formula and producto and formula.producto_id != producto.id:
            raise serializers.ValidationError(
                {"formula": "La fórmula debe corresponder al producto seleccionado"}
            )
        if hora_inicio and hora_fin and hora_fin <= hora_inicio:
            raise serializers.ValidationError(
                {"hora_fin": "La hora de fin debe ser posterior a la hora de inicio"}
            )
        if cantidad is not None and cantidad <= 0:
            raise serializers.ValidationError(
                {"cantidad_producida": "Debe ingresar una cantidad positiva"}
            )
        return data

    def create(self, validated_data):
        """Asigna el usuario que registra la producción."""
        validated_data["registrado_por"] = self.context["request"].user
        return super().create(validated_data)