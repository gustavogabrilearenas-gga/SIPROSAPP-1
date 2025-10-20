"""Serializadores mínimos del núcleo para usuarios."""

from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class BasicUserSerializer(serializers.ModelSerializer):
    """Datos básicos de usuario para respuestas del núcleo."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_staff",
            "is_superuser",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
