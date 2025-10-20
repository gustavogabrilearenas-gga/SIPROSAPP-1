# URLs del núcleo (no monta dominios)

from django.urls import path

from .auth_views import (
    login_view,
    logout_view,
    me_view,
    refresh_token_view,
    register_view,
)
from .views import BusquedaGlobalView, health_check

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('auth/refresh/', refresh_token_view, name='refresh_token'),
    path('auth/register/', register_view, name='register'),
    path('buscar/', BusquedaGlobalView.as_view(), name='busqueda_global'),
]
