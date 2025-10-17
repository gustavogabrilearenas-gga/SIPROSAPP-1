"""Serializadores para el módulo de auditoría."""

import hashlib
import json

from django.utils import timezone
from rest_framework import serializers

from .models import ElectronicSignature, LogAuditoria


class LogAuditoriaSerializer(serializers.ModelSerializer):
    """Serializador de logs de auditoría."""

    usuario_nombre = serializers.CharField(
        source='usuario.get_full_name', read_only=True, allow_null=True
    )
    accion_display = serializers.CharField(
        source='get_accion_display', read_only=True
    )

    class Meta:
        model = LogAuditoria
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'accion',
            'accion_display',
            'modelo',
            'objeto_id',
            'objeto_str',
            'cambios',
            'ip_address',
            'user_agent',
            'fecha',
        ]
        read_only_fields = ['id', 'fecha']


class ElectronicSignatureSerializer(serializers.ModelSerializer):
    """Serializador de firmas electrónicas."""

    user_fullname = serializers.CharField(
        source='user.get_full_name', read_only=True
    )
    action_display = serializers.CharField(
        source='get_action_display', read_only=True
    )
    meaning_display = serializers.CharField(
        source='get_meaning_display', read_only=True
    )
    invalidated_by_name = serializers.CharField(
        source='invalidated_by.get_full_name', read_only=True, allow_null=True
    )

    class Meta:
        model = ElectronicSignature
        fields = [
            'id',
            'user',
            'user_fullname',
            'action',
            'action_display',
            'meaning',
            'meaning_display',
            'timestamp',
            'content_type',
            'object_id',
            'object_str',
            'reason',
            'comments',
            'signature_hash',
            'data_hash',
            'is_valid',
            'invalidated_at',
            'invalidated_by',
            'invalidated_by_name',
            'invalidation_reason',
        ]
        read_only_fields = [
            'id',
            'timestamp',
            'signature_hash',
            'data_hash',
            'is_valid',
            'invalidated_at',
            'invalidated_by',
        ]


class CreateSignatureSerializer(serializers.Serializer):
    """Serializador para la creación de firmas electrónicas."""

    action = serializers.ChoiceField(choices=ElectronicSignature.ACTION_CHOICES)
    meaning = serializers.ChoiceField(choices=ElectronicSignature.MEANING_CHOICES)
    content_type = serializers.CharField(max_length=100)
    object_id = serializers.IntegerField()
    object_str = serializers.CharField(max_length=200)
    reason = serializers.CharField()
    comments = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    data_to_sign = serializers.JSONField()

    def validate_password(self, value):
        """Verifica que la contraseña provista sea correcta."""

        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError('Usuario no autenticado')

        if not request.user.check_password(value):
            raise serializers.ValidationError('Contraseña incorrecta')

        return value

    def create(self, validated_data):
        """Crea la firma electrónica generando los hashes necesarios."""

        request = self.context.get('request')
        user = request.user
        password = validated_data.pop('password')
        data_to_sign = validated_data.pop('data_to_sign')

        data_string = json.dumps(data_to_sign, sort_keys=True)
        data_hash = hashlib.sha256(data_string.encode()).hexdigest()

        password_hash = hashlib.sha256(
            f"{user.username}{password}{timezone.now().isoformat()}".encode()
        ).hexdigest()

        ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip_address:
            ip_address = ip_address.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')

        user_agent = request.META.get('HTTP_USER_AGENT', '')

        signature = ElectronicSignature.objects.create(
            user=user,
            data_hash=data_hash,
            password_hash=password_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            **validated_data,
        )

        return signature
