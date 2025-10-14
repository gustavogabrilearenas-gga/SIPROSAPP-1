"""
Create comprehensive production-ready data for SIPROSA MES
This script seeds the database with realistic data for demonstration and testing
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import EtapaProduccion

def create_etapas_produccion():
    """Create production stages"""
    print("[*] Creating Production Stages...")
    
    etapas_data = [
        {
            "codigo": "EP-01",
            "nombre": "Pesada de Materias Primas",
            "descripcion": "Pesada y verificación de materias primas según fórmula maestra",
            "orden_tipico": 1,
            "requiere_registro_parametros": True,
            "parametros_esperados": [
                {"nombre": "Peso real", "unidad": "kg", "min": 0, "max": 1000},
                {"nombre": "Temperatura ambiente", "unidad": "°C", "min": 15, "max": 30}
            ]
        },
        {
            "codigo": "EP-02",
            "nombre": "Mezcla Homogénea",
            "descripcion": "Mezcla de componentes para obtener blend homogéneo",
            "orden_tipico": 2,
            "requiere_registro_parametros": True,
            "parametros_esperados": [
                {"nombre": "Tiempo de mezcla", "unidad": "min", "min": 10, "max": 30},
                {"nombre": "Velocidad", "unidad": "RPM", "min": 20, "max": 60}
            ]
        },
        {
            "codigo": "EP-03",
            "nombre": "Granulación Húmeda",
            "descripcion": "Proceso de granulación con solución aglutinante",
            "orden_tipico": 3,
            "requiere_registro_parametros": True,
            "parametros_esperados": [
                {"nombre": "Cantidad líquido", "unidad": "L", "min": 5, "max": 20},
                {"nombre": "Temperatura", "unidad": "°C", "min": 20, "max": 40}
            ]
        },
        {
            "codigo": "EP-04",
            "nombre": "Secado",
            "descripcion": "Secado del granulado hasta humedad especificada",
            "orden_tipico": 4,
            "requiere_registro_parametros": True,
            "parametros_esperados": [
                {"nombre": "Temperatura entrada", "unidad": "°C", "min": 40, "max": 80},
                {"nombre": "Humedad final", "unidad": "%", "min": 1, "max": 5}
            ]
        },
        {
            "codigo": "EP-05",
            "nombre": "Tamizado",
            "descripcion": "Tamizado del granulado seco",
            "orden_tipico": 5,
            "requiere_registro_parametros": False
        },
        {
            "codigo": "EP-06",
            "nombre": "Lubricación",
            "descripcion": "Adición y mezcla de lubricantes",
            "orden_tipico": 6,
            "requiere_registro_parametros": True,
            "parametros_esperados": [
                {"nombre": "Tiempo de mezcla", "unidad": "min", "min": 3, "max": 10}
            ]
        },
        {
            "codigo": "EP-07",
            "nombre": "Compresión",
            "descripcion": "Compresión de comprimidos en tableteadora",
            "orden_tipico": 7,
            "requiere_registro_parametros": True,
            "parametros_esperados": [
                {"nombre": "Fuerza compresión", "unidad": "kN", "min": 5, "max": 30},
                {"nombre": "Velocidad", "unidad": "comp/min", "min": 3000, "max": 8000},
                {"nombre": "Peso promedio", "unidad": "mg", "min": 180, "max": 220}
            ]
        },
        {
            "codigo": "EP-08",
            "nombre": "Recubrimiento (Coating)",
            "descripcion": "Aplicación de recubrimiento entérico o película",
            "orden_tipico": 8,
            "requiere_registro_parametros": True,
            "parametros_esperados": [
                {"nombre": "Temperatura entrada", "unidad": "°C", "min": 40, "max": 60},
                {"nombre": "Ganancia peso", "unidad": "%", "min": 2, "max": 4}
            ]
        },
        {
            "codigo": "EP-09",
            "nombre": "Emblistado (Blister)",
            "descripcion": "Envasado primario en blisters",
            "orden_tipico": 9,
            "requiere_registro_parametros": True,
            "parametros_esperados": [
                {"nombre": "Temperatura sellado", "unidad": "°C", "min": 160, "max": 200},
                {"nombre": "Presión", "unidad": "bar", "min": 4, "max": 8}
            ]
        },
        {
            "codigo": "EP-10",
            "nombre": "Empaque Secundario",
            "descripcion": "Envasado en cajas y preparación para distribución",
            "orden_tipico": 10,
            "requiere_registro_parametros": False
        }
    ]
    
    created = 0
    for data in etapas_data:
        etapa, created_flag = EtapaProduccion.objects.get_or_create(
            codigo=data["codigo"],
            defaults=data
        )
        if created_flag:
            created += 1
            print(f"  [OK] Created: {etapa.codigo} - {etapa.nombre}")
    
    print(f"[OK] Created {created} production stages\n")

def main():
    print("=" * 80)
    print("SIPROSA MES - Production Data Setup")
    print("=" * 80)
    print()
    
    create_etapas_produccion()
    
    print("=" * 80)
    print("[OK] Production data setup completed successfully!")
    print("=" * 80)
    print()
    print("Summary:")
    print(f"  - Production Stages: {EtapaProduccion.objects.count()}")
    print()

if __name__ == "__main__":
    main()

