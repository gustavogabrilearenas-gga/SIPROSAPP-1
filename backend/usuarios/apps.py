from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.usuarios"
    verbose_name = "Usuarios"
    
    def ready(self):
        """Importar las señales cuando la aplicación esté lista."""
        import backend.usuarios.models  # noqa
