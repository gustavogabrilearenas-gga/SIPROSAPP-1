"""Admin de catálogos minimalista."""

from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Ubicacion,
    Maquina,
    MaquinaAttachment,
    Producto,
    ProductoAttachment,
    Formula,
    FormulaEtapa,
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
    list_filter = ('activa',)
    search_fields = ['codigo', 'nombre']  # Necesario para autocomplete
    ordering = ['codigo']  # Ordenamiento por defecto en búsquedas
    search_fields = ['codigo', 'nombre']  # Necesario para autocomplete
    ordering = ['codigo']  # Ordenamiento por defecto en búsquedas


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
    autocomplete_fields = ['ubicacion']
    
    fieldsets = (
        (None, {
            'fields': (
                'codigo', 
                'nombre', 
                'tipo',
                'ubicacion',
                'activa'
            )
        }),
        ('Detalles del Equipo', {
            'fields': (
                'fabricante',
                'modelo',
                'numero_serie',
                'año_fabricacion',
                'fecha_instalacion'
            ),
        }),
        ('Características', {
            'fields': (
                'descripcion',
                'capacidad_nominal',
                'unidad_capacidad',
                'imagen'
            ),
        }),
    )


class ProductoAttachmentForm(forms.ModelForm):
    class Meta:
        model = ProductoAttachment
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


class ProductoAttachmentInline(admin.TabularInline):
    model = ProductoAttachment
    form = ProductoAttachmentForm
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


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    inlines = [ProductoAttachmentInline]
    list_display = ('codigo', 'nombre', 'tipo', 'presentacion', 'concentracion', 'activo')
    search_fields = ('codigo', 'nombre')
    list_filter = ('tipo', 'presentacion', 'activo')
    fieldsets = (
        (None, {
            'fields': (
                'codigo',
                'nombre',
                'tipo',
                'presentacion',
                'concentracion',
                'activo'
            )
        }),
        ('Detalles', {
            'fields': (
                'descripcion',
                'imagen'
            ),
        }),
    )


from .widgets import JSONEditorWidget

class FormulaEtapaInline(admin.TabularInline):
    model = FormulaEtapa
    extra = 1
    fields = ('etapa', 'orden', 'duracion_min', 'descripcion')
    autocomplete_fields = ['etapa']
    min_num = 1
    ordering = ['orden']


@admin.register(Formula)
class FormulaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'version', 'producto', 'activa')
    search_fields = ('codigo', 'version', 'producto__nombre')
    list_filter = ('activa', 'producto')
    raw_id_fields = ('producto',)
    inlines = [FormulaEtapaInline]
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

    def get_search_results(self, request, queryset, search_term):
        """Mejorar la búsqueda para el campo autocomplete"""
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        if search_term:
            queryset |= self.model.objects.filter(activa=True, nombre__icontains=search_term)
        return queryset, use_distinct


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'hora_inicio', 'hora_fin', 'activo')
    search_fields = ('nombre',)
    list_filter = ('activo',)