"""Serializadores del dominio de catálogos."""

from django.apps import apps
from django.db import transaction
from rest_framework import serializers

Funcion = apps.get_model("catalogos", "Funcion")
Ubicacion = apps.get_model("catalogos", "Ubicacion")
Parametro = apps.get_model("catalogos", "Parametro")
Maquina = apps.get_model("catalogos", "Maquina")
MaquinaAttachment = apps.get_model("catalogos", "MaquinaAttachment")
Producto = apps.get_model("catalogos", "Producto")
Formula = apps.get_model("catalogos", "Formula")
FormulaEtapa = apps.get_model("catalogos", "FormulaEtapa")
FormulaIngrediente = apps.get_model("catalogos", "FormulaIngrediente")
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
        ]
        read_only_fields = ["id", "tipo_display", "presentacion_display"]


class FormulaIngredienteSerializer(serializers.ModelSerializer):
    """Serializer explícito para los ingredientes de una fórmula."""

    material_nombre = serializers.CharField(source="material.nombre", read_only=True)

    class Meta:
        model = FormulaIngrediente
        fields = [
            "id",
            "material",
            "material_nombre",
            "cantidad",
            "unidad",
            "orden",
            "notas",
        ]
        read_only_fields = ["id", "material_nombre"]


class FormulaEtapaSerializer(serializers.ModelSerializer):
    """Serializer para las etapas configuradas dentro de una fórmula."""

    etapa_nombre = serializers.CharField(source="etapa.nombre", read_only=True)

    class Meta:
        model = FormulaEtapa
        fields = [
            "id",
            "etapa",
            "etapa_nombre",
            "orden",
            "descripcion",
            "duracion_estimada_min",
        ]
        read_only_fields = ["id", "etapa_nombre"]


class FormulaSerializer(serializers.ModelSerializer):
    """Fórmulas con detalle de ingredientes y etapas persistidas."""

    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    ingredientes = FormulaIngredienteSerializer(many=True, required=False)
    etapas = FormulaEtapaSerializer(
        many=True,
        source="relaciones_etapas",
        required=False,
    )

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

    def validate(self, attrs):
        producto = attrs.get("producto") or getattr(self.instance, "producto", None)
        ingredientes = self.initial_data.get("ingredientes") or []
        for index, item in enumerate(ingredientes):
            material_id = item.get("material") or item.get("material_id")
            if not material_id:
                raise serializers.ValidationError(
                    {"ingredientes": f"Ingrediente {index}: falta material"}
                )
            if not Producto.objects.filter(pk=material_id).exists():
                raise serializers.ValidationError(
                    {"ingredientes": f"Ingrediente {index}: material inexistente"}
                )
            cantidad = item.get("cantidad")
            if cantidad is None:
                raise serializers.ValidationError(
                    {"ingredientes": f"Ingrediente {index}: falta cantidad"}
                )
            try:
                if float(cantidad) <= 0:
                    raise ValueError
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {"ingredientes": f"Ingrediente {index}: cantidad debe ser positiva"}
                )
            unidad = item.get("unidad", "").strip()
            if not unidad:
                raise serializers.ValidationError(
                    {"ingredientes": f"Ingrediente {index}: falta unidad"}
                )
            if producto and getattr(producto, "id", None) == material_id:
                continue
        return super().validate(attrs)

    def create(self, validated_data):
        ingredientes_data = validated_data.pop("ingredientes", [])
        etapas_data = validated_data.pop("relaciones_etapas", [])
        with transaction.atomic():
            formula = super().create(validated_data)
            self._replace_ingredientes(formula, ingredientes_data)
            self._replace_etapas(formula, etapas_data)
        return formula

    def update(self, instance, validated_data):
        ingredientes_data = validated_data.pop("ingredientes", None)
        etapas_data = validated_data.pop("relaciones_etapas", None)
        with transaction.atomic():
            formula = super().update(instance, validated_data)
            if ingredientes_data is not None:
                self._replace_ingredientes(formula, ingredientes_data)
            if etapas_data is not None:
                self._replace_etapas(formula, etapas_data)
        return formula

    def _replace_ingredientes(self, formula, ingredientes_data):
        formula.ingredientes.all().delete()
        for index, item in enumerate(ingredientes_data):
            material_value = item.get("material") or item.get("material_id")
            material_id = getattr(material_value, "id", material_value)
            FormulaIngrediente.objects.create(
                formula=formula,
                material_id=material_id,
                cantidad=item.get("cantidad"),
                unidad=item.get("unidad"),
                orden=item.get("orden", index),
                notas=item.get("notas", ""),
            )

    def _replace_etapas(self, formula, etapas_data):
        formula.relaciones_etapas.all().delete()
        for index, item in enumerate(etapas_data):
            etapa_value = item.get("etapa") or item.get("etapa_id")
            etapa_id = getattr(etapa_value, "id", etapa_value)
            FormulaEtapa.objects.create(
                formula=formula,
                etapa_id=etapa_id,
                orden=item.get("orden", index),
                descripcion=item.get("descripcion", ""),
                duracion_estimada_min=item.get("duracion_estimada_min")
                or item.get("duracion_min"),
            )


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