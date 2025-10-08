"""
Script completo para crear datos realistas de prueba en SIPROSA MES
Incluye todos los módulos con datos interrelacionados
"""
import os
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from core.models import (
    UserProfile, Ubicacion, Maquina, Producto, Formula, EtapaProduccion,
    Turno, TipoMantenimiento, OrdenTrabajo,
    TipoIncidente, Incidente, Notificacion, TipoDocumento
)
from backend.produccion.models import Lote, LoteEtapa, Parada, ControlCalidad
from backend.inventario.models import (
    CategoriaInsumo, FormulaInsumo, Insumo,
    LoteInsumo, LoteInsumoConsumo, Repuesto,
)

def create_users():
    """Crear usuarios del sistema"""
    print("\n👥 Creando usuarios...")
    
    users_data = [
        {
            'username': 'admin',
            'email': 'admin@siprosa.com',
            'first_name': 'Administrador',
            'last_name': 'Sistema',
            'is_staff': True,
            'is_superuser': True,
            'password': 'sandz334@',
            'profile': {'legajo': 'ADM-001', 'area': 'ADMINISTRACION', 'turno_habitual': 'M'}
        },
        {
            'username': 'operario1',
            'email': 'operario1@siprosa.com',
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'is_staff': False,
            'is_superuser': False,
            'password': 'sandz334@',
            'profile': {'legajo': 'PROD-001', 'area': 'PRODUCCION', 'turno_habitual': 'M'}
        },
        {
            'username': 'supervisor1',
            'email': 'supervisor1@siprosa.com',
            'first_name': 'María',
            'last_name': 'González',
            'is_staff': True,
            'is_superuser': False,
            'password': 'sandz334@',
            'profile': {'legajo': 'SUP-001', 'area': 'PRODUCCION', 'turno_habitual': 'M'}
        },
        {
            'username': 'calidad1',
            'email': 'calidad1@siprosa.com',
            'first_name': 'Carlos',
            'last_name': 'Martínez',
            'is_staff': True,
            'is_superuser': False,
            'password': 'sandz334@',
            'profile': {'legajo': 'QA-001', 'area': 'CALIDAD', 'turno_habitual': 'M'}
        },
        {
            'username': 'mantenimiento1',
            'email': 'mantenimiento1@siprosa.com',
            'first_name': 'Roberto',
            'last_name': 'Fernández',
            'is_staff': False,
            'is_superuser': False,
            'password': 'sandz334@',
            'profile': {'legajo': 'MANT-001', 'area': 'MANTENIMIENTO', 'turno_habitual': 'T'}
        },
    ]
    
    created_users = []
    for user_data in users_data:
        profile_data = user_data.pop('profile')
        password = user_data.pop('password')
        
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults=user_data
        )
        
        if created:
            user.set_password(password)
            user.save()
            
            UserProfile.objects.get_or_create(
                user=user,
                defaults={**profile_data, 'fecha_ingreso': timezone.now().date()}
            )
            print(f"  ✨ {user.username} - {user.get_full_name()}")
        else:
            print(f"  ✓ {user.username} - {user.get_full_name()}")
        
        created_users.append(user)
    
    return created_users


