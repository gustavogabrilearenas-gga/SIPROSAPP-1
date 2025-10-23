from django.apps import apps
from django.conf import settings
from django.contrib.auth.models import Group
from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient

from backend.catalogos.models import Producto

UserModel = apps.get_model(settings.AUTH_USER_MODEL)


class ProductoApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.supervisor_group, _ = Group.objects.get_or_create(name="Supervisor")
        self.admin_group, _ = Group.objects.get_or_create(name="Administrador")
        self.operario_group, _ = Group.objects.get_or_create(name="Operario")

        self.supervisor = UserModel.objects.create_user("supervisor", password="pass1234")
        self.supervisor.groups.add(self.supervisor_group)

        self.admin = UserModel.objects.create_user("admin", password="pass1234")
        self.admin.groups.add(self.admin_group)

        self.operario = UserModel.objects.create_user("operario", password="pass1234")
        self.operario.groups.add(self.operario_group)

        self.producto_tabletas = Producto.objects.create(
            codigo="TAB-001",
            nombre="Tabletas",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="500mg",
            descripcion="",
        )
        self.producto_capsulas = Producto.objects.create(
            codigo="CAP-001",
            nombre="Cápsulas",
            tipo="CAPSULA",
            presentacion="FRASCO",
            concentracion="250mg",
            descripcion="",
        )

    def _auth(self, user=None):
        self.client.force_authenticate(user or self.supervisor)

    def test_filter_by_tipo(self):
        self._auth()
        url = reverse("producto-list")
        response = self.client.get(url, {"tipo": "capsula"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        results = [item["codigo"] for item in payload["results"]]
        self.assertEqual(results, [self.producto_capsulas.codigo])

    def test_filter_by_presentacion(self):
        self._auth()
        url = reverse("producto-list")
        response = self.client.get(url, {"presentacion": "blister"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        results = [item["codigo"] for item in payload["results"]]
        self.assertEqual(results, [self.producto_tabletas.codigo])

    def test_operario_can_list_productos(self):
        self._auth(self.operario)
        url = reverse("producto-list")

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        results = [item["codigo"] for item in payload["results"]]
        self.assertIn(self.producto_capsulas.codigo, results)
        self.assertIn(self.producto_tabletas.codigo, results)

    def test_admin_can_list_productos(self):
        self._auth(self.admin)
        url = reverse("producto-list")

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
