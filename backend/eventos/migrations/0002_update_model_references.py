"""
Migración para actualizar referencias a modelos movidos
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0001_initial'),
        ('catalogos', '0002_migrate_data_from_core'),
    ]

    operations = [
        migrations.AlterField(
            model_name='registroincidente',
            name='maquina',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='registros_incidentes', to='catalogos.maquina'),
        ),
        migrations.AlterField(
            model_name='registromantenimiento',
            name='maquina',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='registros_mantenimiento', to='catalogos.maquina'),
        ),
        migrations.AlterField(
            model_name='registroproduccion',
            name='maquina',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='registros_produccion', to='catalogos.maquina'),
        ),
        migrations.AlterField(
            model_name='registroproduccion',
            name='producto',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='registros_produccion', to='catalogos.producto'),
        ),
    ]