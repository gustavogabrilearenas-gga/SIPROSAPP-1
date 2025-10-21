from rest_framework import serializers

from .models import RegistroProduccion


class RegistroProduccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroProduccion
        fields = (
            "id",
            "hora_inicio",
            "hora_fin",
            "producto",
            "maquina",
            "formula",
            "cantidad_producida",
            "unidad_medida",
            "observaciones",
            "creado_en",
        )
        read_only_fields = ("id", "creado_en")

    def validate(self, attrs):
        hora_inicio = attrs.get("hora_inicio") or getattr(self.instance, "hora_inicio", None)
        hora_fin = attrs.get("hora_fin") or getattr(self.instance, "hora_fin", None)

        if hora_inicio and hora_fin and hora_fin < hora_inicio:
            raise serializers.ValidationError(
                {"hora_fin": "La hora de fin debe ser posterior a la hora de inicio."}
            )

        producto = attrs.get("producto") or getattr(self.instance, "producto", None)
        formula = attrs.get("formula") or getattr(self.instance, "formula", None)

        if producto and formula and formula.producto_id != producto.id:
            raise serializers.ValidationError(
                {"formula": "La fórmula seleccionada no corresponde al producto indicado."}
            )

        return attrs

    def validate_cantidad_producida(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad producida debe ser positiva.")
        return value
