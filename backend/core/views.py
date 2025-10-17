"""Vistas transversales del núcleo de la aplicación."""

from django.db import connections
from django.db.utils import OperationalError
from django.http import JsonResponse
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.core.services.search import global_search


class BusquedaGlobalView(APIView):
    """Permite buscar en lotes, órdenes de trabajo e incidentes."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Delegar la lógica de búsqueda al servicio dedicado."""

        query = request.query_params.get('q', '').strip()
        limit = int(request.query_params.get('limit', 20))

        if len(query) < 2:
            return Response(
                {
                    'query': query,
                    'resultados': [],
                    'total': 0,
                    'message': 'La búsqueda debe tener al menos 2 caracteres',
                }
            )

        search_response = global_search(query=query, limit=limit)
        resultados = search_response.results

        return Response(
            {
                'query': query,
                'resultados': resultados,
                'total': len(resultados),
                'tipos': search_response.totals,
            }
        )


def home(request):
    """Redirige al panel de administración de Django."""

    from django.shortcuts import redirect

    return redirect('/admin/')



def health_check(request):
    """Comprueba la conexión a la base de datos."""

    try:
        with connections['default'].cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except OperationalError:
        return JsonResponse({'status': 'error'}, status=503)

    return JsonResponse({'status': 'ok'})
