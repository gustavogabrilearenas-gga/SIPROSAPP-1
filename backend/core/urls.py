"""URLs para SIPROSA MES."""

from django.urls import include, path

from .views import health_check
from .auth_views import (
    login_view, logout_view, me_view, refresh_token_view, register_view
)

urlpatterns = [
    # Health check
    path("health/", health_check, name="health_check"),

    # Catálogos
    path("catalogos/", include("backend.catalogos.urls")),

    path("usuarios/", include("backend.usuarios.urls")),

    # Autenticación
    path("auth/login/", login_view, name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/me/", me_view, name="me"),
    path("auth/refresh/", refresh_token_view, name="refresh_token"),
    path("auth/register/", register_view, name="register"),
]
