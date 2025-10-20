"""Implementación mínima de filtros para entornos sin django-filter."""

from rest_framework import filters as drf_filters


class BaseFilter:
    def __init__(self, field_name=None, lookup_expr="exact"):
        self.field_name = field_name
        self.lookup_expr = lookup_expr or "exact"


class DateFilter(BaseFilter):
    pass


class FilterSetMeta(type):
    def __new__(mcs, name, bases, attrs):
        declared_filters = {
            key: value
            for key, value in attrs.items()
            if isinstance(value, BaseFilter)
        }
        attrs.setdefault("base_filters", {})
        attrs["base_filters"] = {
            **{k: v for base in bases if hasattr(base, "base_filters") for k, v in base.base_filters.items()},
            **declared_filters,
        }
        for key in declared_filters.keys():
            attrs.pop(key)
        return super().__new__(mcs, name, bases, attrs)


class FilterSet(metaclass=FilterSetMeta):
    def __init__(self, data=None, queryset=None):
        self.data = data or {}
        self.queryset = queryset

    @property
    def qs(self):
        qs = self.queryset
        if qs is None:
            return qs

        for name, filtro in self.base_filters.items():
            value = self._get_value(name)
            if value is None:
                continue
            qs = self._apply_filter(qs, filtro, name, value)

        meta = getattr(self, "Meta", None)
        if meta and hasattr(meta, "fields"):
            for field_name, lookups in meta.fields.items():
                for lookup in lookups:
                    param_name = field_name if lookup == "exact" else f"{field_name}__{lookup}"
                    value = self._get_value(param_name)
                    if value is None:
                        continue
                    qs = qs.filter(**{self._build_lookup(field_name, lookup): value})
        return qs

    def _get_value(self, key):
        if hasattr(self.data, "getlist"):
            values = self.data.getlist(key)
            if not values:
                return None
            return values[-1]
        value = self.data.get(key)
        if value in ("", None):
            return None
        return value

    @staticmethod
    def _build_lookup(field_name, lookup):
        return field_name if lookup == "exact" else f"{field_name}__{lookup}"

    def _apply_filter(self, queryset, filtro, name, value):
        field_name = filtro.field_name or name
        lookup = filtro.lookup_expr
        return queryset.filter(**{self._build_lookup(field_name, lookup): value})


class DjangoFilterBackend(drf_filters.BaseFilterBackend):
    def get_filterset_class(self, view):
        return getattr(view, "filterset_class", None)

    def filter_queryset(self, request, queryset, view):
        filterset_class = self.get_filterset_class(view)
        if not filterset_class:
            return queryset
        filterset = filterset_class(data=request.query_params, queryset=queryset)
        return filterset.qs
