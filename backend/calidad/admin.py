from django.contrib import admin

from .models import AccionCorrectiva, Desviacion, DocumentoVersionado


@admin.register(Desviacion)
class DesviacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'severidad', 'estado', 'fecha_deteccion', 'detectado_por']
    list_filter = ['severidad', 'estado', 'requiere_capa', 'fecha_deteccion']
    search_fields = ['codigo', 'titulo', 'descripcion']
    date_hierarchy = 'fecha_deteccion'


@admin.register(AccionCorrectiva)
class AccionCorrectivaAdmin(admin.ModelAdmin):
    list_display = ['incidente', 'tipo', 'estado', 'responsable', 'fecha_planificada', 'eficacia_verificada']
    list_filter = ['tipo', 'estado', 'eficacia_verificada']
    date_hierarchy = 'fecha_planificada'


@admin.register(DocumentoVersionado)
class DocumentoVersionadoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'tipo', 'estado', 'version', 'fecha_creacion']
    list_filter = ['tipo', 'estado', 'fecha_creacion']
    search_fields = ['codigo', 'titulo']
    date_hierarchy = 'fecha_creacion'
