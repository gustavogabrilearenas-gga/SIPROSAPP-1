from django.apps import apps
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from backend.core.views import health_check, home

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('backend.core.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/health/', health_check, name='api_health'),
    path('api/health_check/', health_check, name='api_health_check'),
]

if apps.is_installed('backend.catalogos'):
    urlpatterns.append(path('api/catalogos/', include('backend.catalogos.urls')))

if apps.is_installed('backend.usuarios'):
    urlpatterns.append(path('api/usuarios/', include('backend.usuarios.urls')))

# No montamos 'eventos' hasta que exista e importe bien
