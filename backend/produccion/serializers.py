"""Serializers del dominio de Producción"""

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from backend.produccion.models import Lote, LoteEtapa, RegistroProduccion


class RegistroProduccionSerializer(serializers.ModelSerializer):
    """Serializer para registros diarios de producción."""

    registrado_por_nombre = serializers.CharField(source="registrado_por.get_full_name", read_only=True)
    maquina_nombre = serializers.CharField(source="maquina.nombre", read_only=True)
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    turno_nombre = serializers.CharField(source="turno.nombre", read_only=True)
    turno_display = serializers.CharField(source="turno.get_codigo_display", read_only=True)
    unidad_display = serializers.CharField(source="get_unidad_medida_display", read_only=True)

    class Meta:
        model = RegistroProduccion
        fields = "__all__"
        read_only_fields = ["fecha_registro", "registrado_por"]
        extra_kwargs = {
            "cantidad_producida": {"min_value": 0},
        }

    def validate(self, data):
        """Validaciones cruzadas a nivel de serializer."""
        hora_inicio = data.get("hora_inicio")
        hora_fin = data.get("hora_fin")
        if hora_inicio and hora_fin and hora_fin <= hora_inicio:
            raise serializers.ValidationError({
                "hora_fin": "La hora de fin debe ser posterior a la de inicio."
            })

        if data.get("cantidad_producida") and data["cantidad_producida"] < 0:
            raise serializers.ValidationError({
                "cantidad_producida": "La cantidad no puede ser negativa."
            })

        fecha_produccion = data.get("fecha_produccion")
        maquina = data.get("maquina")
        turno = data.get("turno")

        if self.instance is not None:
            if fecha_produccion is None:
                fecha_produccion = self.instance.fecha_produccion
            if maquina is None:
                maquina = self.instance.maquina
            if turno is None:
                turno = self.instance.turno

        if fecha_produccion and maquina and turno:
            qs = RegistroProduccion.objects.filter(
                fecha_produccion=fecha_produccion,
                maquina=maquina,
                turno=turno,
            )
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {
                        "turno": "Ya existe un registro para esta máquina, fecha y turno.",
                    }
                )

        return data

    def create(self, validated_data):
        """Crea el registro aplicando validaciones del modelo."""
        instance = RegistroProduccion(**validated_data)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)
        instance.save()
        return instance


class LoteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de lotes"""

    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    prioridad_display = serializers.CharField(source="get_prioridad_display", read_only=True)
    supervisor_nombre = serializers.CharField(source="supervisor.get_full_name", read_only=True)
    rendimiento_porcentaje = serializers.ReadOnlyField()
    rendimiento = serializers.ReadOnlyField(source="rendimiento_porcentaje")

    class Meta:
        model = Lote
        fields = [
            "id",
            "codigo_lote",
            "producto",
            "producto_nombre",
            "estado",
            "estado_display",
            "prioridad",
            "prioridad_display",
            "cantidad_planificada",
            "cantidad_producida",
            "cantidad_rechazada",
            "unidad",
            "rendimiento_porcentaje",
            "rendimiento",
            "fecha_planificada_inicio",
            "fecha_real_inicio",
            "fecha_planificada_fin",
            "fecha_real_fin",
            "fecha_creacion",
            "supervisor",
            "supervisor_nombre",
        ]


class LoteSerializer(serializers.ModelSerializer):
    """Serializer completo de lotes"""

    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    formula_version = serializers.CharField(source="formula.version", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    prioridad_display = serializers.CharField(source="get_prioridad_display", read_only=True)
    turno_nombre = serializers.CharField(source="turno.nombre", read_only=True)
    supervisor_nombre = serializers.CharField(source="supervisor.get_full_name", read_only=True)
    creado_por_nombre = serializers.CharField(source="creado_por.get_full_name", read_only=True)
    cancelado_por_nombre = serializers.CharField(
        source="cancelado_por.get_full_name", read_only=True, allow_null=True
    )
    rendimiento = serializers.ReadOnlyField(source="rendimiento_porcentaje")

    class Meta:
        model = Lote
        fields = [
            "id",
            "codigo_lote",
            "producto",
            "producto_nombre",
            "formula",
            "formula_version",
            "cantidad_planificada",
            "cantidad_producida",
            "cantidad_rechazada",
            "unidad",
            "estado",
            "estado_display",
            "prioridad",
            "prioridad_display",
            "fecha_planificada_inicio",
            "fecha_real_inicio",
            "fecha_planificada_fin",
            "fecha_real_fin",
            "turno",
            "turno_nombre",
            "supervisor",
            "supervisor_nombre",
            "observaciones",
            "creado_por",
            "creado_por_nombre",
            "fecha_creacion",
            "rendimiento",
            "visible",
            "cancelado_por",
            "cancelado_por_nombre",
            "fecha_cancelacion",
            "motivo_cancelacion",
        ]
        read_only_fields = ["id", "fecha_creacion", "creado_por", "cancelado_por", "fecha_cancelacion"]

    def validate(self, data):
        """Validaciones de negocio"""
        if data.get("fecha_real_fin") and data.get("fecha_real_inicio"):
            if data["fecha_real_fin"] < data["fecha_real_inicio"]:
                raise serializers.ValidationError({
                    "fecha_real_fin": "La fecha de fin debe ser posterior a la fecha de inicio"
                })
        return data


class LoteEtapaSerializer(serializers.ModelSerializer):
    """Serializer de etapas de lote"""

    lote_codigo = serializers.CharField(source="lote.codigo_lote", read_only=True)
    etapa_nombre = serializers.CharField(source="etapa.nombre", read_only=True)
    maquina_nombre = serializers.CharField(source="maquina.nombre", read_only=True)
    operario_nombre = serializers.CharField(source="operario.get_full_name", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = LoteEtapa
        fields = [
            "id",
            "lote",
            "lote_codigo",
            "etapa",
            "etapa_nombre",
            "orden",
            "maquina",
            "maquina_nombre",
            "estado",
            "estado_display",
            "fecha_inicio",
            "fecha_fin",
            "duracion_minutos",
            "operario",
            "operario_nombre",
            "cantidad_entrada",
            "cantidad_salida",
            "cantidad_merma",
            "porcentaje_rendimiento",
            "observaciones",
        ]
        read_only_fields = ["id", "duracion_minutos", "porcentaje_rendimiento"]



