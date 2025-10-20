"""
Admin de catalogos
"""
from django.contrib import admin
from .models import (
    Ubicacion,
    Maquina,
    Producto,
    Formula,
    EtapaProduccion,
    Turno,
    Funcion,
    Parametro,
)


@admin.register(Parametro)
class ParametroAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "unidad", "activo")
    search_fields = ("codigo", "nombre", "unidad")
    list_filter = ("activo",)


@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'activa')
    search_fields = ('codigo', 'nombre')
    list_filter = ('activa',)


@admin.register(Funcion)
class FuncionAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "activa")
    search_fields = ("codigo", "nombre")
    list_filter = ("activa",)


@admin.register(Maquina)
class MaquinaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'tipo', 'ubicacion', 'activa')
    search_fields = ('codigo', 'nombre', 'fabricante', 'modelo')
    list_filter = ('tipo', 'activa')
    raw_id_fields = ('ubicacion',)


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'tipo', 'presentacion', 'concentracion', 'activo')
    search_fields = ('codigo', 'nombre')
    list_filter = ('tipo', 'presentacion', 'activo')


@admin.register(Formula)
class FormulaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'version', 'producto', 'tamaño_lote', 'unidad', 'activa', 'aprobada')
    search_fields = ('codigo', 'producto__nombre')
    list_filter = ('activa', 'aprobada')
    raw_id_fields = ('producto',)


@admin.register(EtapaProduccion)
class EtapaProduccionAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "activa")
    search_fields = ("codigo", "nombre")
    list_filter = ("activa",)
    filter_horizontal = ("maquinas_permitidas", "parametros")
    fieldsets = (
        (None, {"fields": ("codigo", "nombre", "activa")}),
        ("Definición", {"fields": ("descripcion", "maquinas_permitidas")}),
        ("Parámetros", {"fields": ("parametros",)}),
    )


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'hora_inicio', 'hora_fin', 'activo')
    search_fields = ('nombre',)
    list_filter = ('activo',)