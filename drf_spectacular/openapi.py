"""Minimal proxy AutoSchema that lazily defers to DRF's implementation."""


class _AutoSchemaMeta(type):
    def _get_base(cls):
        from rest_framework.schemas.openapi import AutoSchema as _AutoSchema

        return _AutoSchema

    def __call__(cls, *args, **kwargs):
        base = cls._get_base()
        return base(*args, **kwargs)

    def __instancecheck__(cls, instance):
        return isinstance(instance, cls._get_base())

    def __subclasscheck__(cls, subclass):
        base = cls._get_base()
        if subclass is cls:
            return True
        return issubclass(subclass, base)


class AutoSchema(metaclass=_AutoSchemaMeta):
    """Proxy class compatible con ViewInspector."""

    pass
