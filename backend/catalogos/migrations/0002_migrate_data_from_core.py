"""
Migración para mover datos desde core a catalogos
"""
from django.db import migrations


def migrate_data_forward(apps, schema_editor):
    # Importar modelos antiguos y nuevos
    Core_Ubicacion = apps.get_model('core', 'Ubicacion')
    Core_Maquina = apps.get_model('core', 'Maquina')
    Core_Producto = apps.get_model('core', 'Producto')
    Core_Formula = apps.get_model('core', 'Formula')
    Core_EtapaProduccion = apps.get_model('core', 'EtapaProduccion')
    Core_Turno = apps.get_model('core', 'Turno')

    Catalogo_Ubicacion = apps.get_model('catalogos', 'Ubicacion')
    Catalogo_Maquina = apps.get_model('catalogos', 'Maquina')
    Catalogo_Producto = apps.get_model('catalogos', 'Producto')
    Catalogo_Formula = apps.get_model('catalogos', 'Formula')
    Catalogo_EtapaProduccion = apps.get_model('catalogos', 'EtapaProduccion')
    Catalogo_Turno = apps.get_model('catalogos', 'Turno')

    # Crear diccionario para mapear IDs antiguos a nuevos
    ubicacion_map = {}

    # Migrar ubicaciones
    for ubicacion in Core_Ubicacion.objects.all():
        nueva_ubicacion = Catalogo_Ubicacion.objects.create(
            id=ubicacion.id,
            codigo=ubicacion.codigo,
            nombre=ubicacion.nombre,
            descripcion=ubicacion.descripcion,
            planta=ubicacion.planta,
            activa=ubicacion.activa,
        )
        ubicacion_map[ubicacion.id] = nueva_ubicacion

    # Migrar máquinas
    for maquina in Core_Maquina.objects.all():
        nueva_maquina = Catalogo_Maquina.objects.create(
            id=maquina.id,
            codigo=maquina.codigo,
            nombre=maquina.nombre,
            tipo=maquina.tipo,
            fabricante=maquina.fabricante,
            modelo=maquina.modelo,
            numero_serie=maquina.numero_serie,
            año_fabricacion=maquina.año_fabricacion,
            ubicacion=ubicacion_map[maquina.ubicacion.id],
            descripcion=maquina.descripcion,
            capacidad_nominal=maquina.capacidad_nominal,
            unidad_capacidad=maquina.unidad_capacidad,
            activa=maquina.activa,
            requiere_calificacion=maquina.requiere_calificacion,
            fecha_instalacion=maquina.fecha_instalacion,
            imagen=maquina.imagen,
            documentos=maquina.documentos,
        )

    # Migrar productos
    for producto in Core_Producto.objects.all():
        nuevo_producto = Catalogo_Producto.objects.create(
            id=producto.id,
            codigo=producto.codigo,
            nombre=producto.nombre,
            tipo=producto.tipo,
            presentacion=producto.presentacion,
            concentracion=producto.concentracion,
            descripcion=producto.descripcion,
            activo=producto.activo,
            imagen=producto.imagen,
            documentos=producto.documentos,
        )

    # Migrar etapas de producción
    for etapa in Core_EtapaProduccion.objects.all():
        nueva_etapa = Catalogo_EtapaProduccion.objects.create(
            id=etapa.id,
            codigo=etapa.codigo,
            nombre=etapa.nombre,
            descripcion=etapa.descripcion,
            duracion_tipica=etapa.duracion_tipica,
            requiere_validacion=etapa.requiere_validacion,
            activa=etapa.activa,
            parametros=etapa.parametros,
        )
        # Asignar máquinas permitidas
        nueva_etapa.maquinas_permitidas.set([
            Catalogo_Maquina.objects.get(id=m.id) 
            for m in etapa.maquinas_permitidas.all()
        ])

    # Migrar fórmulas
    for formula in Core_Formula.objects.all():
        nueva_formula = Catalogo_Formula.objects.create(
            id=formula.id,
            codigo=formula.codigo,
            version=formula.version,
            producto=Catalogo_Producto.objects.get(id=formula.producto.id),
            descripcion=formula.descripcion,
            tamaño_lote=formula.tamaño_lote,
            unidad=formula.unidad,
            tiempo_total=formula.tiempo_total,
            activa=formula.activa,
            aprobada=formula.aprobada,
            ingredientes=formula.ingredientes,
            etapas=formula.etapas,
        )

    # Migrar turnos
    for turno in Core_Turno.objects.all():
        nuevo_turno = Catalogo_Turno.objects.create(
            id=turno.id,
            codigo=turno.codigo,
            nombre=turno.nombre,
            hora_inicio=turno.hora_inicio,
            hora_fin=turno.hora_fin,
            activo=turno.activo,
        )


def migrate_data_backward(apps, schema_editor):
    # No implementamos la migración hacia atrás ya que es un cambio estructural
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('catalogos', '0001_initial'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_data_forward, migrate_data_backward),
    ]