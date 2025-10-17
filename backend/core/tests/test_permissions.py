from django.contrib.auth.models import Group, User
from django.test import TestCase

from backend.core import permissions


class IsAdminLogicTests(TestCase):
    def setUp(self):
        self.admin_group = Group.objects.create(name="Administrador")
        self.supervisor_group = Group.objects.create(name="Supervisor")
        self.operario_group = Group.objects.create(name="Operario")

    def test_superuser_is_admin(self):
        user = User.objects.create_user("root", password="pass", is_superuser=True)
        self.assertTrue(permissions.is_admin(user))

    def test_staff_user_is_admin(self):
        user = User.objects.create_user("staff", password="pass", is_staff=True)
        self.assertTrue(permissions.is_admin(user))

    def test_group_member_is_admin(self):
        user = User.objects.create_user("grouped", password="pass")
        user.groups.add(self.admin_group)
        self.assertTrue(permissions.is_admin(user))

    def test_authenticated_without_privileges_is_not_admin(self):
        user = User.objects.create_user("plain", password="pass")
        self.assertFalse(permissions.is_admin(user))

    def test_anonymous_user_is_not_admin(self):
        class Dummy:
            is_authenticated = False

        self.assertFalse(permissions.is_admin(Dummy()))


class RolePermissionTests(TestCase):
    def setUp(self):
        self.admin_group = Group.objects.create(name="Administrador")
        self.supervisor_group = Group.objects.create(name="Supervisor")
        self.operario_group = Group.objects.create(name="Operario")

    def test_is_supervisor_checks_group_membership(self):
        supervisor = User.objects.create_user("sup", password="pass")
        supervisor.groups.add(self.supervisor_group)
        other_user = User.objects.create_user("other", password="pass")

        self.assertTrue(permissions.is_supervisor(supervisor))
        self.assertFalse(permissions.is_supervisor(other_user))

    def test_is_operario_checks_group_membership(self):
        operario = User.objects.create_user("op", password="pass")
        operario.groups.add(self.operario_group)
        other_user = User.objects.create_user("other2", password="pass")

        self.assertTrue(permissions.is_operario(operario))
        self.assertFalse(permissions.is_operario(other_user))

    def test_is_admin_or_supervisor_permission(self):
        view = object()

        supervisor = User.objects.create_user("sup_perm", password="pass")
        supervisor.groups.add(self.supervisor_group)

        request = type("req", (), {"user": supervisor})
        permission = permissions.IsAdminOrSupervisor()

        self.assertTrue(permission.has_permission(request, view))

    def test_is_admin_or_operario_permission(self):
        view = object()

        operario = User.objects.create_user("op_perm", password="pass")
        operario.groups.add(self.operario_group)

        request = type("req", (), {"user": operario})
        permission = permissions.IsAdminOrOperario()

        self.assertTrue(permission.has_permission(request, view))

        non_privileged = User.objects.create_user("nope", password="pass")
        request_no_priv = type("req", (), {"user": non_privileged})
        self.assertFalse(permission.has_permission(request_no_priv, view))
