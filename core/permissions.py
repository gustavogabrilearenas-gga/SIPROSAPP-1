# core/permissions.py
from rest_framework.permissions import BasePermission

def _is_in(user, group_name: str) -> bool:
    return user.is_authenticated and user.groups.filter(name=group_name).exists()

def is_admin(user) -> bool:
    """Determina si el usuario debe ser considerado administrador."""

    # Para la administración del sistema consideramos administradores a:
    # * Superusuarios (tienen todos los permisos)
    # * Usuarios marcados como staff (is_staff=True)
    # * Usuarios pertenecientes al grupo "Administrador"
    #
    # Anteriormente sólo se contemplaba a los superusuarios o a los usuarios
    # dentro del grupo "Administrador". Sin embargo, en la interfaz web se
    # permite el acceso a secciones de configuración a cualquier usuario con
    # la marca `is_staff`. Al intentar consumir los endpoints protegidos, esos
    # usuarios obtenían un 403 que terminaba mostrado como un error 500 en la
    # interfaz.  Al incluir `is_staff` aquí, alineamos la lógica de permisos del
    # backend con lo que la interfaz espera y evitamos el fallo.
    return user.is_authenticated and (
        user.is_superuser or user.is_staff or _is_in(user, "Administrador")
    )

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
