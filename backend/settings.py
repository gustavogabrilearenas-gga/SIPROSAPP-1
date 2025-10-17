"""
Django settings for SIPROSA MES Backend
Configuración unificada para desarrollo y producción
"""

import logging
import os
from pathlib import Path
from dotenv import load_dotenv


if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)


logger = logging.getLogger(__name__)

# ============================================
# BASE CONFIGURATION
# ============================================
BASE_DIR = Path(__file__).resolve().parent.parent

# Detectar entorno
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# Cargar variables de entorno según el ambiente
if IS_PRODUCTION:
    env_path = BASE_DIR / ".env.prod"
else:
    env_path = BASE_DIR / ".env.dev"

if env_path.exists():
    load_dotenv(env_path)
    logger.info("Entorno detectado: %s", ENVIRONMENT)
    logger.info("Archivo .env cargado: %s", env_path)
else:
    logger.warning("Archivo %s no existe", env_path)
    logger.warning("Intente primero ejecutar: python setup_dev.py")
    # Intentar cargar variables de entorno del sistema
    load_dotenv()

# ============================================
# SECURITY SETTINGS
# ============================================
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("[ERROR] SECRET_KEY no está configurada en las variables de entorno")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

if "testserver" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("testserver")

# ============================================
# APPLICATION DEFINITION
# ============================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'backend.core',
    'backend.auditoria.apps.AuditoriaConfig',
    'backend.usuarios.apps.UsuariosConfig',
    'backend.produccion',
    'backend.mantenimiento',
    'backend.incidencias',
    'backend.eventos.apps.EventosConfig',
    'backend.catalogos.apps.CatalogosConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # WhiteNoise debe ir después de SecurityMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'backend.middleware.error_handler.GlobalErrorMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ============================================
# DATABASE
# ============================================
# Usar SQLite si no hay configuración de PostgreSQL (desarrollo local)
if os.getenv('DB_HOST') and os.getenv('DB_NAME'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
    logger.info("Base de datos configurada: PostgreSQL")
else:
    # Fallback a SQLite para desarrollo sin PostgreSQL
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    logger.info("Base de datos configurada: SQLite (desarrollo local)")

# ============================================
# PASSWORD VALIDATION
# ============================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================
# INTERNATIONALIZATION
# ============================================
LANGUAGE_CODE = 'es-ar'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

# ============================================
# STATIC FILES
# ============================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'backend' / 'staticfiles'

# WhiteNoise configuration para servir archivos estáticos en producción
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ============================================
# DEFAULT PRIMARY KEY AND USER MODEL
# ============================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'auth.User'

# ============================================
# CORS & CSRF CONFIGURATION
# ============================================
CORS_ALLOWED_ORIGINS = [
    origin.strip() 
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") 
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip() 
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") 
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True

# Configuración adicional de CORS para desarrollo
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_METHODS = [
        'DELETE',
        'GET',
        'OPTIONS',
        'PATCH',
        'POST',
        'PUT',
    ]
    CORS_ALLOW_HEADERS = [
        'accept',
        'accept-encoding',
        'authorization',
        'content-type',
        'dnt',
        'origin',
        'user-agent',
        'x-csrftoken',
        'x-requested-with',
    ]

# ============================================
# SECURITY HEADERS (Base)
# ============================================
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'same-origin'

# ============================================
# PRODUCTION SECURITY SETTINGS
# ============================================
if IS_PRODUCTION:
    # HTTPS y cookies seguras
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True

    # HSTS (HTTP Strict Transport Security)
    SECURE_HSTS_SECONDS = 31536000  # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    logger.info("Configuración de seguridad para PRODUCCIÓN activada")
else:
    # Desarrollo: cookies sin HTTPS
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_SSL_REDIRECT = False
    SECURE_HSTS_SECONDS = 0

    logger.info("Configuración de seguridad para DESARROLLO activa")

# ============================================
# LOGGING CONFIGURATION
# ============================================
LOGGING_FORMATTERS = {
    "verbose": {
        "format": "[{asctime}] {levelname} {name} - {message}",
        "style": "{",
    },
    "simple": {
        "format": "{levelname}: {message}",
        "style": "{",
    },
}

LOGGING_HANDLERS = {}
default_handlers = []

if IS_PRODUCTION:
    LOG_DIR = BASE_DIR / "backend" / "logs"
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    LOGGING_HANDLERS["app_file"] = {
        "level": "INFO",
        "class": "logging.handlers.RotatingFileHandler",
        "filename": str(LOG_DIR / "app.log"),
        "maxBytes": 5 * 1024 * 1024,
        "backupCount": 3,
        "formatter": "verbose",
    }
    default_handlers.append("app_file")
else:
    LOGGING_HANDLERS["console"] = {
        "class": "logging.StreamHandler",
        "formatter": "simple",
        "level": "INFO",
    }
    default_handlers.append("console")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": LOGGING_FORMATTERS,
    "handlers": LOGGING_HANDLERS,
    "root": {
        "handlers": default_handlers,
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": default_handlers,
            "level": "INFO",
            "propagate": False,
        },
    },
}

# ============================================
# DJANGO REST FRAMEWORK
# ============================================
REST_FRAMEWORK = {
    # Autenticación
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        # SessionAuthentication removido - solo usamos JWT (sin CSRF)
    ),
    
    # Permisos
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    
    # Paginación
    "DEFAULT_PAGINATION_CLASS": "backend.pagination.DefaultPageNumberPagination",
    "PAGE_SIZE": 50,
    
    # Filtrado y búsqueda
    "DEFAULT_FILTER_BACKENDS": [
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    
    # Throttling (limitación de peticiones)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
    
    # Formato de respuesta
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}

# ============================================
# SIMPLE JWT CONFIGURATION
# ============================================
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),  # Token válido por 8 horas (jornada laboral)
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

logger.info("Configuración cargada correctamente")
