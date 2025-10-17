"""Clases de rate limiting para vistas de autenticación."""

from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """Limita intentos de login por IP/usuario."""

    scope = "login"


class RegisterRateThrottle(SimpleRateThrottle):
    """Limita registros públicos para evitar abusos."""

    scope = "register"

