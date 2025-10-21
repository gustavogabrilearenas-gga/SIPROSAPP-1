from django.contrib import admin
from django.contrib import messages
from django.db import transaction
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import RegistroProduccion, RegistroProduccionEtapa


class RegistroProduccionEtapaInline(admin.TabularInline):
    model = RegistroProduccionEtapa
    extra = 0
    min_num = 0
    can_delete = False
    fields = [
        'etapa',
        'maquina',
        'hora_inicio',
        'hora_fin',
        'duracion_real',
        'cantidad',
        'unidad',
        'completada',
        'observaciones'
    ]
    readonly_fields = ['etapa', 'duracion_real']
    autocomplete_fields = ['maquina']

    def get_max_num(self, request, obj=None, **kwargs):
        if obj:
            return obj.etapas.count()
        return 0

    def has_add_permission(self, request, obj=None):
        return False
        
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        # Personalizar el título del inline
        if obj:
            formset.verbose_name_plural = mark_safe(
                '<strong>Etapas de producción</strong> - Complete los datos de cada etapa'
            )
        return formset


@admin.register(RegistroProduccion)
class RegistroProduccionAdmin(admin.ModelAdmin):
    list_display = [
        "producto",
        "formula",
        "estado",
        "progreso_etapas",
        "registrado_por",
        "fecha_registro",
    ]
    list_filter = ["estado", "producto", "registrado_por"]
    search_fields = ["producto__nombre", "observaciones", "formula__codigo"]
    readonly_fields = ["fecha_registro", "registrado_por", "estado"]
    inlines = [RegistroProduccionEtapaInline]
    
    def progreso_etapas(self, obj):
        if obj.estado == 'CREADO':
            return "Pendiente de iniciar"
        
        total = obj.etapas.count()
        if total == 0:
            return "-"
        
        completadas = obj.etapas.filter(completada=True).count()
        porcentaje = (completadas / total) * 100
        
        color = "#92D050" if porcentaje == 100 else "#FFC000"
        return format_html(
            '<div style="width:100px; border:1px solid #ccc; background-color: #f8f9fa;">'
            '<div style="width:{}%; background-color:{}; padding:2px;">'
            '{:.0f}% ({}/{})</div></div>',
            porcentaje, color, porcentaje, completadas, total
        )
    progreso_etapas.short_description = "Progreso"

    def save_model(self, request, obj, form, change):
        # Solo para registros nuevos
        if not change:
            obj.registrado_por = request.user
        
        super().save_model(request, obj, form, change)

        # Si es un registro nuevo, crear las etapas
        if not change:
            try:
                with transaction.atomic():
                    for formula_etapa in obj.formula.etapas.through.objects.filter(
                        formula=obj.formula
                    ).select_related('etapa'):
                        RegistroProduccionEtapa.objects.create(
                            registro=obj,
                            etapa=formula_etapa
                        )
                    messages.success(
                        request, 
                        mark_safe(
                            'Se han creado las etapas según la fórmula seleccionada.<br>'
                            'Puede proceder a completar los datos de cada etapa.'
                        )
                    )
            except Exception as e:
                messages.error(
                    request,
                    f'Error al crear las etapas: {str(e)}'
                )

    def get_readonly_fields(self, request, obj=None):
        if obj:
            # Una vez creado el registro, no se pueden cambiar producto ni fórmula
            return self.readonly_fields + ['formula', 'producto']
        return self.readonly_fields

    def get_fieldsets(self, request, obj=None):
        if not obj:
            # Formulario de creación - solo producto y fórmula
            return (
                (None, {
                    'description': mark_safe(
                        '<div class="help">'
                        'Seleccione el producto y la fórmula para iniciar el registro de producción.<br>'
                        'Una vez creado, podrá completar los datos de cada etapa individualmente.'
                        '</div>'
                    ),
                    'fields': (
                        'producto',
                        'formula',
                        'observaciones'
                    )
                }),
            )
        else:
            # Formulario de edición - muestra el estado y observaciones
            return (
                (None, {
                    'fields': (
                        'producto',
                        'formula',
                        'estado',
                        'observaciones'
                    )
                }),
            )