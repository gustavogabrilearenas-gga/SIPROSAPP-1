from django.apps import apps
from django.apps import apps
from django.conf import settings
from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient


UserModel = apps.get_model(settings.AUTH_USER_MODEL)


class AuthEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserModel.objects.create_user(
            username="tester",
            password="pass1234",
            email="tester@example.com",
        )

    def test_full_auth_flow(self):
        login_url = reverse("login")
        response = self.client.post(
            login_url,
            {"username": "tester", "password": "pass1234"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        access = data["access"]
        refresh = data["refresh"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        me_response = self.client.get(reverse("me"))
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()["username"], "tester")

        refresh_response = self.client.post(
            reverse("refresh_token"), {"refresh": refresh}, format="json"
        )
        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn("access", refresh_response.json())

        logout_response = self.client.post(reverse("logout"), {"refresh": refresh}, format="json")
        self.assertEqual(logout_response.status_code, 200)

        # Refresh debe fallar tras el logout (token en blacklist)
        refresh_again = self.client.post(
            reverse("refresh_token"), {"refresh": refresh}, format="json"
        )
        self.assertEqual(refresh_again.status_code, 401)
