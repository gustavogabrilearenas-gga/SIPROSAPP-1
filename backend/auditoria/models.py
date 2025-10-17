"""Modelos del dominio de auditoría."""

import hashlib
import json

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class LogAuditoria(models.Model):
    """Registro completo de acciones realizadas en el sistema."""

    ACCION_CHOICES = [
        ('CREAR', 'Crear'),
        ('MODIFICAR', 'Modificar'),
        ('ELIMINAR', 'Eliminar'),
        ('CANCELAR', 'Cancelar'),
        ('VER', 'Ver'),
        ('EXPORTAR', 'Exportar'),
    ]

    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='acciones_auditoria',
    )
    accion = models.CharField(max_length=10, choices=ACCION_CHOICES)
    modelo = models.CharField(
        max_length=100,
        help_text='Nombre del modelo afectado',
    )
    objeto_id = models.IntegerField()
    objeto_str = models.CharField(max_length=200)
    cambios = models.JSONField(
        default=dict,
        help_text='Estructura: {campo: {antes: X, despues: Y}}',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'
        ordering = ['-fecha']
        db_table = 'core_logauditoria'
        indexes = [
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['modelo', 'objeto_id']),
        ]

    def __str__(self) -> str:  # pragma: no cover - representación de conveniencia
        return (
            f"{self.usuario} - {self.get_accion_display()} - {self.modelo} "
            f"({self.fecha.strftime('%Y-%m-%d %H:%M')})"
        )


class ElectronicSignature(models.Model):
    """Registro de firmas electrónicas compatible con 21 CFR Part 11."""

    ACTION_CHOICES = [
        ('APPROVE', 'Approve'),
        ('REVIEW', 'Review'),
        ('RELEASE', 'Release'),
        ('REJECT', 'Reject'),
        ('AUTHORIZE', 'Authorize'),
        ('VERIFY', 'Verify'),
    ]

    MEANING_CHOICES = [
        ('APPROVED_BY', 'Approved by'),
        ('REVIEWED_BY', 'Reviewed by'),
        ('RELEASED_BY', 'Released by'),
        ('REJECTED_BY', 'Rejected by'),
        ('AUTHORIZED_BY', 'Authorized by'),
        ('VERIFIED_BY', 'Verified by'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='electronic_signatures',
        help_text='User who signed',
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text='Action being signed',
    )
    meaning = models.CharField(
        max_length=20,
        choices=MEANING_CHOICES,
        help_text='Meaning of the signature',
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text='When the signature was applied',
    )
    content_type = models.CharField(
        max_length=100,
        help_text="Type of object being signed (e.g., 'Lote', 'OrdenTrabajo')",
    )
    object_id = models.IntegerField(
        help_text='ID of the object being signed',
    )
    object_str = models.CharField(
        max_length=200,
        help_text='String representation of the object',
    )
    reason = models.TextField(
        help_text='Reason for signing (required by 21 CFR Part 11)',
    )
    comments = models.TextField(
        blank=True,
        help_text='Additional comments',
    )
    password_hash = models.CharField(
        max_length=128,
        default='',
        blank=True,
        help_text='Hash of password used to authenticate (for audit purposes)',
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address from which signature was applied',
    )
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        help_text='Browser/client user agent',
    )
    data_hash = models.CharField(
        max_length=64,
        default='',
        blank=True,
        help_text='SHA-256 hash of the signed data at the time of signing',
    )
    signature_hash = models.CharField(
        max_length=64,
        default='',
        blank=True,
        editable=False,
        help_text='Hash of the signature itself (for integrity verification)',
    )
    is_valid = models.BooleanField(
        default=True,
        help_text='Whether this signature is still valid',
    )
    invalidated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When this signature was invalidated',
    )
    invalidated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='signatures_invalidated',
        help_text='User who invalidated this signature',
    )
    invalidation_reason = models.TextField(
        blank=True,
        help_text='Reason for invalidation',
    )

    class Meta:
        verbose_name = 'Electronic Signature'
        verbose_name_plural = 'Electronic Signatures'
        ordering = ['-timestamp']
        db_table = 'core_electronicsignature'
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['is_valid']),
        ]

    def __str__(self) -> str:  # pragma: no cover - representación de conveniencia
        return (
            f"{self.get_meaning_display()} - {self.user.get_full_name()} - "
            f"{self.object_str}"
        )

    def save(self, *args, **kwargs):
        """Genera el hash de la firma si aún no existe."""

        if not self.signature_hash:
            signature_data = {
                'user_id': self.user.id,
                'action': self.action,
                'meaning': self.meaning,
                'timestamp': (
                    self.timestamp.isoformat()
                    if self.timestamp
                    else timezone.now().isoformat()
                ),
                'content_type': self.content_type,
                'object_id': self.object_id,
                'reason': self.reason,
                'data_hash': self.data_hash,
            }
            signature_string = json.dumps(signature_data, sort_keys=True)
            self.signature_hash = hashlib.sha256(signature_string.encode()).hexdigest()

        super().save(*args, **kwargs)

    def verify_integrity(self) -> bool:
        """Verifica la integridad de la firma electrónica."""

        signature_data = {
            'user_id': self.user.id,
            'action': self.action,
            'meaning': self.meaning,
            'timestamp': self.timestamp.isoformat(),
            'content_type': self.content_type,
            'object_id': self.object_id,
            'reason': self.reason,
            'data_hash': self.data_hash,
        }
        signature_string = json.dumps(signature_data, sort_keys=True)
        calculated_hash = hashlib.sha256(signature_string.encode()).hexdigest()

        return calculated_hash == self.signature_hash

    def invalidate(self, user: User, reason: str):
        """Invalida la firma electrónica indicando usuario y motivo."""

        self.is_valid = False
        self.invalidated_at = timezone.now()
        self.invalidated_by = user
        self.invalidation_reason = reason
        self.save(update_fields=[
            'is_valid',
            'invalidated_at',
            'invalidated_by',
            'invalidation_reason',
        ])