def create_master_data(admin):
    """Crear datos maestros"""
    print("\n📋 Creando datos maestros...")
    
    # Ubicaciones
    ubicaciones_data = [
        ('PROD-A', 'Producción Área A', 'PRODUCCION', 'Área de producción principal'),
        ('PROD-B', 'Producción Área B', 'PRODUCCION', 'Área de producción secundaria'),
        ('ALM-MP', 'Almacén Materias Primas', 'ALMACEN', 'Almacén de materias primas y excipientes'),
        ('ALM-PT', 'Almacén Producto Terminado', 'ALMACEN', 'Almacén de productos terminados'),
        ('MANT-01', 'Taller Mantenimiento', 'MANTENIMIENTO', 'Taller de mantenimiento general'),
        ('CALIDAD', 'Laboratorio Calidad', 'SERVICIOS', 'Laboratorio de control de calidad'),
    ]
    
    ubicaciones = []
    for codigo, nombre, tipo, desc in ubicaciones_data:
        ubicacion, created = Ubicacion.objects.get_or_create(
            codigo=codigo,
            defaults={'nombre': nombre, 'tipo': tipo, 'descripcion': desc, 'activa': True}
        )
        ubicaciones.append(ubicacion)
        print(f"  {'✨' if created else '✓'} {codigo}")
    
    # Máquinas
    maquinas_data = [
        ('MAQ-COMP-01', 'Compresora Fette 2090', 'COMPRESION', ubicaciones[0], Decimal('180000'), 'comprimidos/hora', 'Fette', '2090i', 2018),
        ('MAQ-COMP-02', 'Compresora IMA Kilian', 'COMPRESION', ubicaciones[0], Decimal('150000'), 'comprimidos/hora', 'IMA', 'Kilian X50', 2020),
        ('MAQ-MEZ-01', 'Mezcladora Bin V-500', 'MEZCLADO', ubicaciones[0], Decimal('500'), 'kg/batch', 'Patterson-Kelley', 'V-500', 2017),
        ('MAQ-GRAN-01', 'Granuladora Glatt WSG-30', 'GRANULACION', ubicaciones[1], Decimal('200'), 'kg/batch', 'Glatt', 'WSG-30', 2019),
        ('MAQ-EMBL-01', 'Emblistadora Uhlmann UPS3', 'EMBLISTADO', ubicaciones[1], Decimal('250'), 'blisters/min', 'Uhlmann', 'UPS3', 2021),
    ]
    
    maquinas = []
    for codigo, nombre, tipo, ubicacion, capacidad, unidad, fabricante, modelo, año in maquinas_data:
        maquina, created = Maquina.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'tipo': tipo,
                'ubicacion': ubicacion,
                'capacidad_nominal': capacidad,
                'unidad_capacidad': unidad,
                'fabricante': fabricante,
                'modelo': modelo,
                'año_fabricacion': año,
                'activa': True,
                'requiere_calificacion': True,
                'fecha_instalacion': timezone.now().date() - timedelta(days=(2025-año)*365)
            }
        )
        maquinas.append(maquina)
        print(f"  {'✨' if created else '✓'} {codigo}")
    
    # Productos
    productos_data = [
        ('PROD-001', 'Ibuprofeno 600mg Comprimidos', 'COMPRIMIDO', 'Ibuprofeno', '600mg', 'comprimidos', 50000, 100000, 24, 'ANMAT-001'),
        ('PROD-002', 'Paracetamol 500mg Comprimidos', 'COMPRIMIDO', 'Paracetamol', '500mg', 'comprimidos', 100000, 200000, 36, 'ANMAT-002'),
        ('PROD-003', 'Amoxicilina 500mg Comprimidos', 'COMPRIMIDO', 'Amoxicilina', '500mg', 'comprimidos', 30000, 75000, 24, 'ANMAT-003'),
        ('PROD-004', 'Omeprazol 20mg Cápsulas', 'COMPRIMIDO', 'Omeprazol', '20mg', 'cápsulas', 50000, 100000, 24, 'ANMAT-004'),
        ('PROD-005', 'Atorvastatina 10mg Comprimidos', 'COMPRIMIDO', 'Atorvastatina', '10mg', 'comprimidos', 30000, 60000, 36, 'ANMAT-005'),
    ]
    
    productos = []
    for codigo, nombre, forma, principio, conc, unidad, lmin, lopt, vida, anmat in productos_data:
        producto, created = Producto.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'forma_farmaceutica': forma,
                'principio_activo': principio,
                'concentracion': conc,
                'unidad_medida': unidad,
                'lote_minimo': lmin,
                'lote_optimo': lopt,
                'tiempo_vida_util_meses': vida,
                'registro_anmat': anmat,
                'activo': True
            }
        )
        productos.append(producto)
        print(f"  {'✨' if created else '✓'} {codigo}")
    
    # Fórmulas
    formulas = []
    for producto in productos:
        formula, created = Formula.objects.get_or_create(
            producto=producto,
            version='v1.0',
            defaults={
                'fecha_vigencia_desde': timezone.now().date(),
                'rendimiento_teorico': Decimal('95.0') + Decimal(random.uniform(-3, 3)),
                'tiempo_estimado_horas': Decimal('8.0'),
                'aprobada_por': admin,
                'fecha_aprobacion': timezone.now().date(),
                'activa': True
            }
        )
        formulas.append(formula)
        print(f"  {'✨' if created else '✓'} Fórmula {producto.codigo}")
    
    # Turnos
    turnos_data = [
        ('M', 'Mañana', '07:00:00', '15:00:00'),
        ('T', 'Tarde', '15:00:00', '23:00:00'),
        ('N', 'Noche', '23:00:00', '07:00:00'),
    ]
    
    turnos = []
    for codigo, nombre, inicio, fin in turnos_data:
        turno, created = Turno.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'hora_inicio': inicio,
                'hora_fin': fin,
                'activo': True
            }
        )
        turnos.append(turno)
        print(f"  {'✨' if created else '✓'} Turno {codigo}")
    
    # Etapas de Producción
    etapas_data = [
        ('ETAPA-01', 'Pesada', 'Pesada de materias primas', 1, False),
        ('ETAPA-02', 'Mezclado', 'Mezclado de ingredientes', 2, True),
        ('ETAPA-03', 'Granulación', 'Granulación húmeda o seca', 3, True),
        ('ETAPA-04', 'Secado', 'Secado del granulado', 4, True),
        ('ETAPA-05', 'Compresión', 'Compresión de comprimidos', 5, True),
        ('ETAPA-06', 'Inspección', 'Inspección visual y control', 6, False),
        ('ETAPA-07', 'Acondicionamiento', 'Emblistado y empaque', 7, False),
    ]
    
    etapas_produccion = []
    for codigo, nombre, desc, orden, requiere in etapas_data:
        etapa, created = EtapaProduccion.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'descripcion': desc,
                'orden_tipico': orden,
                'requiere_registro_parametros': requiere,
                'parametros_esperados': [
                    {'nombre': 'Temperatura', 'unidad': '°C', 'min': 20, 'max': 25},
                    {'nombre': 'Humedad', 'unidad': '%', 'min': 40, 'max': 60}
                ] if requiere else [],
                'activa': True
            }
        )
        etapas_produccion.append(etapa)
        print(f"  {'✨' if created else '✓'} {codigo}")
    
    # Tipos de Documentos
    tipos_doc_data = [
        ('SOP', 'Standard Operating Procedure'),
        ('IT', 'Instrucción de Trabajo'),
        ('FT', 'Ficha Técnica'),
        ('REG', 'Registro'),
        ('EBR', 'Electronic Batch Record'),
    ]
    
    for codigo, nombre in tipos_doc_data:
        TipoDocumento.objects.get_or_create(
            codigo=codigo,
            defaults={'nombre': nombre, 'activo': True}
        )
    
    return {
        'ubicaciones': ubicaciones,
        'maquinas': maquinas,
        'productos': productos,
        'formulas': formulas,
        'turnos': turnos,
        'etapas_produccion': etapas_produccion
    }


