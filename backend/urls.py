from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core.views import health_check, home

urlpatterns = [
    path('', home, name='home'),  # Página principal redirige al admin
    path('admin/', admin.site.urls),
    path('api/produccion/', include('backend.produccion.urls')),
    path('api/calidad/', include('backend.calidad.urls')),
    path('api/inventario/', include('backend.inventario.urls')),
    path('api/mantenimiento/', include('backend.mantenimiento.urls')),
    path('api/incidencias/', include('backend.incidencias.urls')),
    path('api/auditoria/', include('backend.auditoria.urls')),
    path('api/kpis/', include('backend.kpis.urls')),
    path('api/', include("core.urls")),  # 👈 importante
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/health/", health_check, name="api_health"),
    path("api/health_check/", health_check, name="api_health_check"),
]
