"""Clases de rate limiting para vistas de autenticación."""

from rest_framework.throttling import SimpleRateThrottle


class _BaseUserOrIpThrottle(SimpleRateThrottle):
    """Throttle que combina la IP del request con el usuario autenticado."""

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f"user-{request.user.pk}"
        else:
            ident = f"ip-{self.get_ident(request)}"
        return self.cache_format % {"scope": self.scope, "ident": ident}


class LoginRateThrottle(_BaseUserOrIpThrottle):
    """Limita intentos de login por IP/usuario."""

    scope = "login"


class RegisterRateThrottle(_BaseUserOrIpThrottle):
    """Limita registros públicos para evitar abusos."""

    scope = "register"

