"""Mixins reutilizables para vistas del proyecto."""

from collections.abc import Callable
from typing import Dict, Iterable, Union

from django.db.models import QuerySet
from rest_framework import permissions

QueryParamFilter = Union[str, Callable[[QuerySet, str], QuerySet]]


class SafeMethodPermissionMixin:
    """Asignación declarativa de permisos según el tipo de método HTTP.

    Muchas ``ViewSet`` del proyecto comparten la lógica de permitir
    cualquier método seguro (``GET``, ``HEAD`` y ``OPTIONS``) a usuarios
    autenticados y restringir el resto únicamente a perfiles con permisos
    elevados.  Este mixin concentra la lógica repetitiva y permite que las
    clases hijas sólo definan los permisos que necesitan sin duplicar
    código.
    """

    safe_permission_classes: Iterable[type] = (permissions.IsAuthenticated,)
    unsafe_permission_classes: Iterable[type] = (permissions.IsAuthenticated,)

    def get_permissions(self):
        """Instancia las clases de permiso definidas para el método actual."""

        perm_classes = (
            self.safe_permission_classes
            if self.request.method in permissions.SAFE_METHODS
            else self.unsafe_permission_classes
        )
        return [permission_class() for permission_class in perm_classes]


class QueryParamFilterMixin:
    """Aplica filtros declarativos basados en parámetros de consulta.

    Las vistas que exponen listados suelen aceptar filtros simples
    transmitidos en ``request.query_params``.  Para evitar lógica
    duplicada, este mixin permite definir un mapa ``query_param_filters``
    donde cada clave corresponde al nombre del parámetro esperado y cada
    valor indica cómo aplicar el filtro:

    * Si el valor es una cadena, se utiliza para construir un filtro
      directo ``queryset.filter(**{cadena: valor})``.
    * Si el valor es un *callable*, se invoca con el queryset actual y el
      valor del parámetro, debiendo retornar el queryset filtrado.
    """

    query_param_filters: Dict[str, QueryParamFilter] = {}

    def apply_query_param_filters(self, queryset: QuerySet) -> QuerySet:
        """Itera por los filtros declarados aplicándolos al queryset."""

        for param_name, filter_definition in self.query_param_filters.items():
            raw_value = self.request.query_params.get(param_name)
            if raw_value in (None, ""):
                continue

            if callable(filter_definition):
                queryset = filter_definition(queryset, raw_value)
            else:
                queryset = queryset.filter(**{filter_definition: raw_value})
        return queryset
