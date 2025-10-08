"""Serializers del dominio de Inventario"""

from rest_framework import serializers

from backend.inventario.models import (
    Insumo,
    LoteInsumo,
    Repuesto,
    ProductoTerminado,
    MovimientoInventario,
)


class InsumoSerializer(serializers.ModelSerializer):
    """Serializer de insumos"""

    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    stock_disponible = serializers.ReadOnlyField(source='stock_actual')

    class Meta:
        model = Insumo
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_nombre',
            'unidad_medida', 'stock_minimo', 'stock_maximo', 'punto_reorden',
            'stock_disponible', 'activo'
        ]
        read_only_fields = ['id']


class LoteInsumoSerializer(serializers.ModelSerializer):
    """Serializer de lotes de insumo"""

    insumo_nombre = serializers.CharField(source='insumo.nombre', read_only=True)
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    dias_vencimiento = serializers.ReadOnlyField(source='dias_para_vencimiento')

    class Meta:
        model = LoteInsumo
        fields = [
            'id', 'insumo', 'insumo_nombre', 'codigo_lote_proveedor',
            'fecha_recepcion', 'fecha_vencimiento', 'dias_vencimiento',
            'cantidad_inicial', 'cantidad_actual', 'unidad',
            'ubicacion', 'ubicacion_nombre', 'ubicacion_detalle',
            'estado', 'estado_display', 'proveedor'
        ]
        read_only_fields = ['id']


class RepuestoSerializer(serializers.ModelSerializer):
    """Serializer de repuestos"""

    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)

    class Meta:
        model = Repuesto
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_display',
            'stock_minimo', 'stock_actual', 'punto_reorden',
            'ubicacion', 'ubicacion_nombre', 'critico', 'activo'
        ]
        read_only_fields = ['id']


class ProductoTerminadoSerializer(serializers.ModelSerializer):
    """Serializer de productos terminados"""

    lote_codigo = serializers.CharField(source='lote.codigo_lote', read_only=True)
    producto_nombre = serializers.CharField(source='lote.producto.nombre', read_only=True)
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = ProductoTerminado
        fields = [
            'id', 'lote', 'lote_codigo', 'producto_nombre',
            'cantidad', 'unidad', 'fecha_fabricacion', 'fecha_vencimiento',
            'ubicacion', 'ubicacion_nombre', 'ubicacion_detalle',
            'estado', 'estado_display'
        ]
        read_only_fields = ['id']


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    """Serializer de movimientos de inventario"""

    tipo_item_display = serializers.CharField(source='get_tipo_item_display', read_only=True)
    tipo_movimiento_display = serializers.CharField(source='get_tipo_movimiento_display', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'tipo_item', 'tipo_item_display', 'item_id', 'lote_item_id',
            'tipo_movimiento', 'tipo_movimiento_display', 'motivo', 'cantidad',
            'unidad', 'ubicacion_origen', 'ubicacion_destino',
            'referencia_documento', 'fecha_movimiento', 'registrado_por', 'observaciones'
        ]
        read_only_fields = ['id', 'fecha_movimiento']
