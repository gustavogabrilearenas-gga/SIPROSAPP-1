from django.apps import apps
from django.conf import settings
from django.conf.urls.static import static
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
]

if apps.is_installed('backend.catalogos'):
    urlpatterns.append(path('api/catalogos/', include('backend.catalogos.urls')))

if apps.is_installed('backend.usuarios'):
    urlpatterns.append(path('api/usuarios/', include('backend.usuarios.urls')))

if apps.is_installed('backend.observaciones'):
    urlpatterns.append(path('api/', include('backend.observaciones.urls')))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
