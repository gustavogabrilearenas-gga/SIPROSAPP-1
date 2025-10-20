"""Implementación mínima de filtros para entornos sin django-filter."""

from datetime import datetime, time

from rest_framework import filters as drf_filters
from django.utils import timezone


class BaseFilter:
    def __init__(self, field_name=None, lookup_expr="exact"):
        self.field_name = field_name
        self.lookup_expr = lookup_expr or "exact"

    @staticmethod
    def _get_value(data, key):
        if hasattr(data, "getlist"):
            values = data.getlist(key)
            if not values:
                return None
            return values[-1]
        value = data.get(key) if data else None
        if value in ("", None):
            return None
        return value

    @staticmethod
    def _build_lookup(field_name, lookup):
        return field_name if lookup == "exact" else f"{field_name}__{lookup}"

    def filter(self, queryset, data, name):
        value = self.get_value(data, name)
        if value is None:
            return queryset
        field_name = self.field_name or name
        lookup = self.lookup_expr or "exact"
        return queryset.filter(**{self._build_lookup(field_name, lookup): value})

    def get_value(self, data, name):
        return self._get_value(data, name)


class DateFilter(BaseFilter):
    pass


class DateFromToRangeFilter(BaseFilter):
    def filter(self, queryset, data, name):
        after = self._get_value(data, f"{name}_after")
        before = self._get_value(data, f"{name}_before")
        if after is None and before is None:
            return queryset

        field_name = self.field_name or name
        filters = {}
        if after is not None:
            filters[f"{field_name}__gte"] = self._coerce_value(after, start=True)
        if before is not None:
            filters[f"{field_name}__lte"] = self._coerce_value(before, start=False)
        return queryset.filter(**filters)

    def _coerce_value(self, value, *, start: bool):
        cleaned = str(value).replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(cleaned)
        except ValueError:
            return value

        if "T" not in cleaned and not start:
            dt = dt.replace(hour=time.max.hour, minute=time.max.minute, second=time.max.second, microsecond=time.max.microsecond)

        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        return dt


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
            qs = filtro.filter(qs, self.data, name)

        meta = getattr(self, "Meta", None)
        if meta and hasattr(meta, "fields"):
            fields = meta.fields
            if isinstance(fields, dict):
                iterable = fields.items()
            else:
                iterable = ((field_name, ("exact",)) for field_name in fields)

            for field_name, lookups in iterable:
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

class DjangoFilterBackend(drf_filters.BaseFilterBackend):
    def get_filterset_class(self, view):
        return getattr(view, "filterset_class", None)

    def filter_queryset(self, request, queryset, view):
        filterset_class = self.get_filterset_class(view)
        if not filterset_class:
            return queryset
        filterset = filterset_class(data=request.query_params, queryset=queryset)
        return filterset.qs
