from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.test import APITestCase

from backend.observaciones.models import ObservacionGeneral


class ObservacionesAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", email="tester@example.com", password="pass1234"
        )
        self.client.force_authenticate(user=self.user)

    def test_creacion(self):
        url = reverse("observacion-general-list")
        response = self.client.post(url, {"texto": "Primera observación"}, format="json")

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["texto"], "Primera observación")
        self.assertEqual(data["creado_por"], self.user.id)

        created = ObservacionGeneral.objects.get(id=data["id"])
        self.assertEqual(created.creado_por, self.user)

        created_at = parse_datetime(data["fecha_hora"])
        self.assertIsNotNone(created_at)
        self.assertLess(abs(created_at - timezone.now()), timedelta(seconds=5))

    def test_read_only_fields(self):
        observacion = ObservacionGeneral.objects.create(
            texto="Inicial", creado_por=self.user
        )
        url = reverse("observacion-general-detail", args=[observacion.pk])
        response = self.client.patch(
            url,
            {
                "texto": "Modificado",
                "fecha_hora": timezone.now().isoformat(),
                "creado_por": self.user.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 405)

    def test_listado(self):
        other_user = get_user_model().objects.create_user(
            username="other", email="other@example.com", password="pass1234"
        )
        ObservacionGeneral.objects.create(texto="Uno", creado_por=self.user)
        ObservacionGeneral.objects.create(texto="Dos", creado_por=other_user)
        ObservacionGeneral.objects.create(texto="Tres", creado_por=self.user)

        url = reverse("observacion-general-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("results", payload)
        self.assertEqual(payload["count"], 3)
        for item in payload["results"]:
            self.assertSetEqual(
                {"id", "texto", "fecha_hora", "creado_por"}, set(item.keys())
            )
        ids = {item["id"] for item in payload["results"]}
        self.assertSetEqual(
            ids, set(ObservacionGeneral.objects.values_list("id", flat=True))
        )
