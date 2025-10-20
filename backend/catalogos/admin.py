"""Admin de catálogos minimalista."""

from django import forms
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


class FormulaAdminForm(forms.ModelForm):
    class Meta:
        model = Formula
        fields = "__all__"
        widgets = {
            "ingredientes": forms.Textarea(
                attrs={"rows": 8, "style": "font-family: monospace"}
            ),
            "etapas": forms.Textarea(
                attrs={"rows": 8, "style": "font-family: monospace"}
            ),
        }


@admin.register(Formula)
class FormulaAdmin(admin.ModelAdmin):
    form = FormulaAdminForm
    list_display = ('codigo', 'version', 'producto', 'activa')
    search_fields = ('codigo', 'producto__nombre')
    list_filter = ('activa',)
    raw_id_fields = ('producto',)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    'codigo',
                    'version',
                    'producto',
                    'descripcion',
                    'activa',
                    'ingredientes',
                    'etapas',
                )
            },
        ),
    )


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