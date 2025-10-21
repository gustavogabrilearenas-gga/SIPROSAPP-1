from unittest import mock

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.messages import get_messages
from django.contrib.messages.storage.fallback import FallbackStorage
from django.contrib.sessions.middleware import SessionMiddleware
from django.db import DatabaseError
from django.test import RequestFactory, TestCase
from django.urls import reverse

from backend.produccion.admin import RegistroProduccionAdmin
from backend.produccion.models import RegistroProduccion


class RegistroProduccionAdminTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = get_user_model().objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="seguro123",
        )
        self.admin_site = admin.sites.AdminSite()
        self.admin = RegistroProduccionAdmin(RegistroProduccion, self.admin_site)

    def _attach_messages(self, request):
        """Configura la sesión y el storage de mensajes para el request."""

        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(request)
        request.session.save()
        messages_storage = FallbackStorage(request)
        setattr(request, "_messages", messages_storage)

    def test_changelist_view_handles_missing_table(self):
        request = self.factory.get("/admin/produccion/registroproduccion/")
        request.user = self.user
        self._attach_messages(request)

        with mock.patch(
            "django.contrib.admin.options.ModelAdmin.changelist_view",
            side_effect=DatabaseError("missing relation"),
        ):
            response = self.admin.changelist_view(request)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("admin:index"))

        mensajes = [m.message for m in get_messages(request)]
        self.assertTrue(
            any("migrac" in mensaje.lower() for mensaje in mensajes),
            "Se esperaba un mensaje indicando ejecutar las migraciones.",
        )
