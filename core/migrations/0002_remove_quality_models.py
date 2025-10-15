from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(
            name="AccionCorrectiva",
        ),
        migrations.DeleteModel(
            name="DocumentoVersionado",
        ),
        migrations.DeleteModel(
            name="Desviacion",
        ),
    ]