def create_production_data(master_data, users):
    """Crear datos de producción"""
    print("\n🏭 Creando lotes de producción...")
    
    admin, operario, supervisor, calidad, mantenimiento = users[:5]
    productos = master_data['productos']
    formulas = master_data['formulas']
    turnos = master_data['turnos']
    maquinas = master_data['maquinas']
    etapas_produccion = master_data['etapas_produccion']
    
    estados_lote = [
        ('PLANIFICADO', 0, 0),
        ('EN_PROCESO', 0.5, 0.02),
        ('EN_PROCESO', 0.7, 0.03),
        ('FINALIZADO', 0.95, 0.05),
        ('FINALIZADO', 0.96, 0.04),
        ('FINALIZADO', 0.94, 0.06),
        ('LIBERADO', 0.95, 0.05),
    ]
    
    prioridades = ['URGENTE', 'ALTA', 'ALTA', 'NORMAL', 'NORMAL', 'NORMAL', 'BAJA']
    
    lotes = []
    for i in range(7):
        estado, avance, scrap = estados_lote[i]
        producto = productos[i % len(productos)]
        formula = formulas[i % len(formulas)]
        
        cantidad_planificada = producto.lote_optimo
        cantidad_producida = int(cantidad_planificada * avance) if estado != 'PLANIFICADO' else 0
        cantidad_rechazada = int(cantidad_planificada * scrap)
        
        fecha_inicio = timezone.now() - timedelta(days=6-i, hours=random.randint(0, 8))
        fecha_fin_plan = fecha_inicio + timedelta(days=1)
        fecha_fin_real = fecha_fin_plan + timedelta(hours=random.randint(-2, 4)) if estado in ['FINALIZADO', 'LIBERADO'] else None
        
        lote, created = Lote.objects.get_or_create(
            codigo_lote=f'LOTE-2025-{str(i+1).zfill(3)}',
            defaults={
                'producto': producto,
                'formula': formula,
                'cantidad_planificada': cantidad_planificada,
                'cantidad_producida': cantidad_producida,
                'cantidad_rechazada': cantidad_rechazada,
                'unidad': producto.unidad_medida,
                'estado': estado,
                'prioridad': prioridades[i],
                'fecha_planificada_inicio': fecha_inicio,
                'fecha_real_inicio': fecha_inicio if estado != 'PLANIFICADO' else None,
                'fecha_planificada_fin': fecha_fin_plan,
                'fecha_real_fin': fecha_fin_real,
                'turno': turnos[i % len(turnos)],
                'supervisor': supervisor,
                'creado_por': admin,
                'observaciones': f'Lote de producción {i+1} - Prioridad {prioridades[i]}',
            }
        )
        lotes.append(lote)
        print(f"  {'✨' if created else '✓'} {lote.codigo_lote} - {lote.producto.nombre} ({lote.estado})")
        
        # Crear etapas para lotes en proceso o finalizados
        if estado != 'PLANIFICADO' and created:
            num_etapas = len(etapas_produccion) if estado == 'FINALIZADO' else random.randint(2, 4)
            
            for j in range(num_etapas):
                etapa = etapas_produccion[j]
                maquina = maquinas[j % len(maquinas)]
                
                etapa_estado = 'COMPLETADO' if estado == 'FINALIZADO' or j < num_etapas - 1 else 'EN_PROCESO'
                
                fecha_ini_etapa = fecha_inicio + timedelta(hours=j*2)
                fecha_fin_etapa = fecha_ini_etapa + timedelta(hours=random.uniform(1.5, 3)) if etapa_estado == 'COMPLETADO' else None
                
                LoteEtapa.objects.create(
                    lote=lote,
                    etapa=etapa,
                    orden=j+1,
                    maquina=maquina,
                    estado=etapa_estado,
                    fecha_inicio=fecha_ini_etapa,
                    fecha_fin=fecha_fin_etapa,
                    operario=operario,
                    cantidad_entrada=Decimal(cantidad_planificada) if j == 0 else None,
                    cantidad_salida=Decimal(cantidad_producida) if j == num_etapas-1 else None,
                    cantidad_merma=Decimal(cantidad_rechazada) if j == num_etapas-1 else Decimal('0'),
                    observaciones=f'Etapa {etapa.nombre} ejecutada correctamente'
                )
    
    return lotes


