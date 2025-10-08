"""
Create comprehensive production-ready data for SIPROSA MES
This script seeds the database with realistic data for demonstration and testing
"""

import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import (
    # Catálogos
    Ubicacion, Maquina, Producto, Formula, EtapaProduccion, Turno, TipoDocumento,
    # Producción
    Lote, LoteEtapa,
    # Inventario
    CategoriaInsumo, Insumo, LoteInsumo, Repuesto,
    # Mantenimiento
    TipoMantenimiento, OrdenTrabajo,
    # Incidentes
    TipoIncidente, Incidente,
    # Usuarios
    UserProfile
)

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

def create_insumos_and_categories():
    """Create input materials and categories"""
    print("[*] Creating Input Materials...")
    
    # Create categories
    categorias_data = [
        {"codigo": "MP", "nombre": "Materias Primas Activas"},
        {"codigo": "EX", "nombre": "Excipientes"},
        {"codigo": "ENV", "nombre": "Material de Envase"},
        {"codigo": "CONS", "nombre": "Material Consumible"}
    ]
    
    for cat_data in categorias_data:
        CategoriaInsumo.objects.get_or_create(
            codigo=cat_data["codigo"],
            defaults=cat_data
        )
    
    cat_mp = CategoriaInsumo.objects.get(codigo="MP")
    cat_ex = CategoriaInsumo.objects.get(codigo="EX")
    cat_env = CategoriaInsumo.objects.get(codigo="ENV")
    
    # Create materials
    insumos_data = [
        {
            "codigo": "MP-001",
            "nombre": "Ibuprofeno",
            "categoria": cat_mp,
            "unidad_medida": "kg",
            "stock_minimo": Decimal("50.00"),
            "stock_maximo": Decimal("500.00"),
            "punto_reorden": Decimal("100.00"),
            "tiempo_vida_util_meses": 36,
            "proveedor_principal": "Farmacéutica XYZ S.A."
        },
        {
            "codigo": "MP-002",
            "nombre": "Paracetamol",
            "categoria": cat_mp,
            "unidad_medida": "kg",
            "stock_minimo": Decimal("100.00"),
            "stock_maximo": Decimal("1000.00"),
            "punto_reorden": Decimal("200.00"),
            "tiempo_vida_util_meses": 48,
            "proveedor_principal": "Pharma Supply Ltd."
        },
        {
            "codigo": "EX-001",
            "nombre": "Celulosa Microcristalina",
            "categoria": cat_ex,
            "unidad_medida": "kg",
            "stock_minimo": Decimal("200.00"),
            "stock_maximo": Decimal("2000.00"),
            "punto_reorden": Decimal("400.00"),
            "tiempo_vida_util_meses": 60,
            "proveedor_principal": "Excipientes Industriales"
        },
        {
            "codigo": "EX-002",
            "nombre": "Estearato de Magnesio",
            "categoria": cat_ex,
            "unidad_medida": "kg",
            "stock_minimo": Decimal("20.00"),
            "stock_maximo": Decimal("100.00"),
            "punto_reorden": Decimal("40.00"),
            "tiempo_vida_util_meses": 48,
            "proveedor_principal": "Excipientes Industriales"
        },
        {
            "codigo": "EX-003",
            "nombre": "Almidón de Maíz",
            "categoria": cat_ex,
            "unidad_medida": "kg",
            "stock_minimo": Decimal("100.00"),
            "stock_maximo": Decimal("500.00"),
            "punto_reorden": Decimal("200.00"),
            "tiempo_vida_util_meses": 36,
            "proveedor_principal": "Natural Ingredients Co."
        },
        {
            "codigo": "ENV-001",
            "nombre": "Blister PVC/PVDC",
            "categoria": cat_env,
            "unidad_medida": "unidades",
            "stock_minimo": Decimal("10000.00"),
            "stock_maximo": Decimal("100000.00"),
            "punto_reorden": Decimal("20000.00"),
            "tiempo_vida_util_meses": 24,
            "proveedor_principal": "Packaging Solutions SA"
        },
        {
            "codigo": "ENV-002",
            "nombre": "Cajas Plegadizas",
            "categoria": cat_env,
            "unidad_medida": "unidades",
            "stock_minimo": Decimal("5000.00"),
            "stock_maximo": Decimal("50000.00"),
            "punto_reorden": Decimal("10000.00"),
            "tiempo_vida_util_meses": 12,
            "proveedor_principal": "Cartón y Empaques"
        }
    ]
    
    created = 0
    for data in insumos_data:
        insumo, created_flag = Insumo.objects.get_or_create(
            codigo=data["codigo"],
            defaults=data
        )
        if created_flag:
            created += 1
            print(f"  [OK] Created: {insumo.codigo} - {insumo.nombre}")
    
    print(f"[OK] Created {created} input materials\n")
    
    # Create some stock lots
    print("[*] Creating Stock Lots...")
    
    ubicacion_almacen = Ubicacion.objects.filter(tipo='ALMACEN').first()
    if not ubicacion_almacen:
        ubicacion_almacen = Ubicacion.objects.create(
            codigo="ALM-01",
            nombre="Almacén Principal",
            tipo="ALMACEN",
            descripcion="Almacén principal de materias primas"
        )
    
    admin_user = User.objects.filter(is_superuser=True).first()
    
    lotes_insumo_data = []
    for insumo in Insumo.objects.all()[:4]:  # Create lots for first 4 materials
        lote_data = {
            "insumo": insumo,
            "codigo_lote_proveedor": f"PROV-{insumo.codigo}-2024-001",
            "fecha_recepcion": datetime.now().date() - timedelta(days=30),
            "fecha_vencimiento": datetime.now().date() + timedelta(days=365),
            "cantidad_inicial": Decimal("500.00"),
            "cantidad_actual": Decimal("450.00"),
            "unidad": insumo.unidad_medida,
            "ubicacion": ubicacion_almacen,
            "proveedor": insumo.proveedor_principal,
            "estado": "APROBADO",
            "aprobado_por": admin_user,
            "fecha_aprobacion": datetime.now().date() - timedelta(days=25)
        }
        lotes_insumo_data.append(lote_data)
    
    created_lots = 0
    for lot_data in lotes_insumo_data:
        lot, created_flag = LoteInsumo.objects.get_or_create(
            codigo_lote_proveedor=lot_data["codigo_lote_proveedor"],
            defaults=lot_data
        )
        if created_flag:
            created_lots += 1
            print(f"  [OK] Created lot: {lot.codigo_lote_proveedor}")
    
    print(f"[OK] Created {created_lots} stock lots\n")

