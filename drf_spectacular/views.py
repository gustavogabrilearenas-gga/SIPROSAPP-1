"""Minimal API views to expose schema endpoints without la dependencia real."""


class _BaseStub:
    permission_classes = None
    url_name = None

    @classmethod
    def as_view(cls, **initkwargs):
        from rest_framework.permissions import AllowAny
        from rest_framework.views import APIView

        perms = cls.permission_classes or [AllowAny]
        stub = cls()

        class _Wrapped(APIView):
            permission_classes = perms

            def get(self, request, *args, **kwargs):
                return stub.get(request, *args, **kwargs)

        for key, value in initkwargs.items():
            setattr(_Wrapped, key, value)

        return _Wrapped.as_view()

    def get(self, request, *args, **kwargs):
        raise NotImplementedError


class SpectacularAPIView(_BaseStub):
    def get(self, request, *args, **kwargs):
        from rest_framework.response import Response

        return Response({"detail": "drf-spectacular no está instalado; esquema no disponible."})


class SpectacularSwaggerView(_BaseStub):
    def get(self, request, *args, **kwargs):
        from rest_framework.response import Response

        return Response({
            "detail": "drf-spectacular Swagger UI no disponible en este entorno.",
            "schema_url": self.url_name,
        })
