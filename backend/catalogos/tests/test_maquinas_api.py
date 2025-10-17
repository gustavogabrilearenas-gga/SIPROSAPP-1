from django.contrib.auth.models import Group, User
from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient

from backend.catalogos.models import Maquina, Ubicacion


class MaquinaViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.supervisor_group, _ = Group.objects.get_or_create(name="Supervisor")
        self.admin_group, _ = Group.objects.get_or_create(name="Administrador")

        self.supervisor = User.objects.create_user("sup", password="pass")
        self.supervisor.groups.add(self.supervisor_group)

        self.admin = User.objects.create_user("admin", password="pass")
        self.admin.groups.add(self.admin_group)

        self.ubicacion = Ubicacion.objects.create(
            codigo="PLT-01",
            nombre="Planta Principal",
            descripcion="",
        )

        self.maquina_activa = Maquina.objects.create(
            codigo="M-001",
            nombre="Mezcladora Alpha",
            tipo="MEZCLADO",
            ubicacion=self.ubicacion,
            descripcion="",
        )
        self.maquina_inactiva = Maquina.objects.create(
            codigo="M-002",
            nombre="Compresora Beta",
            tipo="COMPRESION",
            ubicacion=self.ubicacion,
            activa=False,
            descripcion="",
        )

    def _authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_filter_by_activa(self):
        self._authenticate(self.supervisor)
        url = reverse("maquina-list")
        response = self.client.get(url, {"activa": "true"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        returned_codes = {item["codigo"] for item in payload["results"]}
        self.assertEqual(returned_codes, {self.maquina_activa.codigo})

    def test_filter_by_tipo_is_case_insensitive(self):
        self._authenticate(self.supervisor)
        url = reverse("maquina-list")
        response = self.client.get(url, {"tipo": "compresion"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        returned_codes = {item["codigo"] for item in payload["results"]}
        self.assertEqual(returned_codes, {self.maquina_inactiva.codigo})

    def test_supervisor_can_access_detail_action(self):
        self._authenticate(self.supervisor)
        url = reverse("maquina-lotes-recientes", args=[self.maquina_activa.pk])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_performance_select_related_limits_queries(self):
        # Cargar varias máquinas adicionales para detectar problemas de N+1
        for index in range(3, 8):
            Maquina.objects.create(
                codigo=f"M-{index:03d}",
                nombre=f"Equipo {index}",
                tipo="MEZCLADO",
                ubicacion=self.ubicacion,
                descripcion="",
            )

        self._authenticate(self.admin)
        url = reverse("maquina-list")

        with self.assertNumQueries(3):
            response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(payload["count"], 2)
