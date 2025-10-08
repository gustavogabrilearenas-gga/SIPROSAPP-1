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
    path('api/inventario/', include('backend.inventario.urls')),
    path('api/', include("core.urls")),  # 👈 importante
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/health/", health_check),
]
