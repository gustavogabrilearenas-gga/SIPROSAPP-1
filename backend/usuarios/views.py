"""ViewSets del dominio de usuarios."""

from django.contrib.auth.models import User
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.usuarios.serializers import (
    CambiarPasswordSerializer,
    CrearUsuarioSerializer,
    UsuarioDetalleSerializer,
    UsuarioPerfilSerializer,
)
from core.permissions import IsAdmin


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de usuarios (solo admin/superuser)."""

    queryset = User.objects.all().select_related("user_profile").order_by("username")
    serializer_class = UsuarioDetalleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
        "user_profile__legajo",
    ]
    ordering_fields = ["username", "date_joined", "last_login", "is_active"]

    def get_permissions(self):
        if self.action in ["me", "cambiar_mi_password", "update_me"]:
            return [permissions.IsAuthenticated()]
        if self.action in ["update", "partial_update"] and self.kwargs.get("pk"):
            user_id = self.kwargs["pk"]
            if str(self.request.user.id) == str(user_id):
                return [permissions.IsAuthenticated()]
            return [IsAdmin()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return CrearUsuarioSerializer
        if self.action in ["cambiar_password", "cambiar_mi_password"]:
            return CambiarPasswordSerializer
        if self.action == "me":
            return UsuarioDetalleSerializer
        if self.action == "update_me":
            return UsuarioPerfilSerializer
        if self.action in ["update", "partial_update"] and self.kwargs.get("pk"):
            user_id = self.kwargs["pk"]
            if str(self.request.user.id) == str(user_id):
                return UsuarioPerfilSerializer
            return UsuarioDetalleSerializer
        return UsuarioDetalleSerializer

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["put", "patch"])
    def update_me(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def cambiar_mi_password(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        password_actual = serializer.validated_data.get("password_actual")

        if password_actual and not user.check_password(password_actual):
            return Response(
                {"error": "La contraseña actual es incorrecta"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["password_nueva"])
        user.save()

        return Response({"message": "Contraseña cambiada exitosamente"})

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def cambiar_password(self, request, pk=None):
        usuario = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario.set_password(serializer.validated_data["password_nueva"])
        usuario.save()

        return Response({"message": f"Contraseña de {usuario.username} cambiada exitosamente"})

    def destroy(self, request, *args, **kwargs):
        usuario = self.get_object()
        usuario.is_active = False
        usuario.save(update_fields=["is_active"])
        return Response(
            {"message": "Usuario desactivado correctamente"},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def reactivar(self, request, pk=None):
        usuario = self.get_object()
        usuario.is_active = True
        usuario.save(update_fields=["is_active"])
        return Response(
            {"message": "Usuario reactivado correctamente"},
            status=status.HTTP_200_OK,
        )
