"""Admin site configuration for Producción domain"""

from django.contrib import admin

from backend.core.permissions import is_admin, is_calidad, is_operario, is_supervisor

from backend.produccion.models import Lote, LoteEtapa, RegistroProduccion


class LoteEtapaInline(admin.TabularInline):
    model = LoteEtapa
    extra = 0
    readonly_fields = ['duracion_minutos', 'porcentaje_rendimiento', 'cantidad_merma']

    def get_readonly_fields(self, request, obj=None):
        fields = list(super().get_readonly_fields(request, obj))
        if is_operario(request.user) and not (
            is_admin(request.user) or is_supervisor(request.user)
        ):
            fields.append('estado')
        return tuple(dict.fromkeys(fields))


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

    def get_readonly_fields(self, request, obj=None):
        fields = list(super().get_readonly_fields(request, obj))
        if is_operario(request.user) and not (
            is_admin(request.user) or is_supervisor(request.user)
        ):
            fields.extend(
                [
                    'estado',
                    'supervisor',
                    'cancelado_por',
                    'fecha_cancelacion',
                    'motivo_cancelacion',
                    'visible',
                    'prioridad',
                    'cantidad_producida',
                    'fecha_real_inicio',
                    'fecha_real_fin',
                ]
            )
        return tuple(dict.fromkeys(fields))

    def get_exclude(self, request, obj=None):
        exclude = list(super().get_exclude(request, obj) or [])
        if is_operario(request.user) and not (
            is_admin(request.user) or is_supervisor(request.user)
        ):
            exclude.extend(
                [
                    'estado',
                    'supervisor',
                    'cancelado_por',
                    'fecha_cancelacion',
                    'motivo_cancelacion',
                    'visible',
                    'prioridad',
                ]
            )
        return tuple(dict.fromkeys(exclude)) or None


@admin.register(LoteEtapa)
class LoteEtapaAdmin(admin.ModelAdmin):
    list_display = ['lote', 'etapa', 'orden', 'maquina', 'estado', 'operario', 'duracion_minutos']
    list_filter = ['estado', 'etapa', 'maquina']
    search_fields = ['lote__codigo_lote']
    readonly_fields = ['duracion_minutos', 'porcentaje_rendimiento', 'cantidad_merma']

    def _is_restricted_operario(self, user):
        return is_operario(user) and not (is_admin(user) or is_supervisor(user))

    def _puede_gestionar_aprobacion(self, user):
        return is_admin(user) or is_supervisor(user) or is_calidad(user)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if self._is_restricted_operario(request.user):
            for field_name in ('estado', 'unidad', 'requiere_aprobacion_calidad'):
                form.base_fields.pop(field_name, None)

        if not self._puede_gestionar_aprobacion(request.user):
            for field_name in ('aprobada_por_calidad', 'fecha_aprobacion_calidad'):
                form.base_fields.pop(field_name, None)
        else:
            fecha_field = form.base_fields.get('fecha_aprobacion_calidad')
            if fecha_field is not None:
                fecha_field.disabled = True

        return form

    def get_readonly_fields(self, request, obj=None):
        fields = list(super().get_readonly_fields(request, obj))

        if self._puede_gestionar_aprobacion(request.user):
            fields.append('fecha_aprobacion_calidad')
        else:
            for field_name in ('aprobada_por_calidad', 'fecha_aprobacion_calidad'):
                if field_name in fields:
                    fields.remove(field_name)

        return tuple(dict.fromkeys(fields))

    def get_exclude(self, request, obj=None):
        exclude = list(super().get_exclude(request, obj) or [])
        if self._is_restricted_operario(request.user):
            exclude.extend(['estado', 'requiere_aprobacion_calidad'])

        if not self._puede_gestionar_aprobacion(request.user):
            exclude.extend(['aprobada_por_calidad', 'fecha_aprobacion_calidad'])

        valid_fields = {field.name for field in self.model._meta.get_fields()}
        exclude = [field for field in exclude if field in valid_fields]
        return tuple(dict.fromkeys(exclude)) or None


@admin.register(RegistroProduccion)
class RegistroProduccionAdmin(admin.ModelAdmin):
    list_display = (
        "fecha_produccion",
        "maquina",
        "producto",
        "turno",
        "cantidad_producida",
        "unidad_medida",
        "registrado_por",
    )
    list_filter = (
        "fecha_produccion",
        "maquina",
        "producto",
        "turno",
        "unidad_medida",
    )
    search_fields = (
        "maquina__codigo",
        "producto__nombre",
        "registrado_por__username",
    )
    ordering = ("-fecha_produccion", "-fecha_registro")

    def has_view_permission(self, request, obj=None):
        return getattr(request.user, "is_authenticated", False)

    def has_add_permission(self, request):
        return is_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return is_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return is_admin(request.user)

