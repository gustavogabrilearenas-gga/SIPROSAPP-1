"""Serializers del dominio de Producción"""

from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from backend.core.permissions import is_admin, is_calidad, is_operario, is_supervisor

from backend.produccion.models import Lote, LoteEtapa, RegistroProduccion


def _obtener_unidad_producto(producto):
    """Intenta obtener la unidad asociada al producto."""

    if producto is None:
        return None

    posibles_atributos = (
        "unidad_medida",
        "unidad",
        "unidad_produccion",
    )

    for atributo in posibles_atributos:
        if hasattr(producto, atributo):
            valor = getattr(producto, atributo)
            if callable(valor):
                valor = valor()
            if valor:
                return valor

    formulas_rel = getattr(producto, "formulas", None)
    if formulas_rel is not None and hasattr(formulas_rel, "order_by"):
        primera_formula = formulas_rel.order_by("id").first()
    elif formulas_rel is not None and hasattr(formulas_rel, "first"):
        primera_formula = formulas_rel.first()
    else:
        primera_formula = None

    if primera_formula is not None:
        unidad_formula = getattr(primera_formula, "unidad", None)
        if unidad_formula:
            return unidad_formula

    return None


def _obtener_fechas_reales_lote(lote):
    """Obtiene y cachea las fechas reales calculadas del lote."""

    cache_attr = "_fechas_reales_cache"
    if not hasattr(lote, cache_attr):
        agregados = lote.obtener_agregados_etapas()
        setattr(
            lote,
            cache_attr,
            {
                "fecha_inicio": agregados.get("fecha_inicio"),
                "fecha_fin": agregados.get("fecha_fin"),
            },
        )
    return getattr(lote, cache_attr)


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
        read_only_fields = ["fecha_registro", "registrado_por", "hora_inicio", "hora_fin"]
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

        producto = data.get("producto")
        if self.instance is not None and producto is None:
            producto = self.instance.producto

        unidad_medida = _obtener_unidad_producto(producto)
        if unidad_medida:
            data["unidad_medida"] = unidad_medida
        elif self.instance is not None and getattr(self.instance, "unidad_medida", None):
            data["unidad_medida"] = self.instance.unidad_medida
        else:
            raise serializers.ValidationError(
                {"producto": "El producto no tiene una unidad de producción configurada."}
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        unidad_producto = _obtener_unidad_producto(getattr(instance, "producto", None))
        if unidad_producto:
            data["unidad_medida"] = unidad_producto
        return data


class LoteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de lotes"""

    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    prioridad_display = serializers.CharField(source="get_prioridad_display", read_only=True)
    supervisor_nombre = serializers.CharField(source="supervisor.get_full_name", read_only=True)
    rendimiento_porcentaje = serializers.ReadOnlyField()
    rendimiento = serializers.ReadOnlyField(source="rendimiento_porcentaje")
    fecha_real_inicio = serializers.SerializerMethodField()
    fecha_real_fin = serializers.SerializerMethodField()
    unidad = serializers.SerializerMethodField()

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
        read_only_fields = tuple(fields)

    def get_fecha_real_inicio(self, obj):
        return _obtener_fechas_reales_lote(obj)["fecha_inicio"]

    def get_fecha_real_fin(self, obj):
        return _obtener_fechas_reales_lote(obj)["fecha_fin"]

    def get_unidad(self, obj):
        return _obtener_unidad_producto(getattr(obj, "producto", None)) or getattr(obj, "unidad", None)


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
    fecha_real_inicio = serializers.SerializerMethodField()
    fecha_real_fin = serializers.SerializerMethodField()
    unidad = serializers.SerializerMethodField()

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
        read_only_fields = [
            "id",
            "fecha_creacion",
            "creado_por",
            "cancelado_por",
            "fecha_cancelacion",
            "cantidad_producida",
            "fecha_real_inicio",
            "fecha_real_fin",
            "estado",
            "unidad",
        ]

    def get_fecha_real_inicio(self, obj):
        return _obtener_fechas_reales_lote(obj)["fecha_inicio"]

    def get_fecha_real_fin(self, obj):
        return _obtener_fechas_reales_lote(obj)["fecha_fin"]

    def get_unidad(self, obj):
        return _obtener_unidad_producto(getattr(obj, "producto", None)) or getattr(obj, "unidad", None)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if not request:
            return

        user = request.user
        if not getattr(user, "is_authenticated", False):
            return

        es_admin = is_admin(user)
        es_supervisor = is_supervisor(user)

        if is_operario(user) and not (es_admin or es_supervisor):
            campos_bloqueados = {
                "estado",
                "unidad",
                "fecha_planificada_inicio",
                "fecha_planificada_fin",
                "fecha_real_inicio",
                "fecha_real_fin",
                "cantidad_planificada",
                "cantidad_producida",
                "cantidad_rechazada",
                "rendimiento",
                "visible",
                "prioridad",
                "supervisor",
                "cancelado_por",
                "fecha_cancelacion",
                "motivo_cancelacion",
            }

            for field_name in campos_bloqueados:
                field = self.fields.get(field_name)
                if field is not None:
                    field.read_only = True

    def validate(self, data):
        """Validaciones de negocio"""
        if "estado" in getattr(self, "initial_data", {}):
            raise serializers.ValidationError(
                {
                    "estado": "El estado solo puede modificarse mediante las acciones de flujo definidas.",
                }
            )
        if data.get("fecha_real_fin") and data.get("fecha_real_inicio"):
            if data["fecha_real_fin"] < data["fecha_real_inicio"]:
                raise serializers.ValidationError({
                    "fecha_real_fin": "La fecha de fin debe ser posterior a la fecha de inicio"
                })
        return data

    def _resolver_unidad(self, producto, formula):
        unidad_producto = _obtener_unidad_producto(producto)
        if unidad_producto:
            return unidad_producto
        if formula is not None and getattr(formula, "unidad", None):
            return formula.unidad
        return getattr(producto, "unidad", None) or getattr(self.instance, "unidad", "")

    def create(self, validated_data):
        producto = validated_data.get("producto")
        formula = validated_data.get("formula")
        validated_data["unidad"] = self._resolver_unidad(producto, formula)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        producto = validated_data.get("producto", instance.producto)
        formula = validated_data.get("formula", instance.formula)
        validated_data["unidad"] = self._resolver_unidad(producto, formula)
        return super().update(instance, validated_data)


class LoteEtapaSerializer(serializers.ModelSerializer):
    """Serializer de etapas de lote"""

    lote_codigo = serializers.CharField(source="lote.codigo_lote", read_only=True)
    etapa_nombre = serializers.CharField(source="etapa.nombre", read_only=True)
    maquina_nombre = serializers.CharField(source="maquina.nombre", read_only=True)
    operario_nombre = serializers.CharField(source="operario.get_full_name", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    parametros_registrados = serializers.JSONField(
        required=False,
        default=list,
        help_text=(
            "Lista de parámetros registrados: "
            '[{"nombre": "...", "valor": "...", "unidad": "...", "conforme": true}]'
        ),
        style={
            "base_template": "textarea.html",
            "rows": 4,
            "placeholder": '[{"nombre": "...", "valor": "...", "unidad": "...", "conforme": true}]',
        },
    )

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
            "parametros_registrados",
            "observaciones",
            "requiere_aprobacion_calidad",
            "aprobada_por_calidad",
            "fecha_aprobacion_calidad",
        ]
        read_only_fields = [
            "id",
            "duracion_minutos",
            "porcentaje_rendimiento",
            "cantidad_merma",
            "estado",
            "fecha_inicio",
            "fecha_fin",
            "requiere_aprobacion_calidad",
        ]


    def __init__(self, *args, **kwargs):
        self._validation_warnings = []
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if not request:
            return

        user = request.user
        if not getattr(user, "is_authenticated", False):
            return

        es_supervisor = is_supervisor(user)
        es_calidad = is_calidad(user)

        puede_gestionar_aprobacion = es_supervisor or es_calidad

        if not puede_gestionar_aprobacion:
            for field_name in ["aprobada_por_calidad", "fecha_aprobacion_calidad"]:
                self.fields.pop(field_name, None)
        else:
            fecha_field = self.fields.get("fecha_aprobacion_calidad")
            if fecha_field is not None:
                fecha_field.read_only = True

    def _resolver_etapa(self, attrs):
        if "etapa" in attrs:
            return attrs["etapa"]
        if self.instance is not None:
            return getattr(self.instance, "etapa", None)
        return None

    def _obtener_parametros_catalogo(self, etapa):
        parametros = getattr(etapa, "parametros", None) or []
        nombres = set()
        for parametro in parametros:
            if not isinstance(parametro, dict):
                continue
            nombre = parametro.get("nombre")
            if isinstance(nombre, str):
                nombre_normalizado = nombre.strip()
                if nombre_normalizado:
                    nombres.add(nombre_normalizado)
        return nombres

    def add_warning(self, *, field, message):
        """Registra advertencias de validación no bloqueantes."""

        self._validation_warnings.append({"field": field, "message": message})

    @property
    def warnings(self):
        """Lista de advertencias generadas durante la validación."""

        return list(self._validation_warnings)

    def _calcular_cantidades(self):
        """Calcula cantidad_merma y porcentaje_rendimiento antes de guardar."""

        if not hasattr(self, "validated_data"):
            return

        datos = self.validated_data

        entrada = datos.get("cantidad_entrada")
        salida = datos.get("cantidad_salida")

        if entrada is None and self.instance is not None:
            entrada = self.instance.cantidad_entrada
        if salida is None and self.instance is not None:
            salida = self.instance.cantidad_salida

        if entrada is None or salida is None:
            datos["cantidad_merma"] = Decimal("0")
            datos["porcentaje_rendimiento"] = None
            return

        entrada_decimal = Decimal(str(entrada))
        salida_decimal = Decimal(str(salida))

        merma = entrada_decimal - salida_decimal
        if merma < Decimal("0"):
            merma = Decimal("0")
            self.add_warning(
                field="cantidad_merma",
                message=(
                    "La cantidad de salida supera a la entrada. La merma fue ajustada a 0."
                ),
            )

        if entrada_decimal > Decimal("0"):
            rendimiento = (salida_decimal / entrada_decimal) * Decimal("100")
            rendimiento = rendimiento.quantize(Decimal("0.01"))
        else:
            rendimiento = None

        datos["cantidad_merma"] = merma.quantize(Decimal("0.01"))
        datos["porcentaje_rendimiento"] = rendimiento

    def save(self, **kwargs):
        self._calcular_cantidades()
        return super().save(**kwargs)

    def validate(self, attrs):
        errors = {}

        if "estado" in getattr(self, "initial_data", {}):
            errors["estado"] = "El estado solo puede modificarse mediante las acciones de flujo definidas."

        etapa = self._resolver_etapa(attrs)
        parametros_registrados = attrs.get("parametros_registrados", serializers.empty)
        if parametros_registrados is serializers.empty:
            if self.instance is not None:
                parametros_registrados = getattr(self.instance, "parametros_registrados", []) or []
            else:
                parametros_registrados = []

        if parametros_registrados and etapa is not None:
            if not isinstance(parametros_registrados, (list, tuple)):
                errors["parametros_registrados"] = "El campo debe ser una lista de parámetros."  # pragma: no cover
            else:
                nombres_definidos = self._obtener_parametros_catalogo(etapa)
                for parametro in parametros_registrados:
                    if not isinstance(parametro, dict):
                        errors["parametros_registrados"] = (
                            "Cada parámetro registrado debe ser un objeto con al menos la clave 'nombre'."
                        )
                        break

                    nombre_original = parametro.get("nombre")
                    nombre_normalizado = nombre_original.strip() if isinstance(nombre_original, str) else None

                    if not nombre_normalizado:
                        errors["parametros_registrados"] = (
                            "Cada parámetro registrado debe incluir un nombre válido."
                        )
                        break

                    if nombre_normalizado not in nombres_definidos:
                        errors["parametros_registrados"] = (
                            f'El parámetro "{nombre_original}" no está definido en el catálogo de la etapa.'
                        )
                        break

        if errors:
            raise serializers.ValidationError(errors)

        return super().validate(attrs)

    def _actualizar_aprobacion_calidad(self, instance, aprobacion):
        if aprobacion is serializers.empty:
            return instance

        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        puede_aprobar = bool(
            user
            and getattr(user, "is_authenticated", False)
            and (is_supervisor(user) or is_calidad(user))
        )

        if aprobacion is None:
            campos_a_actualizar = []
            if instance.aprobada_por_calidad_id is not None:
                instance.aprobada_por_calidad = None
                campos_a_actualizar.append("aprobada_por_calidad")
            if instance.fecha_aprobacion_calidad is not None:
                instance.fecha_aprobacion_calidad = None
                campos_a_actualizar.append("fecha_aprobacion_calidad")
            if campos_a_actualizar:
                instance.save(update_fields=campos_a_actualizar)
            return instance

        if not puede_aprobar:
            return instance

        aprobador = user if puede_aprobar else aprobacion

        campos_a_actualizar = []
        if instance.aprobada_por_calidad_id != getattr(aprobador, "id", None):
            instance.aprobada_por_calidad = aprobador
            campos_a_actualizar.append("aprobada_por_calidad")

        instance.fecha_aprobacion_calidad = timezone.now()
        campos_a_actualizar.append("fecha_aprobacion_calidad")

        if campos_a_actualizar:
            instance.save(update_fields=list(dict.fromkeys(campos_a_actualizar)))

        return instance

    def create(self, validated_data):
        aprobacion = validated_data.pop("aprobada_por_calidad", serializers.empty)
        validated_data.pop("fecha_aprobacion_calidad", None)
        instance = super().create(validated_data)
        return self._actualizar_aprobacion_calidad(instance, aprobacion)

    def update(self, instance, validated_data):
        aprobacion = validated_data.pop("aprobada_por_calidad", serializers.empty)
        validated_data.pop("fecha_aprobacion_calidad", None)
        instance = super().update(instance, validated_data)
        return self._actualizar_aprobacion_calidad(instance, aprobacion)



