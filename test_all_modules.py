#!/usr/bin/env python3
"""
Script de testing exhaustivo para todos los módulos del MES
Prueba crear, editar y eliminar elementos en cada módulo
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuración
BASE_URL = "http://localhost:8000/api"
FRONTEND_URL = "http://localhost:3000"

# Credenciales de prueba
CREDENTIALS = {
    "admin": {"username": "admin", "password": "sandz334@"},
    "operario1": {"username": "operario1", "password": "sandz334@"},
    "supervisor1": {"username": "supervisor1", "password": "sandz334@"}
}

class MESTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_results = {}
        
    def login(self, user_type="admin"):
        """Iniciar sesión con un usuario específico"""
        print(f"\n🔐 Iniciando sesión como {user_type}...")
        
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login/",
                json=CREDENTIALS[user_type]
            )
            
            if response.status_code == 200:
                data = response.json()
                self.tokens[user_type] = data['access']
                self.session.headers.update({
                    'Authorization': f'Bearer {data["access"]}'
                })
                print(f"✅ Login exitoso como {user_type}")
                return True
            else:
                print(f"❌ Error en login: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            return False
    
    def test_module(self, module_name, endpoint, test_data, update_data=None):
        """Probar un módulo específico: crear, editar, eliminar"""
        print(f"\n🧪 Probando módulo: {module_name}")
        results = {"created": False, "updated": False, "deleted": False, "errors": []}
        
        try:
            # 1. CREAR
            print(f"  📝 Creando {module_name}...")
            create_response = self.session.post(f"{BASE_URL}/{endpoint}/", json=test_data)
            
            if create_response.status_code in [200, 201]:
                created_item = create_response.json()
                item_id = created_item.get('id')
                results["created"] = True
                print(f"  ✅ {module_name} creado con ID: {item_id}")
                
                # 2. EDITAR (si hay datos de actualización)
                if update_data and item_id:
                    print(f"  ✏️ Editando {module_name}...")
                    update_response = self.session.put(
                        f"{BASE_URL}/{endpoint}/{item_id}/", 
                        json=update_data
                    )
                    
                    if update_response.status_code in [200, 201]:
                        results["updated"] = True
                        print(f"  ✅ {module_name} editado correctamente")
                    else:
                        results["errors"].append(f"Error al editar: {update_response.status_code}")
                        print(f"  ❌ Error al editar: {update_response.text}")
                
                # 3. ELIMINAR
                print(f"  🗑️ Eliminando {module_name}...")
                delete_response = self.session.delete(f"{BASE_URL}/{endpoint}/{item_id}/")
                
                if delete_response.status_code in [200, 204]:
                    results["deleted"] = True
                    print(f"  ✅ {module_name} eliminado correctamente")
                else:
                    results["errors"].append(f"Error al eliminar: {delete_response.status_code}")
                    print(f"  ❌ Error al eliminar: {delete_response.text}")
                    
            else:
                results["errors"].append(f"Error al crear: {create_response.status_code}")
                print(f"  ❌ Error al crear: {create_response.text}")
                
        except Exception as e:
            results["errors"].append(f"Excepción: {str(e)}")
            print(f"  ❌ Excepción: {e}")
        
        self.test_results[module_name] = results
        return results
    
    def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        print("🚀 INICIANDO TESTING EXHAUSTIVO DEL MES")
        print("=" * 50)
        
        # Login como admin
        if not self.login("admin"):
            print("❌ No se pudo iniciar sesión. Abortando tests.")
            return
        
        # Datos de prueba para cada módulo
        test_cases = {
            "productos": {
                "endpoint": "productos",
                "test_data": {
                    "codigo": f"TEST-PROD-{int(time.time())}",
                    "nombre": "Producto de Prueba",
                    "forma_farmaceutica": "COMPRIMIDO",
                    "principio_activo": "Principio Test",
                    "concentracion": "500mg",
                    "unidad_medida": "comprimidos",
                    "lote_minimo": 1000,
                    "lote_optimo": 5000,
                    "tiempo_vida_util_meses": 24,
                    "requiere_cadena_frio": False,
                    "registro_anmat": "TEST123",
                    "activo": True
                },
                "update_data": {
                    "nombre": "Producto de Prueba Actualizado",
                    "concentracion": "600mg"
                }
            },
            "maquinas": {
                "endpoint": "maquinas",
                "test_data": {
                    "codigo": f"TEST-MAQ-{int(time.time())}",
                    "nombre": "Máquina de Prueba",
                    "tipo": "COMPRESION",
                    "fabricante": "Fabricante Test",
                    "modelo": "Modelo Test",
                    "numero_serie": f"SN{int(time.time())}",
                    "año_fabricacion": 2023,
                    "descripcion": "Máquina de prueba para testing",
                    "capacidad_nominal": 1000.0,
                    "unidad_capacidad": "comprimidos/hora",
                    "activa": True,
                    "requiere_calificacion": False,
                    "fecha_instalacion": "2023-01-01"
                },
                "update_data": {
                    "nombre": "Máquina de Prueba Actualizada",
                    "capacidad_nominal": 1200.0
                }
            },
            "insumos": {
                "endpoint": "insumos",
                "test_data": {
                    "codigo": f"TEST-INS-{int(time.time())}",
                    "nombre": "Insumo de Prueba",
                    "categoria": "MATERIA_PRIMA",
                    "unidad_medida": "kg",
                    "stock_minimo": 100,
                    "stock_maximo": 1000,
                    "punto_reorden": 200,
                    "requiere_cadena_frio": False,
                    "requiere_control_lote": True,
                    "tiempo_vida_util_meses": 12,
                    "proveedor_principal": "Proveedor Test",
                    "codigo_proveedor": "PROV123",
                    "precio_unitario": 25.50,
                    "activo": True,
                    "ficha_tecnica_url": "https://test.com/ficha.pdf"
                },
                "update_data": {
                    "nombre": "Insumo de Prueba Actualizado",
                    "precio_unitario": 30.00
                }
            },
            "ubicaciones": {
                "endpoint": "ubicaciones",
                "test_data": {
                    "codigo": f"TEST-UBI-{int(time.time())}",
                    "nombre": "Ubicación de Prueba",
                    "descripcion": "Ubicación para testing",
                    "activa": True
                },
                "update_data": {
                    "nombre": "Ubicación de Prueba Actualizada"
                }
            },
            "turnos": {
                "endpoint": "turnos",
                "test_data": {
                    "codigo": f"TEST-TUR-{int(time.time())}",
                    "nombre": "Turno de Prueba",
                    "hora_inicio": "08:00:00",
                    "hora_fin": "16:00:00",
                    "descripcion": "Turno de prueba para testing",
                    "activo": True
                },
                "update_data": {
                    "nombre": "Turno de Prueba Actualizado"
                }
            },
            "etapas-produccion": {
                "endpoint": "etapas-produccion",
                "test_data": {
                    "codigo": f"TEST-ETA-{int(time.time())}",
                    "nombre": "Etapa de Prueba",
                    "descripcion": "Etapa para testing",
                    "orden_tipico": 1,
                    "tiempo_estimado_minutos": 60,
                    "activa": True
                },
                "update_data": {
                    "nombre": "Etapa de Prueba Actualizada"
                }
            }
        }
        
        # Ejecutar pruebas para cada módulo
        for module_name, test_case in test_cases.items():
            self.test_module(
                module_name,
                test_case["endpoint"],
                test_case["test_data"],
                test_case.get("update_data")
            )
            time.sleep(1)  # Pausa entre pruebas
        
        # Mostrar resumen
        self.show_summary()
    
    def show_summary(self):
        """Mostrar resumen de resultados"""
        print("\n" + "=" * 50)
        print("📊 RESUMEN DE RESULTADOS")
        print("=" * 50)
        
        total_modules = len(self.test_results)
        successful_modules = 0
        
        for module_name, results in self.test_results.items():
            status = "✅" if all([results["created"], results["updated"], results["deleted"]]) else "❌"
            if all([results["created"], results["updated"], results["deleted"]]):
                successful_modules += 1
            
            print(f"\n{status} {module_name.upper()}:")
            print(f"  Crear: {'✅' if results['created'] else '❌'}")
            print(f"  Editar: {'✅' if results['updated'] else '❌'}")
            print(f"  Eliminar: {'✅' if results['deleted'] else '❌'}")
            
            if results["errors"]:
                print(f"  Errores: {len(results['errors'])}")
                for error in results["errors"]:
                    print(f"    - {error}")
        
        print(f"\n🎯 RESULTADO FINAL:")
        print(f"  Módulos probados: {total_modules}")
        print(f"  Módulos exitosos: {successful_modules}")
        print(f"  Porcentaje de éxito: {(successful_modules/total_modules)*100:.1f}%")
        
        if successful_modules == total_modules:
            print("\n🎉 ¡TODOS LOS MÓDULOS FUNCIONAN CORRECTAMENTE!")
        else:
            print(f"\n⚠️ {total_modules - successful_modules} módulos tienen problemas")

if __name__ == "__main__":
    tester = MESTester()
    tester.run_all_tests()