def create_maintenance_data(master_data, users):
    """Crear datos de mantenimiento"""
    print("\n🔧 Creando datos de mantenimiento...")
    
    admin, operario, supervisor, calidad, mantenimiento = users[:5]
    maquinas = master_data['maquinas']
    
    # Tipos de mantenimiento
    tipos_data = [
        ('PREV', 'Preventivo', 'Mantenimiento preventivo programado'),
        ('CORR', 'Correctivo', 'Reparación de fallas'),
        ('PRED', 'Predictivo', 'Mantenimiento basado en condición'),
    ]
    
    tipos_mant = []
    for codigo, nombre, desc in tipos_data:
        tipo, created = TipoMantenimiento.objects.get_or_create(
            codigo=codigo,
            defaults={'nombre': nombre, 'descripcion': desc, 'activo': True}
        )
        tipos_mant.append(tipo)
        print(f"  {'✨' if created else '✓'} {codigo}")
    
    # Órdenes de trabajo
    estados_orden = ['ABIERTA', 'ASIGNADA', 'EN_PROCESO', 'PAUSADA', 'COMPLETADA', 'COMPLETADA']
    prioridades = ['URGENTE', 'ALTA', 'ALTA', 'NORMAL', 'NORMAL', 'BAJA']
    
    ordenes = []
    for i in range(6):
        fecha_creacion = timezone.now() - timedelta(days=5-i)
        fecha_planificada = fecha_creacion + timedelta(days=1)
        
        orden, created = OrdenTrabajo.objects.get_or_create(
            codigo=f'WO-2025-{str(i+1).zfill(3)}',
            defaults={
                'tipo': tipos_mant[i % len(tipos_mant)],
                'maquina': maquinas[i % len(maquinas)],
                'prioridad': prioridades[i],
                'estado': estados_orden[i],
                'titulo': f'Mantenimiento {tipos_mant[i % len(tipos_mant)].nombre} - {maquinas[i % len(maquinas)].nombre}',
                'descripcion': f'Descripción detallada del mantenimiento {i+1}',
                'fecha_planificada': fecha_planificada,
                'fecha_inicio': fecha_planificada if estados_orden[i] != 'ABIERTA' else None,
                'fecha_fin': fecha_planificada + timedelta(hours=random.uniform(2, 6)) if estados_orden[i] == 'COMPLETADA' else None,
                'creada_por': admin,
                'asignada_a': mantenimiento if estados_orden[i] != 'ABIERTA' else None,
                'completada_por': mantenimiento if estados_orden[i] == 'COMPLETADA' else None,
                'trabajo_realizado': f'Trabajo completado satisfactoriamente' if estados_orden[i] == 'COMPLETADA' else '',
                'requiere_parada_produccion': i % 2 == 0,
                'costo_estimado': Decimal(random.randint(500, 5000)),
                'costo_real': Decimal(random.randint(400, 4500)) if estados_orden[i] == 'COMPLETADA' else None,
            }
        )
        ordenes.append(orden)
        print(f"  {'✨' if created else '✓'} {orden.codigo} ({orden.estado})")
    
    return ordenes


