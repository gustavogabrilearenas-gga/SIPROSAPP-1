# URLs del núcleo (no monta dominios)

from django.conf import settings
from django.urls import path

from .auth_views import (
    login_view,
    logout_view,
    me_view,
    refresh_token_view,
    register_view,
)
from .views import health_check

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('auth/refresh/', refresh_token_view, name='refresh_token'),
    path('auth/register/', register_view, name='register'),
]

if settings.ENABLE_GLOBAL_SEARCH:
    from .views import BusquedaGlobalView

    urlpatterns.append(path('buscar/', BusquedaGlobalView.as_view(), name='busqueda_global'))
