"""Servicios para búsquedas transversales."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from django.apps import apps
from django.db.models import Q


@dataclass
class SearchResponse:
    """Agrupa los resultados y estadísticas de una búsqueda global."""

    results: List[Dict]
    totals: Dict[str, int]


def _search_lotes(query: str, limit: int):
    Lote = apps.get_model('produccion', 'Lote')
    return (
        Lote.objects.filter(
            Q(codigo_lote__icontains=query)
            | Q(producto__nombre__icontains=query)
            | Q(producto__codigo__icontains=query)
        )
        .select_related('producto', 'supervisor')
        .order_by('-fecha_creacion')[:limit]
    )


def _search_ordenes_trabajo(query: str, limit: int):
    OrdenTrabajo = apps.get_model('mantenimiento', 'OrdenTrabajo')
    return (
        OrdenTrabajo.objects.filter(
            Q(codigo__icontains=query)
            | Q(titulo__icontains=query)
            | Q(maquina__nombre__icontains=query)
            | Q(maquina__codigo__icontains=query)
        )
        .select_related('maquina', 'tipo')
        .order_by('-fecha_creacion')[:limit]
    )


def _search_incidentes(query: str, limit: int):
    Incidente = apps.get_model('incidencias', 'Incidente')
    return (
        Incidente.objects.filter(
            Q(codigo__icontains=query)
            | Q(titulo__icontains=query)
            | Q(descripcion__icontains=query)
        )
        .select_related('tipo', 'ubicacion')
        .order_by('-fecha_ocurrencia')[:limit]
    )


def _serialize_lote(lote) -> Dict:
    return {
        'tipo': 'lote',
        'id': lote.id,
        'titulo': lote.codigo_lote,
        'subtitulo': lote.producto.nombre,
        'snippet': (
            f"Estado: {lote.get_estado_display()} - "
            f"Supervisor: {lote.supervisor.get_full_name()}"
        ),
        'url': f'/lotes/{lote.id}',
        'fecha': lote.fecha_creacion.isoformat(),
        'estado': lote.estado,
        'estado_display': lote.get_estado_display(),
    }


def _serialize_orden_trabajo(ot) -> Dict:
    return {
        'tipo': 'orden_trabajo',
        'id': ot.id,
        'titulo': ot.codigo,
        'subtitulo': ot.titulo,
        'snippet': (
            f"Máquina: {ot.maquina.nombre} - {ot.get_estado_display()} - "
            f"{ot.get_prioridad_display()}"
        ),
        'url': f'/mantenimiento/{ot.id}',
        'fecha': ot.fecha_creacion.isoformat(),
        'estado': ot.estado,
        'estado_display': ot.get_estado_display(),
        'prioridad': ot.prioridad,
    }


def _serialize_incidente(incidente) -> Dict:
    return {
        'tipo': 'incidente',
        'id': incidente.id,
        'titulo': incidente.codigo,
        'subtitulo': incidente.titulo,
        'snippet': (
            f"{incidente.tipo.nombre} - {incidente.get_severidad_display()} - "
            f"{incidente.ubicacion.nombre}"
        ),
        'url': f'/incidentes/{incidente.id}',
        'fecha': incidente.fecha_ocurrencia.isoformat(),
        'estado': incidente.estado,
        'estado_display': incidente.get_estado_display(),
        'severidad': incidente.severidad,
    }


def global_search(query: str, limit: int) -> SearchResponse:
    """Realiza la búsqueda global desacoplada de las vistas HTTP."""

    raw_results: List[Dict] = []

    lotes = [_serialize_lote(lote) for lote in _search_lotes(query, limit)]
    ordenes = [
        _serialize_orden_trabajo(orden_trabajo)
        for orden_trabajo in _search_ordenes_trabajo(query, limit)
    ]
    incidentes = [
        _serialize_incidente(incidente)
        for incidente in _search_incidentes(query, limit)
    ]

    raw_results.extend(lotes)
    raw_results.extend(ordenes)
    raw_results.extend(incidentes)

    raw_results.sort(key=lambda item: item['fecha'], reverse=True)
    raw_results = raw_results[:limit]

    totals = {
        'lotes': sum(1 for result in raw_results if result['tipo'] == 'lote'),
        'ordenes_trabajo': sum(
            1 for result in raw_results if result['tipo'] == 'orden_trabajo'
        ),
        'incidentes': sum(1 for result in raw_results if result['tipo'] == 'incidente'),
    }

    return SearchResponse(results=raw_results, totals=totals)
