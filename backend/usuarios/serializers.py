"""Serializers del dominio de usuarios."""

from django.apps import apps
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import UserProfile


UserModel = apps.get_model(settings.AUTH_USER_MODEL)
Funcion = apps.get_model("catalogos", "Funcion")
Turno = apps.get_model("catalogos", "Turno")


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
    funcion_id = serializers.PrimaryKeyRelatedField(source="funcion", read_only=True)
    funcion_nombre = serializers.CharField(source="funcion.nombre", read_only=True)
    turno_id = serializers.PrimaryKeyRelatedField(source="turno_habitual", read_only=True)
    turno_nombre = serializers.CharField(source="turno_habitual.nombre", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "usuario",
            "legajo",
            "dni",
            "funcion_id",
            "funcion_nombre",
            "turno_id",
            "turno_nombre",
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
    legajo = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dni = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    funcion_id = serializers.PrimaryKeyRelatedField(
        queryset=Funcion.objects.filter(activa=True),
        source="funcion",
        required=False,
        allow_null=True,
    )
    turno_id = serializers.PrimaryKeyRelatedField(
        queryset=Turno.objects.filter(activo=True),
        source="turno_habitual",
        required=False,
        allow_null=True,
    )
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
            "dni",
            "funcion_id",
            "turno_id",
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
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

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
            data["dni"] = profile_instance.dni or ""
            data["funcion_id"] = profile_instance.funcion_id
            data["funcion_nombre"] = (
                profile_instance.funcion.nombre if profile_instance.funcion else ""
            )
            data["turno_id"] = profile_instance.turno_habitual_id
            data["turno_nombre"] = (
                profile_instance.turno_habitual.nombre
                if profile_instance.turno_habitual
                else ""
            )
            data["telefono"] = profile_instance.telefono or ""
            data["fecha_ingreso"] = (
                profile_instance.fecha_ingreso.isoformat()
                if profile_instance.fecha_ingreso
                else None
            )
        else:
            data["legajo"] = ""
            data["dni"] = ""
            data["funcion_id"] = None
            data["funcion_nombre"] = ""
            data["turno_id"] = None
            data["turno_nombre"] = ""
            data["telefono"] = ""
            data["fecha_ingreso"] = None

        return data

    @staticmethod
    def _clean_optional_text(value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    def create(self, validated_data):
        """Crear usuario con perfil."""

        profile_data = {
            "legajo": self._clean_optional_text(validated_data.pop("legajo", None)),
            "dni": self._clean_optional_text(validated_data.pop("dni", None)),
            "funcion": validated_data.pop("funcion", None),
            "turno_habitual": validated_data.pop("turno_habitual", None),
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
            "dni": validated_data.pop("dni", None),
            "funcion": validated_data.pop("funcion", None),
            "turno_habitual": validated_data.pop("turno_habitual", None),
            "telefono": validated_data.pop("telefono", None),
            "fecha_ingreso": validated_data.pop("fecha_ingreso", None),
        }

        if is_self_update:
            allowed_user_fields = ["first_name", "last_name", "email"]
            allowed_profile_fields = [
                "legajo",
                "dni",
                "funcion",
                "turno_habitual",
                "telefono",
                "fecha_ingreso",
            ]

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
                elif attr in {"legajo", "dni"}:
                    setattr(profile, attr, self._clean_optional_text(value))
                else:
                    setattr(profile, attr, value)
            profile.save()

        return instance


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    """Serializer para que usuarios editen su propio perfil."""

    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    legajo = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dni = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    funcion_id = serializers.PrimaryKeyRelatedField(
        queryset=Funcion.objects.filter(activa=True),
        source="funcion",
        required=False,
        allow_null=True,
    )
    turno_id = serializers.PrimaryKeyRelatedField(
        queryset=Turno.objects.filter(activo=True),
        source="turno_habitual",
        required=False,
        allow_null=True,
    )
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
            "dni",
            "funcion_id",
            "turno_id",
            "telefono",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile_instance = getattr(instance, "user_profile", None)

        if profile_instance:
            data["funcion_id"] = profile_instance.funcion_id
            data["funcion_nombre"] = (
                profile_instance.funcion.nombre if profile_instance.funcion else ""
            )
            data["turno_id"] = profile_instance.turno_habitual_id
            data["turno_nombre"] = (
                profile_instance.turno_habitual.nombre
                if profile_instance.turno_habitual
                else ""
            )
            data["dni"] = profile_instance.dni or ""
        else:
            data["funcion_id"] = None
            data["funcion_nombre"] = ""
            data["turno_id"] = None
            data["turno_nombre"] = ""
            data["dni"] = ""

        return data

    def update(self, instance, validated_data):
        profile_data = {
            "legajo": validated_data.pop("legajo", None),
            "dni": validated_data.pop("dni", None),
            "funcion": validated_data.pop("funcion", None),
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
                if attr == "fecha_ingreso":
                    setattr(profile, attr, value if value else None)
                elif attr in {"legajo", "dni"} and value is not None:
                    cleaned = value.strip() if isinstance(value, str) else value
                    setattr(profile, attr, cleaned or None)
                elif value is not None:
                    setattr(profile, attr, value)
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

    legajo = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dni = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    funcion_id = serializers.PrimaryKeyRelatedField(
        queryset=Funcion.objects.filter(activa=True),
        source="funcion",
        required=False,
        allow_null=True,
    )
    turno_id = serializers.PrimaryKeyRelatedField(
        queryset=Turno.objects.filter(activo=True),
        source="turno_habitual",
        required=False,
        allow_null=True,
    )
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
            "dni",
            "funcion_id",
            "turno_id",
            "telefono",
            "fecha_ingreso",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def validate(self, data):
        if data["password"] != data["password_confirmacion"]:
            raise serializers.ValidationError(
                {"password_confirmacion": "Las contraseñas no coinciden"}
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

        def _clean_optional_text(value):
            if value is None:
                return None
            if isinstance(value, str):
                value = value.strip()
                return value or None
            return value

        profile_data = {
            "legajo": _clean_optional_text(validated_data.pop("legajo", None)),
            "dni": _clean_optional_text(validated_data.pop("dni", None)),
            "funcion": validated_data.pop("funcion", None),
            "turno_habitual": validated_data.pop("turno_habitual", None),
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
