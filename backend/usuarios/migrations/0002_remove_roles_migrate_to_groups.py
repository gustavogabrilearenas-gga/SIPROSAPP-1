"""Migración para eliminar roles y moverlos a grupos de Django."""

from django.db import migrations


def forwards(apps, schema_editor):
    """Migra los roles a grupos de Django y elimina los modelos antiguos."""
    Group = apps.get_model('auth', 'Group')
    User = apps.get_model('auth', 'User')
    Rol = apps.get_model('usuarios', 'Rol')
    UsuarioRol = apps.get_model('usuarios', 'UsuarioRol')

    # Migrar roles a grupos
    for rol in Rol.objects.all():
        group, _ = Group.objects.get_or_create(name=rol.nombre)
        # Migrar asignaciones
        for asignacion in UsuarioRol.objects.filter(rol=rol):
            asignacion.usuario.groups.add(group)


def backwards(apps, schema_editor):
    """No implementamos el rollback para esta migración."""
    pass


class Migration(migrations.Migration):
    """Migración para transferir roles a grupos y eliminar modelos antiguos."""

    dependencies = [
        ('usuarios', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.RemoveField(
            model_name='usuariorol',
            name='asignado_por',
        ),
        migrations.RemoveField(
            model_name='usuariorol',
            name='rol',
        ),
        migrations.RemoveField(
            model_name='usuariorol',
            name='usuario',
        ),
        migrations.DeleteModel(
            name='Rol',
        ),
        migrations.DeleteModel(
            name='UsuarioRol',
        ),
    ]