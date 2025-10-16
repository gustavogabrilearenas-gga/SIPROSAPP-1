"""
Modelos de datos para SIPROSA MES
Sistema de Gestión de Manufactura para Planta Farmacéutica
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import hashlib

from backend.usuarios.models import UserProfile


# ============================================
# 3. MÓDULO: PRODUCCIÓN
# ============================================


# ============================================
# 4. MÓDULO: INVENTARIO
# ============================================




