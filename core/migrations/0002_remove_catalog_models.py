"""
Eliminación de los modelos de catálogos de core
"""
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
        ('catalogos', '0002_migrate_data_from_core'),
        ('mantenimiento', '0002_migrate_data_from_core'),
    ]

    operations = [
        migrations.DeleteModel(
            name='HistorialMantenimiento',
        ),
        migrations.DeleteModel(
            name='Incidente',
        ),
        migrations.DeleteModel(
            name='LoteEtapa',
        ),
        migrations.DeleteModel(
            name='OrdenTrabajo',
        ),
        migrations.DeleteModel(
            name='PlanMantenimiento',
        ),
        migrations.DeleteModel(
            name='Lote',
        ),
        migrations.DeleteModel(
            name='TipoIncidente',
        ),
        migrations.DeleteModel(
            name='TipoMantenimiento',
        ),
        migrations.DeleteModel(
            name='Formula',
        ),
        migrations.DeleteModel(
            name='EtapaProduccion',
        ),
        migrations.DeleteModel(
            name='Producto',
        ),
        migrations.DeleteModel(
            name='Maquina',
        ),
        migrations.DeleteModel(
            name='Ubicacion',
        ),
        migrations.DeleteModel(
            name='Turno',
        ),
    ]