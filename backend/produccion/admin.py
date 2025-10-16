"""Admin site configuration for Producción domain"""

from django.contrib import admin

from backend.produccion.models import Lote, LoteEtapa
from backend.eventos.models import RegistroProduccion as OriginalRegistroProduccion


class LoteEtapaInline(admin.TabularInline):
    model = LoteEtapa
    extra = 0
    readonly_fields = ['duracion_minutos', 'porcentaje_rendimiento']


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ['codigo_lote', 'producto', 'estado', 'cantidad_producida', 'fecha_real_inicio', 'supervisor']
    list_filter = ['estado', 'prioridad', 'fecha_creacion', 'turno']
    search_fields = ['codigo_lote', 'producto__nombre']
    date_hierarchy = 'fecha_creacion'
    readonly_fields = ['fecha_creacion', 'creado_por']
    inlines = [LoteEtapaInline]

    def save_model(self, request, obj, form, change):
        if not change:
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(LoteEtapa)
class LoteEtapaAdmin(admin.ModelAdmin):
    list_display = ['lote', 'etapa', 'orden', 'maquina', 'estado', 'operario', 'duracion_minutos']
    list_filter = ['estado', 'etapa', 'maquina']
    search_fields = ['lote__codigo_lote']
    readonly_fields = ['duracion_minutos', 'porcentaje_rendimiento']


class RegistroProduccion(OriginalRegistroProduccion):
    class Meta:
        proxy = True
        app_label = 'produccion'
        verbose_name = OriginalRegistroProduccion._meta.verbose_name
        verbose_name_plural = OriginalRegistroProduccion._meta.verbose_name_plural


@admin.register(RegistroProduccion)
class RegistroProduccionAdmin(admin.ModelAdmin):
    list_display = ['fecha_produccion', 'registrado_por', 'turno', 'maquina', 'producto', 'cantidad_producida']
    list_filter = ['fecha_produccion', 'turno', 'maquina', 'producto', 'unidad_medida']
    search_fields = ['maquina__codigo', 'producto__nombre', 'registrado_por__username']
    date_hierarchy = 'fecha_produccion'

