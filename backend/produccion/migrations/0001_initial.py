# Generated manually for RegistroProduccion model
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("catalogos", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RegistroProduccion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("fecha_produccion", models.DateField()),
                ("unidad_medida", models.CharField(choices=[("COMPRIMIDOS", "Comprimidos"), ("KG", "Kilogramos"), ("LITROS", "Litros"), ("BLISTERS", "Blisters")], max_length=20)),
                ("cantidad_producida", models.DecimalField(decimal_places=3, max_digits=12)),
                ("hora_inicio", models.DateTimeField()),
                ("hora_fin", models.DateTimeField()),
                ("observaciones", models.TextField(blank=True)),
                ("registrado_en", models.DateTimeField(auto_now_add=True, editable=False)),
                ("maquina", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.PROTECT, related_name="registros_produccion", to="catalogos.maquina")),
                ("producto", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.PROTECT, related_name="registros_produccion", to="catalogos.producto")),
                ("formula", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.PROTECT, related_name="registros_produccion", to="catalogos.formula")),
                ("registrado_por", models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, related_name="registros_produccion", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "Registro de producción",
                "verbose_name_plural": "Registros de producción",
                "ordering": ("-registrado_en", "-fecha_produccion", "-id"),
            },
        ),
        migrations.AddIndex(
            model_name="registroproduccion",
            index=models.Index(fields=["fecha_produccion"], name="produccion_fecha__82798b_idx"),
        ),
        migrations.AddIndex(
            model_name="registroproduccion",
            index=models.Index(fields=["maquina"], name="produccion_maquina__f02f6c_idx"),
        ),
        migrations.AddIndex(
            model_name="registroproduccion",
            index=models.Index(fields=["producto"], name="produccion_producto_a765cb_idx"),
        ),
        migrations.AddIndex(
            model_name="registroproduccion",
            index=models.Index(fields=["registrado_en"], name="produccion_registr_438e20_idx"),
        ),
        migrations.AddConstraint(
            model_name="registroproduccion",
            constraint=models.CheckConstraint(check=models.Q(models.Q(cantidad_producida__gt=0)), name="produccion_registro_cantidad_mayor_cero"),
        ),
        migrations.AddConstraint(
            model_name="registroproduccion",
            constraint=models.CheckConstraint(check=models.Q(models.Q(hora_fin__gt=models.F("hora_inicio"))), name="produccion_registro_hora_fin_mayor_inicio"),
        ),
    ]
