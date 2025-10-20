"""Serializadores del dominio de catálogos."""

from rest_framework import serializers

from .models import (
    EtapaProduccion,
    Formula,
    Maquina,
    Parametro,
    Producto,
    Turno,
    Ubicacion,
    Funcion,
)


class UbicacionSerializer(serializers.ModelSerializer):
    """Ubicaciones con contador de máquinas asociadas."""

    maquinas_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ubicacion
        fields = [
            "id",
            "codigo",
            "nombre",
            "descripcion",
            "planta",
            "activa",
            "maquinas_count",
        ]
        read_only_fields = ["id", "maquinas_count"]


class FuncionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcion
        fields = ["id", "codigo", "nombre", "descripcion", "activa"]


class ParametroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parametro
        fields = ["id", "codigo", "nombre", "descripcion", "unidad", "activo"]


class MaquinaSerializer(serializers.ModelSerializer):
    """Máquinas con datos derivados útiles para listados."""

    ubicacion_nombre = serializers.CharField(source="ubicacion.nombre", read_only=True)
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = Maquina
        fields = [
            "id",
            "codigo",
            "nombre",
            "tipo",
            "tipo_display",
            "fabricante",
            "modelo",
            "numero_serie",
            "año_fabricacion",
            "ubicacion",
            "ubicacion_nombre",
            "descripcion",
            "capacidad_nominal",
            "unidad_capacidad",
            "activa",
            "requiere_calificacion",
            "fecha_instalacion",
            "imagen",
            "documentos",
        ]
        read_only_fields = ["id", "ubicacion_nombre", "tipo_display"]


class ProductoSerializer(serializers.ModelSerializer):
    """Productos con etiquetas legibles para las opciones."""

    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    presentacion_display = serializers.CharField(source="get_presentacion_display", read_only=True)

    class Meta:
        model = Producto
        fields = [
            "id",
            "codigo",
            "nombre",
            "tipo",
            "tipo_display",
            "presentacion",
            "presentacion_display",
            "concentracion",
            "descripcion",
            "activo",
            "imagen",
            "documentos",
        ]
        read_only_fields = ["id", "tipo_display", "presentacion_display"]


class FormulaSerializer(serializers.ModelSerializer):
    """Fórmulas con descripción del producto relacionado."""

    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)

    class Meta:
        model = Formula
        fields = [
            "id",
            "codigo",
            "version",
            "producto",
            "producto_nombre",
            "descripcion",
            "tamaño_lote",
            "unidad",
            "tiempo_total",
            "activa",
            "aprobada",
            "ingredientes",
            "etapas",
        ]
        read_only_fields = ["id", "producto_nombre"]


class EtapaProduccionSerializer(serializers.ModelSerializer):
    """Etapas con detalle de máquinas permitidas."""

    maquinas_permitidas_nombres = serializers.SerializerMethodField()
    parametros = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Parametro.objects.filter(activo=True), required=False
    )
    parametros_nombres = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="nombre", source="parametros"
    )

    class Meta:
        model = EtapaProduccion
        fields = [
            "id",
            "codigo",
            "nombre",
            "descripcion",
            "maquinas_permitidas",
            "maquinas_permitidas_nombres",
            "activa",
            "parametros",
            "parametros_nombres",
        ]
        read_only_fields = ["id", "maquinas_permitidas_nombres", "parametros_nombres"]

    def get_maquinas_permitidas_nombres(self, obj):
        return [{"id": maquina.id, "nombre": str(maquina)} for maquina in obj.maquinas_permitidas.all()]


class TurnoSerializer(serializers.ModelSerializer):
    """Turnos con descripción auxiliar del nombre."""

    nombre_display = serializers.CharField(source="nombre", read_only=True)

    class Meta:
        model = Turno
        fields = [
            "id",
            "codigo",
            "nombre",
            "nombre_display",
            "hora_inicio",
            "hora_fin",
            "activo",
        ]
        read_only_fields = ["id", "nombre_display"]