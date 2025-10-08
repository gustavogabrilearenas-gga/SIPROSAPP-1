# Generated migration for Desviacion and DocumentoVersionado models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0005_electronicsignature'),
    ]

    operations = [
        # Create Desviacion model
        migrations.CreateModel(
            name='Desviacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.CharField(max_length=30, unique=True, verbose_name='Código')),
                ('titulo', models.CharField(max_length=200)),
                ('descripcion', models.TextField()),
                ('severidad', models.CharField(choices=[('CRITICA', 'Crítica'), ('MAYOR', 'Mayor'), ('MENOR', 'Menor')], max_length=10)),
                ('estado', models.CharField(choices=[('ABIERTA', 'Abierta'), ('EN_INVESTIGACION', 'En Investigación'), ('EN_CAPA', 'En CAPA'), ('CERRADA', 'Cerrada')], default='ABIERTA', max_length=20)),
                ('fecha_deteccion', models.DateTimeField()),
                ('area_responsable', models.CharField(blank=True, max_length=50)),
                ('impacto_calidad', models.TextField(blank=True)),
                ('impacto_seguridad', models.TextField(blank=True)),
                ('impacto_eficacia', models.TextField(blank=True)),
                ('investigacion_realizada', models.TextField(blank=True)),
                ('causa_raiz', models.TextField(blank=True)),
                ('accion_inmediata', models.TextField(blank=True)),
                ('requiere_capa', models.BooleanField(default=False)),
                ('fecha_cierre', models.DateTimeField(blank=True, null=True)),
                ('cerrado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='desviaciones_cerradas', to=settings.AUTH_USER_MODEL)),
                ('detectado_por', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='desviaciones_detectadas', to=settings.AUTH_USER_MODEL)),
                ('lote', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='desviaciones', to='core.lote')),
                ('lote_etapa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='desviaciones', to='core.loteetapa')),
            ],
            options={
                'verbose_name': 'Desviación',
                'verbose_name_plural': 'Desviaciones',
                'ordering': ['-fecha_deteccion'],
            },
        ),
        
        # Create DocumentoVersionado model
        migrations.CreateModel(
            name='DocumentoVersionado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.CharField(max_length=50, verbose_name='Código')),
                ('titulo', models.CharField(max_length=200)),
                ('tipo', models.CharField(choices=[('SOP', 'Standard Operating Procedure'), ('IT', 'Instrucción de Trabajo'), ('FT', 'Ficha Técnica'), ('PL', 'Protocolo'), ('REG', 'Registro')], max_length=10)),
                ('version', models.CharField(max_length=20)),
                ('estado', models.CharField(choices=[('BORRADOR', 'Borrador'), ('EN_REVISION', 'En Revisión'), ('APROBADO', 'Aprobado'), ('VIGENTE', 'Vigente'), ('OBSOLETO', 'Obsoleto')], default='BORRADOR', max_length=20)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_revision', models.DateTimeField(blank=True, null=True)),
                ('fecha_aprobacion', models.DateTimeField(blank=True, null=True)),
                ('fecha_vigencia_inicio', models.DateField(blank=True, null=True)),
                ('fecha_vigencia_fin', models.DateField(blank=True, null=True)),
                ('contenido', models.TextField(blank=True, help_text='Contenido del documento o referencia')),
                ('archivo_url', models.CharField(blank=True, max_length=500)),
                ('hash_sha256', models.CharField(blank=True, max_length=64)),
                ('cambios_version', models.TextField(blank=True, help_text='Resumen de cambios en esta versión')),
                ('aprobado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documentos_aprobados', to=settings.AUTH_USER_MODEL)),
                ('creado_por', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='documentos_creados', to=settings.AUTH_USER_MODEL)),
                ('documento_anterior', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='versiones_siguientes', to='core.documentoversionado')),
                ('revisado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documentos_revisados', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Documento Versionado',
                'verbose_name_plural': 'Documentos Versionados',
                'ordering': ['-fecha_creacion'],
                'unique_together': {('codigo', 'version')},
            },
        ),
        
        # Modify LoteDocumento to make hash_sha256 and tamaño_bytes optional
        migrations.AlterField(
            model_name='lotedocumento',
            name='hash_sha256',
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AlterField(
            model_name='lotedocumento',
            name='tamaño_bytes',
            field=models.IntegerField(blank=True, default=0),
        ),
    ]