def create_incidents_data(master_data, lotes, users):
    """Crear incidentes"""
    print("\n⚠️ Creando incidentes...")
    
    admin, operario, supervisor, calidad, mantenimiento = users[:5]
    ubicaciones = master_data['ubicaciones']
    maquinas = master_data['maquinas']
    
    # Tipos de incidente
    tipos_data = [
        ('INC-CAL', 'Incidente de Calidad', True),
        ('INC-EQU', 'Falla de Equipo', False),
        ('INC-SEG', 'Incidente de Seguridad', True),
        ('INC-PROC', 'Desviación de Proceso', True),
    ]
    
    tipos_inc = []
    for codigo, nombre, investigacion in tipos_data:
        tipo, created = TipoIncidente.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'requiere_investigacion': investigacion,
                'activo': True
            }
        )
        tipos_inc.append(tipo)
        print(f"  {'✨' if created else '✓'} {codigo}")
    
    # Incidentes
    severidades = ['CRITICA', 'MAYOR', 'MAYOR', 'MODERADA', 'MENOR']
    estados = ['ABIERTO', 'EN_INVESTIGACION', 'EN_INVESTIGACION', 'ACCION_CORRECTIVA', 'CERRADO']
    
    incidentes = []
    for i in range(5):
        fecha_ocurrencia = timezone.now() - timedelta(days=4-i, hours=random.randint(0, 8))
        
        incidente, created = Incidente.objects.get_or_create(
            codigo=f'INC-2025-{str(i+1).zfill(3)}',
            defaults={
                'tipo': tipos_inc[i % len(tipos_inc)],
                'severidad': severidades[i],
                'estado': estados[i],
                'titulo': f'Incidente {tipos_inc[i % len(tipos_inc)].nombre} #{i+1}',
                'descripcion': f'Descripción detallada del incidente {i+1}. Se detectó una anomalía que requiere investigación.',
                'fecha_ocurrencia': fecha_ocurrencia,
                'ubicacion': ubicaciones[i % len(ubicaciones)],
                'maquina': maquinas[i % len(maquinas)] if i < 3 else None,
                'lote_afectado': lotes[i] if i < len(lotes) else None,
                'reportado_por': operario,
                'asignado_a': calidad if estados[i] != 'ABIERTO' else None,
                'impacto_produccion': f'Impacto moderado en la producción' if i > 0 else 'Sin impacto en producción',
                'impacto_calidad': 'Requiere evaluación de calidad',
                'impacto_seguridad': 'Sin impacto en seguridad' if i > 2 else 'Requiere evaluación de seguridad',
                'requiere_notificacion_anmat': i == 0,
                'fecha_cierre': timezone.now() if estados[i] == 'CERRADO' else None,
                'cerrado_por': calidad if estados[i] == 'CERRADO' else None,
            }
        )
        incidentes.append(incidente)
        print(f"  {'✨' if created else '✓'} {incidente.codigo} ({incidente.severidad})")
    
    return incidentes


