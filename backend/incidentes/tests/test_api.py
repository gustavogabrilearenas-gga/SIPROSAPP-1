from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from backend.incidentes.models import Incidente
from backend.catalogos.models import Maquina
from django.contrib.auth import get_user_model

User = get_user_model()

class IncidenteModelTest(TestCase):
    def setUp(self):
        self.fecha_inicio = timezone.now()
        self.fecha_fin = self.fecha_inicio + timedelta(hours=2)
        
        self.incidente = Incidente.objects.create(
            fecha_inicio=self.fecha_inicio,
            fecha_fin=self.fecha_fin,
            es_parada_no_planificada=True,
            origen='produccion',
            descripcion='Incidente de prueba'
        )

    def test_incidente_creation(self):
        self.assertTrue(isinstance(self.incidente, Incidente))
        self.assertEqual(str(self.incidente), 
                        f"Incidente del {self.fecha_inicio.strftime('%d/%m/%Y %H:%M')}")

class IncidenteAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        
        self.fecha_inicio = timezone.now()
        self.fecha_fin = self.fecha_inicio + timedelta(hours=2)
        
        self.incidente_data = {
            'fecha_inicio': self.fecha_inicio.isoformat(),
            'fecha_fin': self.fecha_fin.isoformat(),
            'es_parada_no_planificada': True,
            'origen': 'produccion',
            'descripcion': 'Incidente de prueba API'
        }

    def test_create_incidente(self):
        url = reverse('incidente-list')
        response = self.client.post(url, self.incidente_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Incidente.objects.count(), 1)
        
    def test_validate_fechas(self):
        self.incidente_data['fecha_fin'] = self.fecha_inicio.isoformat()
        url = reverse('incidente-list')
        response = self.client.post(url, self.incidente_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_validate_acciones_correctivas(self):
        self.incidente_data['requiere_acciones_correctivas'] = True
        url = reverse('incidente-list')
        response = self.client.post(url, self.incidente_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)