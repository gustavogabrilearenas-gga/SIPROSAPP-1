"""Serializadores del dominio de catálogos."""

from django.apps import apps
from rest_framework import serializers

Funcion = apps.get_model("catalogos", "Funcion")
Ubicacion = apps.get_model("catalogos", "Ubicacion")
Parametro = apps.get_model("catalogos", "Parametro")
Maquina = apps.get_model("catalogos", "Maquina")
MaquinaAttachment = apps.get_model("catalogos", "MaquinaAttachment")
Producto = apps.get_model("catalogos", "Producto")
Formula = apps.get_model("catalogos", "Formula")
EtapaProduccion = apps.get_model("catalogos", "EtapaProduccion")
Turno = apps.get_model("catalogos", "Turno")


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
            "fecha_instalacion",
            "imagen",
            "documentos",
        ]
        read_only_fields = ["id", "ubicacion_nombre", "tipo_display"]


class MaquinaAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = MaquinaAttachment
        fields = [
            "id",
            "maquina",
            "nombre",
            "descripcion",
            "url",
            "content_type",
            "tamano_bytes",
            "creado",
            "subido_por",
            "archivo",
        ]
        read_only_fields = [
            "url",
            "content_type",
            "tamano_bytes",
            "creado",
            "subido_por",
        ]

    def get_url(self, obj):
        return obj.archivo.url if obj.archivo else None


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
            "activa",
            "ingredientes",
            "etapas",
        ]
        read_only_fields = ["id", "producto_nombre"]

    def validate_ingredientes(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Debe ser una lista.")
        for indice, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"Item {indice} debe ser objeto.")
            for clave in ("material_id", "cantidad", "unidad"):
                if clave not in item:
                    raise serializers.ValidationError(f"Item {indice}: falta '{clave}'.")
            material_id = item["material_id"]
            cantidad = item["cantidad"]
            unidad = item["unidad"]
            if not isinstance(material_id, int) or material_id <= 0:
                raise serializers.ValidationError(
                    f"Item {indice}: material_id inválido."
                )
            if not (
                isinstance(cantidad, (int, float))
                and not isinstance(cantidad, bool)
                and cantidad > 0
            ):
                raise serializers.ValidationError(
                    f"Item {indice}: cantidad > 0 requerida."
                )
            if not isinstance(unidad, str) or not unidad.strip():
                raise serializers.ValidationError(
                    f"Item {indice}: unidad requerida."
                )
            if not Producto.objects.filter(pk=material_id).exists():
                raise serializers.ValidationError(
                    f"Item {indice}: material_id no existe."
                )
        return value

    def validate_etapas(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Debe ser una lista.")
        for indice, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"Item {indice} debe ser objeto.")
            for clave in ("etapa_id", "duracion_min"):
                if clave not in item:
                    raise serializers.ValidationError(f"Item {indice}: falta '{clave}'.")
            etapa_id = item["etapa_id"]
            duracion_min = item["duracion_min"]
            descripcion = item.get("descripcion")
            if not isinstance(etapa_id, int) or etapa_id <= 0:
                raise serializers.ValidationError(
                    f"Item {indice}: etapa_id inválido."
                )
            if not (isinstance(duracion_min, int) and duracion_min >= 0):
                raise serializers.ValidationError(
                    f"Item {indice}: duracion_min >= 0 requerida."
                )
            if descripcion is not None and not isinstance(descripcion, str):
                raise serializers.ValidationError(
                    f"Item {indice}: descripcion debe ser string o null."
                )
            if not EtapaProduccion.objects.filter(pk=etapa_id).exists():
                raise serializers.ValidationError(
                    f"Item {indice}: etapa_id no existe."
                )
        return value


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