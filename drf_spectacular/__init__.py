"""Fallback minimal implementation of drf-spectacular for offline environments."""

from .openapi import AutoSchema  # noqa: F401
from .views import SpectacularAPIView, SpectacularSwaggerView  # noqa: F401
