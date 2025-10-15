 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/backend/usuarios/serializers.py b/backend/usuarios/serializers.py
index afca5bb6b70910fc172cb1dfd06dbbc32136dc3e..bfd6ce0e95abf4327013bb0a121dd4aee73141d0 100644
--- a/backend/usuarios/serializers.py
+++ b/backend/usuarios/serializers.py
@@ -1,28 +1,29 @@
 """Serializers del dominio de usuarios."""
 
 from django.contrib.auth.models import User
+from django.core.exceptions import ObjectDoesNotExist
 from rest_framework import serializers
 
 from .models import UserProfile
 
 
 class UserSerializer(serializers.ModelSerializer):
     """Serializer básico de usuario."""
 
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
         read_only_fields = ["id"]
 
     def get_full_name(self, obj):
@@ -33,115 +34,137 @@ class UserProfileSerializer(serializers.ModelSerializer):
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
 
-    profile = UserProfileSerializer(read_only=True)
+    profile = serializers.SerializerMethodField()
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
         model = User
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
 
+    def get_profile(self, instance):
+        try:
+            profile = instance.user_profile
+        except ObjectDoesNotExist:
+            return None
+
+        return UserProfileSerializer(profile).data
+
     def to_representation(self, instance):
         """Convertir fechas a formato ISO sin zona horaria."""
 
         data = super().to_representation(instance)
 
         if instance.date_joined:
             data["date_joined"] = instance.date_joined.isoformat()
 
         if instance.last_login:
             data["last_login"] = instance.last_login.isoformat()
 
-        if hasattr(instance, "profile"):
-            profile = instance.profile
-            data["legajo"] = profile.legajo or ""
-            data["area"] = profile.area or ""
-            data["turno_habitual"] = profile.turno_habitual or ""
-            data["telefono"] = profile.telefono or ""
-            data["fecha_ingreso"] = profile.fecha_ingreso
+        try:
+            profile_instance = instance.user_profile
+        except ObjectDoesNotExist:
+            profile_instance = None
+
+        if profile_instance:
+            data["legajo"] = profile_instance.legajo or ""
+            data["area"] = profile_instance.area or ""
+            data["turno_habitual"] = profile_instance.turno_habitual or ""
+            data["telefono"] = profile_instance.telefono or ""
+            data["fecha_ingreso"] = (
+                profile_instance.fecha_ingreso.isoformat()
+                if profile_instance.fecha_ingreso
+                else None
+            )
+        else:
+            data["legajo"] = ""
+            data["area"] = ""
+            data["turno_habitual"] = ""
+            data["telefono"] = ""
+            data["fecha_ingreso"] = None
 
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
         user = User.objects.create(**validated_data)
 
         if password:
             user.set_password(password)
             user.save()
 
         UserProfile.objects.update_or_create(
             user=user,
             defaults=profile_data,
 
EOF
)