"""Serializadores del módulo de producción."""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from .models import RegistroProduccion


class RegistroProduccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroProduccion
        fields = (
            "id",
            "fecha_produccion",
            "maquina",
            "producto",
            "formula",
            "unidad_medida",
            "cantidad_producida",
            "hora_inicio",
            "hora_fin",
            "observaciones",
            "registrado_en",
            "registrado_por",
        )
        read_only_fields = ("id", "registrado_en", "registrado_por")

    def validate(self, attrs):
        hora_inicio = attrs.get("hora_inicio") or getattr(self.instance, "hora_inicio", None)
        hora_fin = attrs.get("hora_fin") or getattr(self.instance, "hora_fin", None)
        cantidad = attrs.get("cantidad_producida") or getattr(
            self.instance, "cantidad_producida", None
        )
        producto = attrs.get("producto") or getattr(self.instance, "producto", None)
        formula = attrs.get("formula") or getattr(self.instance, "formula", None)

        errors = {}
        if cantidad is not None and cantidad <= 0:
            errors["cantidad_producida"] = "La cantidad producida debe ser mayor que cero."
        if hora_inicio and hora_fin and hora_fin <= hora_inicio:
            errors["hora_fin"] = "La hora de fin debe ser posterior a la hora de inicio."
        if formula and producto and formula.producto_id != producto.id:
            errors["formula"] = "La fórmula seleccionada no corresponde al producto indicado."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def validate_hora_inicio(self, value):
        if value and timezone.is_naive(value):
            return timezone.make_aware(value)
        return value

    def validate_hora_fin(self, value):
        if value and timezone.is_naive(value):
            return timezone.make_aware(value)
        return value

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)
