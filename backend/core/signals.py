"""Señales del dominio core."""

from django.apps import apps
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

UserModel = apps.get_model(settings.AUTH_USER_MODEL)
UserProfile = apps.get_model("usuarios", "UserProfile")


@receiver(post_save, sender=UserModel)
def update_existing_user_profile(sender, instance, created, **kwargs):
    """Actualiza el perfil del usuario solo si ya existe."""
    try:
        profile = instance.user_profile
    except UserProfile.DoesNotExist:
        # La creación del perfil se delega al serializer de usuarios
        return

    if not created:
        profile.save()
