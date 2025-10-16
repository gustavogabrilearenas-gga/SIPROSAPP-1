from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from backend.core.views import health_check, home

urlpatterns = [
    path('', home, name='home'),  # Página principal redirige al admin
    path('admin/', admin.site.urls),
    path('api/produccion/', include('backend.produccion.urls')),
    path('api/mantenimiento/', include('backend.mantenimiento.urls')),
    path('api/incidencias/', include('backend.incidencias.urls')),
    path('api/auditoria/', include('backend.core.auditoria_urls')),
    path('api/eventos/', include('backend.eventos.urls')),
    path('api/catalogos/', include('backend.catalogos.urls')),
    path('api/', include("backend.core.urls")),  # 👈 importante
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/health/", health_check, name="api_health"),
    path("api/health_check/", health_check, name="api_health_check"),
]
