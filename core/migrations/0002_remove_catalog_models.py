"""
Eliminación de los modelos de catálogos de core
"""
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
        ('catalogos', '0002_migrate_data_from_core'),
    ]

    operations = [
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