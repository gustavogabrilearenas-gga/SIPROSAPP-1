from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.core'

    def ready(self):
        """Importa las señales cuando la app esté lista."""
        import backend.core.signals  # noqa: F401
