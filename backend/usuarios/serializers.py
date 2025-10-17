"""Serializers del dominio de usuarios."""

from django.apps import apps
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import UserProfile


UserModel = apps.get_model(settings.AUTH_USER_MODEL)


class UserSerializer(serializers.ModelSerializer):
    """Serializer básico de usuario."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = UserModel
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
        read_only_fields = ["id"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer de perfil de usuario."""

    usuario = UserSerializer(source="user", read_only=True)
    area_display = serializers.CharField(source="get_area_display", read_only=True)
    turno_display = serializers.CharField(source="get_turno_habitual_display", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "usuario",
            "legajo",
            "area",
            "area_display",
            "turno_habitual",
            "turno_display",
            "telefono",
            "fecha_ingreso",
            "activo",
        ]


class UsuarioDetalleSerializer(serializers.ModelSerializer):
    """Serializer completo para gestión de usuarios (admin)."""

    profile = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    # Campos del perfil para facilitar edición
    legajo = serializers.CharField(required=False, allow_blank=True)
    area = serializers.CharField(required=False, allow_blank=True)
    turno_habitual = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(required=False, allow_blank=True)
    fecha_ingreso = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = UserModel
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "profile",
            "legajo",
            "area",
            "turno_habitual",
            "telefono",
            "fecha_ingreso",
        ]
        read_only_fields = [
            "id",
            "username",
            "date_joined",
            "last_login",
            "is_active",
            "is_staff",
            "is_superuser",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_profile(self, instance):
        profile = getattr(instance, "user_profile", None)

        if not profile:
            return None

        return UserProfileSerializer(profile).data

    def to_representation(self, instance):
        """Convertir fechas a formato ISO sin zona horaria."""

        data = super().to_representation(instance)

        if instance.date_joined:
            data["date_joined"] = instance.date_joined.isoformat()

        if instance.last_login:
            data["last_login"] = instance.last_login.isoformat()

        profile_instance = getattr(instance, "user_profile", None)

        if profile_instance:
            data["legajo"] = profile_instance.legajo or ""
            data["area"] = profile_instance.area or ""
            data["turno_habitual"] = profile_instance.turno_habitual or ""
            data["telefono"] = profile_instance.telefono or ""
            data["fecha_ingreso"] = (
                profile_instance.fecha_ingreso.isoformat()
                if profile_instance.fecha_ingreso
                else None
            )
        else:
            data["legajo"] = ""
            data["area"] = ""
            data["turno_habitual"] = ""
            data["telefono"] = ""
            data["fecha_ingreso"] = None

        return data

    def create(self, validated_data):
        """Crear usuario con perfil."""

        profile_data = {
            "legajo": validated_data.pop("legajo", ""),
            "area": validated_data.pop("area", ""),
            "turno_habitual": validated_data.pop("turno_habitual", ""),
            "telefono": validated_data.pop("telefono", ""),
            "fecha_ingreso": validated_data.pop("fecha_ingreso", None),
            "activo": validated_data.pop("activo", True),
        }

        password = validated_data.pop("password", None)
        user = UserModel.objects.create(**validated_data)

        if password:
            user.set_password(password)
            user.save()

        UserProfile.objects.update_or_create(
            user=user,
            defaults=profile_data,
        )

        return user

    def update(self, instance, validated_data):
        """Actualizar usuario y perfil."""

        request = self.context.get("request")
        is_self_update = request and request.user == instance

        profile_data = {
            "legajo": validated_data.pop("legajo", None),
            "area": validated_data.pop("area", None),
            "turno_habitual": validated_data.pop("turno_habitual", None),
            "telefono": validated_data.pop("telefono", None),
            "fecha_ingreso": validated_data.pop("fecha_ingreso", None),
        }

        if is_self_update:
            allowed_user_fields = ["first_name", "last_name", "email"]
            allowed_profile_fields = ["legajo", "area", "turno_habitual", "telefono"]

            filtered_validated_data = {
                k: v for k, v in validated_data.items() if k in allowed_user_fields
            }
            filtered_profile_data = {
                k: v
                for k, v in profile_data.items()
                if k in allowed_profile_fields and v is not None
            }
        else:
            filtered_validated_data = validated_data
            filtered_profile_data = profile_data

        for attr, value in filtered_validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile = UserProfile.objects.filter(user=instance).first()
        if profile:
            for attr, value in filtered_profile_data.items():
                if attr == "fecha_ingreso":
                    setattr(profile, attr, value if value else None)
                elif value is not None:
                    setattr(profile, attr, value if value is not None else "")
            profile.save()

        return instance


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    """Serializer para que usuarios editen su propio perfil."""

    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    legajo = serializers.CharField(required=False, allow_blank=True)
    area = serializers.CharField(required=False, allow_blank=True)
    turno_habitual = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = UserModel
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "profile",
            "legajo",
            "area",
            "turno_habitual",
            "telefono",
        ]
        read_only_fields = ["id"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return data

    def update(self, instance, validated_data):
        profile_data = {
            "legajo": validated_data.pop("legajo", None),
            "area": validated_data.pop("area", None),
            "turno_habitual": validated_data.pop("turno_habitual", None),
            "telefono": validated_data.pop("telefono", None),
        }

        for attr in ["first_name", "last_name", "email"]:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])
        instance.save()

        profile = UserProfile.objects.filter(user=instance).first()
        if profile:
            for attr, value in profile_data.items():
                if value is not None:
                    setattr(profile, attr, value if value is not None else "")
            profile.save()

        return instance


class CambiarPasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña."""

    password_actual = serializers.CharField(required=False, write_only=True)
    password_nueva = serializers.CharField(required=True, write_only=True, min_length=4)
    password_confirmacion = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if data["password_nueva"] != data["password_confirmacion"]:
            raise serializers.ValidationError(
                {"password_confirmacion": "Las contraseñas no coinciden"}
            )

        user = self.context.get("target_user")
        if user is None:
            request = self.context.get("request")
            user = getattr(request, "user", None) if request else None

        try:
            validate_password(data["password_nueva"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                {"password_nueva": list(exc.messages)}
            ) from exc

        return data


class CrearUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para crear nuevos usuarios (admin)."""

    password = serializers.CharField(write_only=True, required=True, min_length=4)
    password_confirmacion = serializers.CharField(write_only=True, required=True)

    legajo = serializers.CharField(required=False, allow_blank=True)
    area = serializers.CharField(required=False, allow_blank=True)
    turno_habitual = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(required=False, allow_blank=True)
    fecha_ingreso = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = UserModel
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirmacion",
            "is_staff",
            "is_superuser",
            "legajo",
            "area",
            "turno_habitual",
            "telefono",
            "fecha_ingreso",
        ]

    def validate(self, data):
        if data["password"] != data["password_confirmacion"]:
            raise serializers.ValidationError(
                {"password_confirmacion": "Las contraseñas no coinciden"}
            )

        turno = data.get("turno_habitual")
        if turno and turno not in dict(UserProfile.TURNO_CHOICES).keys():
            raise serializers.ValidationError(
                {
                    "turno_habitual": (
                        "Valor inválido. Debe ser uno de: "
                        f"{', '.join(dict(UserProfile.TURNO_CHOICES).keys())}"
                    )
                }
            )

        try:
            validate_password(data["password"], user=None)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                {"password": list(exc.messages)}
            ) from exc

        return data

    def create(self, validated_data):
        validated_data.pop("password_confirmacion")

        profile_data = {
            "legajo": validated_data.pop("legajo", ""),
            "area": validated_data.pop("area", ""),
            "turno_habitual": validated_data.pop("turno_habitual", ""),
            "telefono": validated_data.pop("telefono", ""),
            "fecha_ingreso": validated_data.pop("fecha_ingreso", None),
            "activo": True,
        }

        password = validated_data.pop("password")
        user = UserModel.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        UserProfile.objects.create(user=user, **profile_data)

        return user
