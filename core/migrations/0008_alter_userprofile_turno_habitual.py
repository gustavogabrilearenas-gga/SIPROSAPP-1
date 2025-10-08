from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_remove_electronicsignature_core_electr_user_ts_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='turno_habitual',
            field=models.CharField(blank=True, choices=[('M', 'Mañana'), ('T', 'Tarde'), ('N', 'Noche'), ('R', 'Rotativo')], max_length=2, null=True),
        ),
    ]