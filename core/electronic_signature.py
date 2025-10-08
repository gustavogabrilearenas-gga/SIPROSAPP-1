"""
Electronic Signature System for SIPROSA MES
Implements 21 CFR Part 11 compliant electronic signatures
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
import hashlib
import json


class ElectronicSignature(models.Model):
    """
    Electronic Signature Record
    Implements requirements for 21 CFR Part 11
    """
    
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
    
    # Signature Details
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='electronic_signatures',
        help_text="User who signed"
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Action being signed"
    )
    meaning = models.CharField(
        max_length=20,
        choices=MEANING_CHOICES,
        help_text="Meaning of the signature"
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the signature was applied"
    )
    
    # What is being signed
    content_type = models.CharField(
        max_length=100,
        help_text="Type of object being signed (e.g., 'Lote', 'OrdenTrabajo')"
    )
    object_id = models.IntegerField(
        help_text="ID of the object being signed"
    )
    object_str = models.CharField(
        max_length=200,
        help_text="String representation of the object"
    )
    
    # Reason and Comments
    reason = models.TextField(
        help_text="Reason for signing (required by 21 CFR Part 11)"
    )
    comments = models.TextField(
        blank=True,
        help_text="Additional comments"
    )
    
    # Authentication Details (for audit)
    password_hash = models.CharField(
        max_length=128,
        help_text="Hash of password used to authenticate (for audit purposes)"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address from which signature was applied"
    )
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        help_text="Browser/client user agent"
    )
    
    # Data Integrity
    data_hash = models.CharField(
        max_length=64,
        help_text="SHA-256 hash of the signed data at the time of signing"
    )
    signature_hash = models.CharField(
        max_length=64,
        editable=False,
        help_text="Hash of the signature itself (for integrity verification)"
    )
    
    # Validation
    is_valid = models.BooleanField(
        default=True,
        help_text="Whether this signature is still valid"
    )
    invalidated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this signature was invalidated"
    )
    invalidated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='signatures_invalidated',
        help_text="User who invalidated this signature"
    )
    invalidation_reason = models.TextField(
        blank=True,
        help_text="Reason for invalidation"
    )
    
    class Meta:
        verbose_name = "Electronic Signature"
        verbose_name_plural = "Electronic Signatures"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['is_valid']),
        ]
    
    def __str__(self):
        return f"{self.get_meaning_display()} - {self.user.get_full_name()} - {self.object_str}"
    
    def save(self, *args, **kwargs):
        """Generate signature hash on save"""
        if not self.signature_hash:
            # Create a hash of all signature components for integrity
            signature_data = {
                'user_id': self.user.id,
                'action': self.action,
                'meaning': self.meaning,
                'timestamp': self.timestamp.isoformat() if self.timestamp else timezone.now().isoformat(),
                'content_type': self.content_type,
                'object_id': self.object_id,
                'reason': self.reason,
                'data_hash': self.data_hash
            }
            signature_string = json.dumps(signature_data, sort_keys=True)
            self.signature_hash = hashlib.sha256(signature_string.encode()).hexdigest()
        
        super().save(*args, **kwargs)
    
    def verify_integrity(self) -> bool:
        """
        Verify the integrity of this signature
        Returns True if signature is intact, False otherwise
        """
        signature_data = {
            'user_id': self.user.id,
            'action': self.action,
            'meaning': self.meaning,
            'timestamp': self.timestamp.isoformat(),
            'content_type': self.content_type,
            'object_id': self.object_id,
            'reason': self.reason,
            'data_hash': self.data_hash
        }
        signature_string = json.dumps(signature_data, sort_keys=True)
        calculated_hash = hashlib.sha256(signature_string.encode()).hexdigest()
        
        return calculated_hash == self.signature_hash
    
    def invalidate(self, user: User, reason: str):
        """Invalidate this signature"""
        self.is_valid = False
        self.invalidated_at = timezone.now()
        self.invalidated_by = user
        self.invalidation_reason = reason
        self.save()
    
    @staticmethod
    def create_signature(
        user: User,
        password: str,
        action: str,
        meaning: str,
        content_type: str,
        object_id: int,
        object_str: str,
        reason: str,
        data_to_sign: dict,
        comments: str = "",
        ip_address: str = None,
        user_agent: str = ""
    ):
        """
        Create and save an electronic signature
        
        Args:
            user: User applying the signature
            password: User's password (for authentication)
            action: Action being signed
            meaning: Meaning of signature
            content_type: Type of object being signed
            object_id: ID of object
            object_str: String representation of object
            reason: Reason for signing
            data_to_sign: Dictionary of data being signed
            comments: Optional comments
            ip_address: IP address of user
            user_agent: Browser user agent
        
        Returns:
            ElectronicSignature instance
        
        Raises:
            ValidationError: If password is incorrect
        """
        # Verify password
        if not user.check_password(password):
            raise ValidationError("Invalid password for electronic signature")
        
        # Create hash of the data being signed
        data_string = json.dumps(data_to_sign, sort_keys=True)
        data_hash = hashlib.sha256(data_string.encode()).hexdigest()
        
        # Create password hash for audit (not the actual password, but a hash for verification)
        password_hash = hashlib.sha256(f"{user.username}{password}{timezone.now().isoformat()}".encode()).hexdigest()
        
        # Create signature
        signature = ElectronicSignature.objects.create(
            user=user,
            action=action,
            meaning=meaning,
            content_type=content_type,
            object_id=object_id,
            object_str=object_str,
            reason=reason,
            comments=comments,
            password_hash=password_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            data_hash=data_hash
        )
        
        return signature


class SignatureRequirement(models.Model):
    """
    Defines signature requirements for different operations
    """
    
    content_type = models.CharField(
        max_length=100,
        help_text="Model that requires signature"
    )
    action = models.CharField(
        max_length=50,
        help_text="Action that requires signature (e.g., 'approve', 'release')"
    )
    required_role = models.CharField(
        max_length=100,
        blank=True,
        help_text="Role required to sign (e.g., 'Quality Manager')"
    )
    requires_reason = models.BooleanField(
        default=True,
        help_text="Whether a reason is required"
    )
    requires_secondary_signature = models.BooleanField(
        default=False,
        help_text="Whether a secondary signature is required (dual approval)"
    )
    active = models.BooleanField(
        default=True
    )
    
    class Meta:
        verbose_name = "Signature Requirement"
        verbose_name_plural = "Signature Requirements"
        unique_together = ['content_type', 'action']
    
    def __str__(self):
        return f"{self.content_type} - {self.action}"