def create_repuestos():
    """Create spare parts"""
    print("[*] Creating Spare Parts...")
    
    ubicacion_mant = Ubicacion.objects.filter(tipo='MANTENIMIENTO').first()
    if not ubicacion_mant:
        ubicacion_mant = Ubicacion.objects.create(
            codigo="MANT-01",
            nombre="Taller de Mantenimiento",
            tipo="MANTENIMIENTO",
            descripcion="Taller y almacén de mantenimiento"
        )
    
    maquinas = list(Maquina.objects.all()[:2])
    
    repuestos_data = [
        {
            "codigo": "REP-001",
            "nombre": "Filtro HEPA para cabina",
            "categoria": "CONSUMIBLE",
            "stock_minimo": 2,
            "stock_actual": 5,
            "punto_reorden": 3,
            "ubicacion": ubicacion_mant,
            "tiempo_reposicion_dias": 15,
            "critico": True
        },
        {
            "codigo": "REP-002",
            "nombre": "Rodamiento SKF 6208",
            "categoria": "MECANICO",
            "stock_minimo": 4,
            "stock_actual": 8,
            "punto_reorden": 6,
            "ubicacion": ubicacion_mant,
            "tiempo_reposicion_dias": 30,
            "critico": True
        },
        {
            "codigo": "REP-003",
            "nombre": "Banda transportadora",
            "categoria": "MECANICO",
            "stock_minimo": 1,
            "stock_actual": 2,
            "punto_reorden": 1,
            "ubicacion": ubicacion_mant,
            "tiempo_reposicion_dias": 45,
            "critico": True
        },
        {
            "codigo": "REP-004",
            "nombre": "Sensor de temperatura PT100",
            "categoria": "ELECTRONICO",
            "stock_minimo": 2,
            "stock_actual": 4,
            "punto_reorden": 3,
            "ubicacion": ubicacion_mant,
            "tiempo_reposicion_dias": 20,
            "critico": False
        }
    ]
    
    created = 0
    for data in repuestos_data:
        repuesto, created_flag = Repuesto.objects.get_or_create(
            codigo=data["codigo"],
            defaults=data
        )
        if created_flag:
            # Add compatible machines
            if maquinas:
                repuesto.maquinas_compatibles.add(*maquinas)
            created += 1
            print(f"  [OK] Created: {repuesto.codigo} - {repuesto.nombre}")
    
    print(f"[OK] Created {created} spare parts\n")

def main():
    print("=" * 80)
    print("SIPROSA MES - Production Data Setup")
    print("=" * 80)
    print()
    
    create_etapas_produccion()
    create_insumos_and_categories()
    create_repuestos()
    
    print("=" * 80)
    print("[OK] Production data setup completed successfully!")
    print("=" * 80)
    print()
    print("Summary:")
    print(f"  - Production Stages: {EtapaProduccion.objects.count()}")
    print(f"  - Input Materials: {Insumo.objects.count()}")
    print(f"  - Stock Lots: {LoteInsumo.objects.count()}")
    print(f"  - Spare Parts: {Repuesto.objects.count()}")
    print()

if __name__ == "__main__":
    main()

