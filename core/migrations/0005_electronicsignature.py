# Generated manually for SIPROSA MES
# Adding ElectronicSignature model for 21 CFR Part 11 compliance

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0004_add_visible_field_to_lote'),
    ]

    operations = [
        migrations.CreateModel(
            name='ElectronicSignature',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('APPROVE', 'Approve'), ('REVIEW', 'Review'), ('RELEASE', 'Release'), ('REJECT', 'Reject'), ('AUTHORIZE', 'Authorize'), ('VERIFY', 'Verify')], max_length=20, verbose_name='Action')),
                ('meaning', models.CharField(choices=[('APPROVED_BY', 'Approved by'), ('REVIEWED_BY', 'Reviewed by'), ('RELEASED_BY', 'Released by'), ('REJECTED_BY', 'Rejected by'), ('AUTHORIZED_BY', 'Authorized by'), ('VERIFIED_BY', 'Verified by')], max_length=50, verbose_name='Meaning')),
                ('timestamp', models.DateTimeField(auto_now_add=True, verbose_name='Timestamp')),
                ('object_id', models.PositiveIntegerField(verbose_name='Object ID')),
                ('object_str', models.CharField(max_length=255, verbose_name='Object Representation')),
                ('reason', models.TextField(blank=True, verbose_name='Reason/Comments')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='IP Address')),
                ('user_agent', models.CharField(blank=True, max_length=255, verbose_name='User Agent')),
                ('data_to_sign', models.JSONField(blank=True, default=dict, verbose_name='Data to Sign')),
                ('signature_hash', models.CharField(blank=True, max_length=64, verbose_name='Signature Hash (SHA-256)')),
                ('is_valid', models.BooleanField(default=True, verbose_name='Is Valid')),
                ('invalidation_reason', models.TextField(blank=True, verbose_name='Invalidation Reason')),
                ('invalidated_at', models.DateTimeField(blank=True, null=True, verbose_name='Invalidated At')),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype', verbose_name='Content Type')),
                ('invalidated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invalidated_signatures', to=settings.AUTH_USER_MODEL, verbose_name='Invalidated By')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='electronic_signatures', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Electronic Signature',
                'verbose_name_plural': 'Electronic Signatures',
                'db_table': 'core_electronic_signature',
                'ordering': ['-timestamp'],
                'indexes': [
                    models.Index(fields=['content_type', 'object_id'], name='core_electr_content_idx'),
                    models.Index(fields=['user', 'timestamp'], name='core_electr_user_ts_idx'),
                    models.Index(fields=['is_valid'], name='core_electr_is_valid_idx'),
                ],
            },
        ),
    ]

