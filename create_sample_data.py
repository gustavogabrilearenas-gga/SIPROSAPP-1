"""
Script para crear datos de prueba en SIPROSA MES
"""
import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import (
    Ubicacion, Maquina, Producto, Formula, Turno, Lote,
    TipoMantenimiento, OrdenTrabajo, TipoIncidente, Incidente
)

def create_sample_data():
    print("🏭 Creando datos de prueba para SIPROSA MES...")
    
    # Obtener usuario admin
    admin = User.objects.get(username='admin')
    print(f"✅ Usuario admin encontrado: {admin}")
    
    # 1. UBICACIONES
    print("\n📍 Creando ubicaciones...")
    ubicaciones = []
    ubicaciones_data = [
        ('PROD-A', 'Producción Área A', 'PRODUCCION'),
        ('PROD-B', 'Producción Área B', 'PRODUCCION'),
        ('ALM-01', 'Almacén Principal', 'ALMACEN'),
        ('MANT-01', 'Taller de Mantenimiento', 'MANTENIMIENTO'),
    ]
    
    for codigo, nombre, tipo in ubicaciones_data:
        ubicacion, created = Ubicacion.objects.get_or_create(
            codigo=codigo,
            defaults={'nombre': nombre, 'tipo': tipo, 'activa': True}
        )
        ubicaciones.append(ubicacion)
        print(f"  {'✨' if created else '✓'} {codigo} - {nombre}")
    
    # 2. MÁQUINAS
    print("\n🔧 Creando máquinas...")
    maquinas = []
    maquinas_data = [
        ('MAQ-001', 'Compresora Fette 1', 'COMPRESION', ubicaciones[0], 150000),
        ('MAQ-002', 'Mezcladora IMA', 'MEZCLADO', ubicaciones[0], 500),
        ('MAQ-003', 'Granuladora Glatt', 'GRANULACION', ubicaciones[1], 200),
        ('MAQ-004', 'Emblistadora Uhlmann', 'EMBLISTADO', ubicaciones[1], 250),
    ]
    
    for codigo, nombre, tipo, ubicacion, capacidad in maquinas_data:
        maquina, created = Maquina.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'tipo': tipo,
                'ubicacion': ubicacion,
                'capacidad_nominal': capacidad,
                'unidad_capacidad': 'comprimidos/hora' if tipo == 'COMPRESION' else 'kg/batch',
                'activa': True,
                'fabricante': 'Diversos',
            }
        )
        maquinas.append(maquina)
        print(f"  {'✨' if created else '✓'} {codigo} - {nombre}")
    
    # 3. PRODUCTOS
    print("\n💊 Creando productos...")
    productos = []
    productos_data = [
        ('PROD-001', 'Ibuprofeno 600mg', 'COMPRIMIDO', 'Ibuprofeno', '600mg', 'comprimidos', 50000, 100000),
        ('PROD-002', 'Paracetamol 500mg', 'COMPRIMIDO', 'Paracetamol', '500mg', 'comprimidos', 100000, 200000),
        ('PROD-003', 'Amoxicilina 500mg', 'COMPRIMIDO', 'Amoxicilina', '500mg', 'comprimidos', 30000, 75000),
        ('PROD-004', 'Omeprazol 20mg', 'COMPRIMIDO', 'Omeprazol', '20mg', 'comprimidos', 50000, 100000),
    ]
    
    for codigo, nombre, forma, principio, concentracion, unidad, lote_min, lote_opt in productos_data:
        producto, created = Producto.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'forma_farmaceutica': forma,
                'principio_activo': principio,
                'concentracion': concentracion,
                'unidad_medida': unidad,
                'lote_minimo': lote_min,
                'lote_optimo': lote_opt,
                'tiempo_vida_util_meses': 24,
                'activo': True,
            }
        )
        productos.append(producto)
        print(f"  {'✨' if created else '✓'} {codigo} - {nombre}")
    
    # 4. FÓRMULAS
    print("\n📋 Creando fórmulas...")
    formulas = []
    for producto in productos:
        formula, created = Formula.objects.get_or_create(
            producto=producto,
            version='v1.0',
            defaults={
                'fecha_vigencia_desde': datetime.now().date(),
                'rendimiento_teorico': 95.0,
                'tiempo_estimado_horas': 8.0,
                'aprobada_por': admin,
                'fecha_aprobacion': datetime.now().date(),
                'activa': True,
            }
        )
        formulas.append(formula)
        print(f"  {'✨' if created else '✓'} Fórmula {producto.codigo} - {formula.version}")
    
    # 5. TURNOS
    print("\n⏰ Creando turnos...")
    turnos = []
    turnos_data = [
        ('M', 'Mañana', '07:00', '15:00'),
        ('T', 'Tarde', '15:00', '23:00'),
        ('N', 'Noche', '23:00', '07:00'),
    ]
    
    for codigo, nombre, hora_inicio, hora_fin in turnos_data:
        turno, created = Turno.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'hora_inicio': hora_inicio,
                'hora_fin': hora_fin,
                'activo': True,
            }
        )
        turnos.append(turno)
        print(f"  {'✨' if created else '✓'} {codigo} - {nombre}")
    
    # 6. LOTES DE PRODUCCIÓN
    print("\n🏭 Creando lotes de producción...")
    lotes = []
    estados = ['PLANIFICADO', 'EN_PROCESO', 'EN_PROCESO', 'FINALIZADO', 'FINALIZADO']
    prioridades = ['URGENTE', 'ALTA', 'NORMAL', 'NORMAL', 'BAJA']
    
    for i in range(5):
        fecha_inicio = datetime.now() - timedelta(days=4-i)
        fecha_fin = fecha_inicio + timedelta(days=1)
        
        lote, created = Lote.objects.get_or_create(
            codigo_lote=f'LOTE-2025-{str(i+1).zfill(3)}',
            defaults={
                'producto': productos[i % len(productos)],
                'formula': formulas[i % len(formulas)],
                'cantidad_planificada': (i + 1) * 50000,
                'cantidad_producida': (i + 1) * 47000 if estados[i] == 'FINALIZADO' else (i + 1) * 25000 if estados[i] == 'EN_PROCESO' else 0,
                'cantidad_rechazada': (i + 1) * 1000 if estados[i] == 'FINALIZADO' else 0,
                'unidad': 'comprimidos',
                'estado': estados[i],
                'prioridad': prioridades[i],
                'fecha_planificada_inicio': fecha_inicio,
                'fecha_real_inicio': fecha_inicio if estados[i] != 'PLANIFICADO' else None,
                'fecha_planificada_fin': fecha_fin,
                'fecha_real_fin': fecha_fin if estados[i] == 'FINALIZADO' else None,
                'turno': turnos[i % len(turnos)],
                'supervisor': admin,
                'creado_por': admin,
                'observaciones': f'Lote de prueba {i+1}',
            }
        )
        lotes.append(lote)
        print(f"  {'✨' if created else '✓'} {lote.codigo_lote} - {lote.producto.nombre} ({lote.estado})")
    
    # 7. TIPOS DE MANTENIMIENTO
    print("\n🔧 Creando tipos de mantenimiento...")
    tipos_mant = []
    tipos_data = [
        ('PREV', 'Preventivo'),
        ('CORR', 'Correctivo'),
        ('PRED', 'Predictivo'),
    ]
    
    for codigo, nombre in tipos_data:
        tipo, created = TipoMantenimiento.objects.get_or_create(
            codigo=codigo,
            defaults={'nombre': nombre, 'activo': True}
        )
        tipos_mant.append(tipo)
        print(f"  {'✨' if created else '✓'} {codigo} - {nombre}")
    
    # 8. ÓRDENES DE TRABAJO
    print("\n📝 Creando órdenes de trabajo...")
    ordenes = []
    estados_orden = ['ABIERTA', 'ASIGNADA', 'EN_PROCESO', 'COMPLETADA']
    prioridades_orden = ['URGENTE', 'ALTA', 'NORMAL', 'BAJA']
    
    for i in range(4):
        fecha_creacion = datetime.now() - timedelta(days=3-i)
        
        orden, created = OrdenTrabajo.objects.get_or_create(
            codigo=f'WO-2025-{str(i+1).zfill(3)}',
            defaults={
                'tipo': tipos_mant[i % len(tipos_mant)],
                'maquina': maquinas[i % len(maquinas)],
                'prioridad': prioridades_orden[i],
                'estado': estados_orden[i],
                'titulo': f'Mantenimiento {tipos_mant[i % len(tipos_mant)].nombre} - {maquinas[i % len(maquinas)].nombre}',
                'descripcion': f'Orden de trabajo de prueba {i+1}',
                'fecha_planificada': fecha_creacion + timedelta(days=1),
                'fecha_inicio': fecha_creacion if estados_orden[i] != 'ABIERTA' else None,
                'fecha_fin': fecha_creacion + timedelta(hours=4) if estados_orden[i] == 'COMPLETADA' else None,
                'creada_por': admin,
                'asignada_a': admin if estados_orden[i] != 'ABIERTA' else None,
                'completada_por': admin if estados_orden[i] == 'COMPLETADA' else None,
                'requiere_parada_produccion': i % 2 == 0,
            }
        )
        ordenes.append(orden)
        print(f"  {'✨' if created else '✓'} {orden.codigo} - {orden.titulo} ({orden.estado})")
    
    # 9. TIPOS DE INCIDENTE
    print("\n⚠️ Creando tipos de incidente...")
    tipos_inc = []
    tipos_inc_data = [
        ('INC-CALIDAD', 'Incidente de Calidad'),
        ('INC-EQUIPO', 'Falla de Equipo'),
        ('INC-SEGURIDAD', 'Incidente de Seguridad'),
    ]
    
    for codigo, nombre in tipos_inc_data:
        tipo, created = TipoIncidente.objects.get_or_create(
            codigo=codigo,
            defaults={'nombre': nombre, 'activo': True, 'requiere_investigacion': True}
        )
        tipos_inc.append(tipo)
        print(f"  {'✨' if created else '✓'} {codigo} - {nombre}")
    
    # 10. INCIDENTES
    print("\n🔥 Creando incidentes...")
    incidentes = []
    severidades = ['CRITICA', 'MAYOR', 'MODERADA']
    estados_inc = ['ABIERTO', 'EN_INVESTIGACION', 'CERRADO']
    
    for i in range(3):
        fecha_ocurrencia = datetime.now() - timedelta(days=2-i)
        
        incidente, created = Incidente.objects.get_or_create(
            codigo=f'INC-2025-{str(i+1).zfill(3)}',
            defaults={
                'tipo': tipos_inc[i],
                'severidad': severidades[i],
                'estado': estados_inc[i],
                'titulo': f'Incidente de prueba {i+1}',
                'descripcion': f'Descripción del incidente {i+1}',
                'fecha_ocurrencia': fecha_ocurrencia,
                'ubicacion': ubicaciones[i % len(ubicaciones)],
                'maquina': maquinas[i % len(maquinas)] if i < len(maquinas) else None,
                'lote_afectado': lotes[i] if i < len(lotes) else None,
                'reportado_por': admin,
                'asignado_a': admin if estados_inc[i] != 'ABIERTO' else None,
                'impacto_produccion': f'Impacto en producción: {i+1}' if i > 0 else '',
                'requiere_notificacion_anmat': i == 0,
                'fecha_cierre': datetime.now() if estados_inc[i] == 'CERRADO' else None,
                'cerrado_por': admin if estados_inc[i] == 'CERRADO' else None,
            }
        )
        incidentes.append(incidente)
        print(f"  {'✨' if created else '✓'} {incidente.codigo} - {incidente.titulo} ({incidente.severidad})")
    
    print("\n✅ ¡Datos de prueba creados exitosamente!")
    print(f"\n📊 Resumen:")
    print(f"  • {len(ubicaciones)} Ubicaciones")
    print(f"  • {len(maquinas)} Máquinas")
    print(f"  • {len(productos)} Productos")
    print(f"  • {len(formulas)} Fórmulas")
    print(f"  • {len(turnos)} Turnos")
    print(f"  • {len(lotes)} Lotes")
    print(f"  • {len(tipos_mant)} Tipos de Mantenimiento")
    print(f"  • {len(ordenes)} Órdenes de Trabajo")
    print(f"  • {len(tipos_inc)} Tipos de Incidente")
    print(f"  • {len(incidentes)} Incidentes")

if __name__ == '__main__':
    create_sample_data()

