"""Admin de catálogos minimalista."""

from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Ubicacion,
    Maquina,
    MaquinaAttachment,
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


class MaquinaAttachmentForm(forms.ModelForm):
    class Meta:
        model = MaquinaAttachment
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        self._request = kwargs.pop("_request", None)
        super().__init__(*args, **kwargs)

    def save(self, commit=True):
        instance = super().save(commit=False)
        request = self._request
        if (
            request
            and request.user.is_authenticated
            and (instance.pk is None or not instance.subido_por_id)
        ):
            instance.subido_por = request.user
        if instance.archivo and hasattr(instance.archivo, "size"):
            instance.tamano_bytes = instance.archivo.size
        if request:
            uploaded = request.FILES.get(self.add_prefix("archivo"))
            if uploaded and hasattr(uploaded, "content_type"):
                instance.content_type = uploaded.content_type
        if commit:
            instance.save()
            self.save_m2m()
        return instance


class MaquinaAttachmentInline(admin.TabularInline):
    model = MaquinaAttachment
    form = MaquinaAttachmentForm
    extra = 0
    fields = (
        "archivo",
        "link",
        "nombre",
        "descripcion",
        "content_type",
        "tamano_bytes",
        "creado",
        "subido_por",
    )
    readonly_fields = ("link", "content_type", "tamano_bytes", "creado", "subido_por")

    def link(self, obj):
        if obj.archivo:
            return format_html('<a href="{}" target="_blank">descargar/ver</a>', obj.archivo.url)
        return "-"

    link.short_description = "Archivo"

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        original_init = formset.form.__init__

        def __init__(form, *args, **kwargs):
            kwargs["_request"] = request
            original_init(form, *args, **kwargs)

        formset.form.__init__ = __init__
        return formset


@admin.register(Maquina)
class MaquinaAdmin(admin.ModelAdmin):
    inlines = [MaquinaAttachmentInline]
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
    search_fields = ('codigo', 'version', 'producto__nombre')
    list_filter = ('activa', 'producto')
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