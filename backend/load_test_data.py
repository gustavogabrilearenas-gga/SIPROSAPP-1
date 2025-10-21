"""Script para crear datos de prueba."""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from catalogos.models import (
    Producto, Formula, EtapaProduccion, FormulaEtapa,
    Maquina, Ubicacion
)

# Crear usuario de prueba
User = get_user_model()
admin_user = User.objects.get_or_create(
    username='admin',
    defaults={
        'is_staff': True,
        'is_superuser': True
    }
)[0]
admin_user.set_password('admin123')
admin_user.save()

# Crear ubicación
ubicacion = Ubicacion.objects.get_or_create(
    codigo='PROD-01',
    defaults={
        'nombre': 'Área de Producción 1',
        'descripcion': 'Área principal de producción'
    }
)[0]

# Crear máquinas
maquina_mezcla = Maquina.objects.get_or_create(
    codigo='MEZC-01',
    defaults={
        'nombre': 'Mezcladora Principal',
        'tipo': 'MEZCLADO',
        'ubicacion': ubicacion,
        'capacidad_nominal': 100,
        'unidad_capacidad': 'kg/batch'
    }
)[0]

maquina_comp = Maquina.objects.get_or_create(
    codigo='COMP-01',
    defaults={
        'nombre': 'Compresora 1',
        'tipo': 'COMPRESION',
        'ubicacion': ubicacion,
        'capacidad_nominal': 10000,
        'unidad_capacidad': 'comp/hora'
    }
)[0]

# Crear producto
producto = Producto.objects.get_or_create(
    codigo='IBU-500',
    defaults={
        'nombre': 'Ibuprofeno',
        'tipo': 'COMPRIMIDO',
        'presentacion': 'BLISTER',
        'concentracion': '500mg'
    }
)[0]

# Crear etapas
etapa_mezcla = EtapaProduccion.objects.get_or_create(
    codigo='MEZC',
    defaults={
        'nombre': 'Mezcla de componentes',
        'descripcion': 'Mezcla de principios activos y excipientes'
    }
)[0]
etapa_mezcla.maquinas_permitidas.add(maquina_mezcla)

etapa_comp = EtapaProduccion.objects.get_or_create(
    codigo='COMP',
    defaults={
        'nombre': 'Compresión',
        'descripcion': 'Compresión de la mezcla'
    }
)[0]
etapa_comp.maquinas_permitidas.add(maquina_comp)

# Crear fórmula
formula = Formula.objects.get_or_create(
    codigo='F-IBU-500',
    version='1.0',
    defaults={
        'producto': producto,
        'descripcion': 'Fórmula estándar de Ibuprofeno 500mg'
    }
)[0]

# Crear relación fórmula-etapas
FormulaEtapa.objects.get_or_create(
    formula=formula,
    etapa=etapa_mezcla,
    defaults={
        'orden': 1,
        'duracion_min': 45,
        'descripcion': 'Mezclar durante 45 minutos a velocidad media'
    }
)

FormulaEtapa.objects.get_or_create(
    formula=formula,
    etapa=etapa_comp,
    defaults={
        'orden': 2,
        'duracion_min': 120,
        'descripcion': 'Comprimir a 15kN, velocidad 20 rpm'
    }
)

print("Datos de prueba creados exitosamente")
