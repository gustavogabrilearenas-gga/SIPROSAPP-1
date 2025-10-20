# Política de paginación por defecto.

from rest_framework.pagination import PageNumberPagination


class DefaultPageNumberPagination(PageNumberPagination):
    """Permite ajustar el tamaño de página desde la query string."""

    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