def create_notifications(users):
    """Crear notificaciones de prueba"""
    print("\n🔔 Creando notificaciones...")
    
    admin, operario, supervisor, calidad, mantenimiento = users[:5]
    
    notifications_data = [
        (supervisor, 'URGENTE', 'Lote LOTE-2025-001 requiere atención', 'El lote de producción LOTE-2025-001 tiene una desviación en el control de calidad', 'Lote', 1),
        (mantenimiento, 'ADVERTENCIA', 'OT WO-2025-001 vence en 24 horas', 'La orden de trabajo WO-2025-001 debe ser completada en las próximas 24 horas', 'OrdenTrabajo', 1),
        (calidad, 'INFO', 'Nuevo control de calidad registrado', 'Se ha registrado un nuevo control de calidad para el lote LOTE-2025-003', 'ControlCalidad', 1),
        (operario, 'ADVERTENCIA', 'Parada prolongada detectada', 'Se ha detectado una parada de más de 30 minutos en la máquina MAQ-COMP-01', 'Parada', 1),
        (admin, 'INFO', 'Resumen diario de producción', 'Se han producido 5 lotes en el día de hoy', 'Sistema', None),
    ]
    
    for usuario, tipo, titulo, mensaje, modelo, ref_id in notifications_data:
        Notificacion.objects.get_or_create(
            usuario=usuario,
            titulo=titulo,
            defaults={
                'tipo': tipo,
                'mensaje': mensaje,
                'referencia_modelo': modelo,
                'referencia_id': ref_id,
                'leida': False
            }
        )
    
    print(f"  ✨ {len(notifications_data)} notificaciones creadas")


def main():
    print("="*60)
    print("🏭 SIPROSA MES - Generación de Datos Completos")
    print("="*60)
    
    # 1. Crear usuarios
    users = create_users()
    admin = users[0]
    
    # 2. Crear datos maestros
    master_data = create_master_data(admin)
    
    # 3. Crear datos de producción
    lotes = create_production_data(master_data, users)
    
    # 4. Crear datos de mantenimiento
    ordenes = create_maintenance_data(master_data, users)
    
    # 5. Crear incidentes
    incidentes = create_incidents_data(master_data, lotes, users)
    
    # 6. Crear notificaciones
    create_notifications(users)
    
    print("\n" + "="*60)
    print("✅ ¡Datos creados exitosamente!")
    print("="*60)
    print(f"\n📊 Resumen:")
    print(f"  • {len(users)} Usuarios")
    print(f"  • {len(master_data['ubicaciones'])} Ubicaciones")
    print(f"  • {len(master_data['maquinas'])} Máquinas")
    print(f"  • {len(master_data['productos'])} Productos")
    print(f"  • {len(lotes)} Lotes de Producción")
    print(f"  • {len(ordenes)} Órdenes de Trabajo")
    print(f"  • {len(incidentes)} Incidentes")
    print("\n🔐 Credenciales de acceso:")
    print("  • admin / sandz334@")
    print("  • operario1 / sandz334@")
    print("  • supervisor1 / sandz334@")
    print("  • calidad1 / sandz334@")
    print("  • mantenimiento1 / sandz334@")
    print("\n🌐 Frontend: http://localhost:3000")
    print("🔧 Backend: http://localhost:8000")
    print("="*60)


if __name__ == '__main__':
    main()

