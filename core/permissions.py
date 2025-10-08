# core/permissions.py
from rest_framework.permissions import BasePermission

def _is_in(user, group_name: str) -> bool:
    return user.is_authenticated and user.groups.filter(name=group_name).exists()

def is_admin(user) -> bool:
    # Consideramos admin si es superuser o está en el grupo "Administrador"
    return user.is_authenticated and (user.is_superuser or _is_in(user, "Administrador"))

def is_supervisor(user) -> bool:
    return _is_in(user, "Supervisor")

def is_operario(user) -> bool:
    return _is_in(user, "Operario")


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class IsSupervisor(BasePermission):
    def has_permission(self, request, view):
        return is_supervisor(request.user)


class IsOperario(BasePermission):
    def has_permission(self, request, view):
        return is_operario(request.user)


class IsAdminOrSupervisor(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return is_admin(u) or is_supervisor(u)


class IsAdminOrOperario(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return is_admin(u) or is_operario(u)
