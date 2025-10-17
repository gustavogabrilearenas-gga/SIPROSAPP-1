"""Servicios de búsqueda global."""

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class SearchResponse:
    """Agrupa los resultados y estadísticas de una búsqueda global."""

    results: List[Dict]
    totals: Dict[str, int]


def global_search(query: str, limit: int) -> SearchResponse:
    """Retorna una respuesta vacía ya que no hay dominios indexados."""

    return SearchResponse(
        results=[],
        totals={
            "lotes": 0,
            "ordenes_trabajo": 0,
            "incidentes": 0,
        },
    )
