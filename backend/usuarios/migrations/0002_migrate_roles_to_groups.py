"""Migración de roles a grupos de Django."""

from django.db import migrations


def forwards(apps, schema_editor):
    """Migra los roles a grupos de Django."""
    Group = apps.get_model('auth', 'Group')
    User = apps.get_model('auth', 'User')
    Rol = apps.get_model('usuarios', 'Rol')
    UsuarioRol = apps.get_model('usuarios', 'UsuarioRol')

    # Migrar roles a grupos
    for rol in Rol.objects.all():
        group, _ = Group.objects.get_or_create(name=rol.nombre)

    # Migrar asignaciones de roles a grupos
    for asignacion in UsuarioRol.objects.select_related('usuario', 'rol'):
        grupo = Group.objects.get(name=asignacion.rol.nombre)
        asignacion.usuario.groups.add(grupo)


def backwards(apps, schema_editor):
    """No implementamos el rollback para esta migración."""
    pass


class Migration(migrations.Migration):
    """Migración para transferir roles a grupos."""

    dependencies = [
        ('usuarios', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]