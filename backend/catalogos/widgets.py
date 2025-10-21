"""Widgets personalizados para el admin."""

from django import forms
from django.urls import reverse
from django.utils.html import format_html


class JSONEditorWidget(forms.Textarea):
    template_name = 'admin/widgets/json_editor.html'

    def __init__(self, attrs=None, schema=None):
        default_attrs = {
            'class': 'json-editor',
            'data-schema': schema or '{}',
        }
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

        if schema == 'etapas':
            self.template_name = 'admin/widgets/etapas_editor.html'
            default_attrs['class'] = 'etapas-editor'

    def render(self, name, value, attrs=None, renderer=None):
        if attrs and 'class' in attrs and 'etapas-editor' in attrs['class']:
            return format_html(
                '<div class="etapas-widget" id="{}"></div>'
                '<textarea style="display:none" name="{}" {}>{}</textarea>'
                '<script>initEtapasWidget("{}", "{}", "{}");</script>',
                f'etapas-widget-{name}',
                name,
                self.build_attrs(attrs),
                value or '[]',
                f'etapas-widget-{name}',
                reverse('admin:catalogos_etapaproduccion_add'),
                reverse('admin:catalogos_etapaproduccion_changelist')
            )
        return super().render(name, value, attrs, renderer)

    class Media:
        css = {
            'all': [
                'admin/css/json-editor.css',
            ]
        }
        js = [
            'admin/js/json-editor.js',
            'admin/js/etapas-widget.js',
        ]