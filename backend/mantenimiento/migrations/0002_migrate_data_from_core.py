"""Migración para mover datos históricos desde core a mantenimiento."""
from django.core.management.color import no_style
from django.db import connection, migrations


def reset_sequences(apps, model_names):
    if connection.vendor != "postgresql":
        return

    style = no_style()
    models = [apps.get_model("mantenimiento", model_name) for model_name in model_names]
    sql_statements = connection.ops.sequence_reset_sql(style, models)
    if not sql_statements:
        return

    with connection.cursor() as cursor:
        for statement in sql_statements:
            cursor.execute(statement)


def migrate_data_forward(apps, schema_editor):
    TipoMantenimientoCore = apps.get_model("core", "TipoMantenimiento")
    PlanMantenimientoCore = apps.get_model("core", "PlanMantenimiento")
    OrdenTrabajoCore = apps.get_model("core", "OrdenTrabajo")
    HistorialMantenimientoCore = apps.get_model("core", "HistorialMantenimiento")

    TipoMantenimientoNuevo = apps.get_model("mantenimiento", "TipoMantenimiento")
    PlanMantenimientoNuevo = apps.get_model("mantenimiento", "PlanMantenimiento")
    OrdenTrabajoNuevo = apps.get_model("mantenimiento", "OrdenTrabajo")
    HistorialMantenimientoNuevo = apps.get_model("mantenimiento", "HistorialMantenimiento")

    MaquinaCatalogo = apps.get_model("catalogos", "Maquina")

    if TipoMantenimientoNuevo.objects.exists():
        # Si ya se migraron datos no hacemos nada.
        return

    tipo_map = {}
    for tipo in TipoMantenimientoCore.objects.all().order_by("id"):
        nuevo_tipo = TipoMantenimientoNuevo.objects.create(
            id=tipo.id,
            codigo=tipo.codigo,
            nombre=tipo.nombre,
            descripcion=tipo.descripcion,
            activo=tipo.activo,
        )
        tipo_map[tipo.id] = nuevo_tipo

    plan_map = {}
    for plan in PlanMantenimientoCore.objects.all().order_by("id"):
        maquina = MaquinaCatalogo.objects.filter(pk=plan.maquina_id).first()
        tipo = tipo_map.get(plan.tipo_id)
        if not maquina or not tipo:
            continue

        nuevo_plan = PlanMantenimientoNuevo.objects.create(
            id=plan.id,
            codigo=plan.codigo,
            nombre=plan.nombre,
            descripcion=plan.descripcion,
            tipo=tipo,
            maquina=maquina,
            frecuencia_dias=plan.frecuencia_dias,
            frecuencia_horas_uso=plan.frecuencia_horas_uso,
            frecuencia_ciclos=plan.frecuencia_ciclos,
            tareas=plan.tareas,
            repuestos_necesarios=plan.repuestos_necesarios,
            duracion_estimada_horas=plan.duracion_estimada_horas,
            activo=plan.activo,
            creado_por_id=plan.creado_por_id,
            fecha_creacion=plan.fecha_creacion,
        )
        plan_map[plan.id] = nuevo_plan

    orden_map = {}
    for orden in OrdenTrabajoCore.objects.all().order_by("id"):
        maquina = MaquinaCatalogo.objects.filter(pk=orden.maquina_id).first()
        tipo = tipo_map.get(orden.tipo_id)
        if not maquina or not tipo:
            continue

        nuevo_orden = OrdenTrabajoNuevo.objects.create(
            id=orden.id,
            codigo=orden.codigo,
            tipo=tipo,
            maquina=maquina,
            plan_mantenimiento=plan_map.get(orden.plan_mantenimiento_id),
            prioridad=orden.prioridad,
            estado=orden.estado,
            titulo=orden.titulo,
            descripcion=orden.descripcion,
            fecha_creacion=orden.fecha_creacion,
            fecha_planificada=orden.fecha_planificada,
            fecha_inicio=orden.fecha_inicio,
            fecha_fin=orden.fecha_fin,
            duracion_real_horas=orden.duracion_real_horas,
            trabajo_realizado=orden.trabajo_realizado,
            observaciones=orden.observaciones,
            requiere_parada_produccion=orden.requiere_parada_produccion,
            costo_estimado=orden.costo_estimado,
            costo_real=orden.costo_real,
            creada_por_id=orden.creada_por_id,
            asignada_a_id=orden.asignada_a_id,
            completada_por_id=orden.completada_por_id,
        )
        orden_map[orden.id] = nuevo_orden

    for historial in HistorialMantenimientoCore.objects.all().order_by("id"):
        maquina = MaquinaCatalogo.objects.filter(pk=historial.maquina_id).first()
        tipo = tipo_map.get(historial.tipo_id)
        orden = orden_map.get(historial.orden_trabajo_id)
        if not maquina or not tipo or not orden:
            continue

        HistorialMantenimientoNuevo.objects.create(
            id=historial.id,
            maquina=maquina,
            orden_trabajo=orden,
            fecha=historial.fecha,
            tipo=tipo,
            descripcion=historial.descripcion,
            tiempo_parada_horas=historial.tiempo_parada_horas,
            costo=historial.costo,
            realizado_por_id=historial.realizado_por_id,
        )

    reset_sequences(apps, [
        "TipoMantenimiento",
        "PlanMantenimiento",
        "OrdenTrabajo",
        "HistorialMantenimiento",
    ])


def migrate_data_backward(apps, schema_editor):
    """No revertimos la migración porque los modelos en core fueron eliminados."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("mantenimiento", "0001_initial"),
        ("core", "0001_initial"),
        ("catalogos", "0002_migrate_data_from_core"),
    ]

    operations = [
        migrations.RunPython(migrate_data_forward, migrate_data_backward),
    ]
