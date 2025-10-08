# Variables de Entorno - SIPROSA MES

## 📋 Configuración Requerida

Copia y pega estas variables en:
- **Desarrollo local**: Crea archivo `.env.dev` en la raíz del proyecto
- **Railway**: Pega en el Dashboard → Variables

---

## 🔧 Variables Básicas

```bash
# ============================================
# ENTORNO
# ============================================
ENVIRONMENT=development
# Opciones: development | production

# ============================================
# DJANGO CORE
# ============================================
SECRET_KEY=tu-clave-secreta-super-segura-aqui-cambiar
DEBUG=True
# En producción: DEBUG=False

ALLOWED_HOSTS=localhost,127.0.0.1,.railway.app
# Separar múltiples hosts con comas (sin espacios)

# ============================================
# BASE DE DATOS (PostgreSQL)
# ============================================
DB_NAME=siprosa_mes
DB_USER=postgres
DB_PASSWORD=tu-password-aqui
DB_HOST=localhost
DB_PORT=5432

# ============================================
# CORS & CSRF
# ============================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 🚂 Configuración Específica para Railway

Railway provee automáticamente las variables de base de datos cuando agregas el servicio PostgreSQL. Puedes usar:

**Opción A: Usar DATABASE_URL (más simple)**
```bash
# Railway provee esto automáticamente
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

**Opción B: Variables individuales**
```bash
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
```

---

## 🔒 Variables para Producción

Cuando `ENVIRONMENT=production`, el sistema automáticamente activa:
- ✅ HTTPS obligatorio
- ✅ Cookies seguras
- ✅ HSTS habilitado
- ✅ Headers de seguridad

**Variables adicionales requeridas:**
```bash
ENVIRONMENT=production
DEBUG=False
ALLOWED_HOSTS=tu-dominio.railway.app,tudominio.com
CORS_ALLOWED_ORIGINS=https://tu-frontend.railway.app,https://tudominio.com
CSRF_TRUSTED_ORIGINS=https://tu-frontend.railway.app,https://tudominio.com
```

---

## 🎯 Generar SECRET_KEY Segura

En Python:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

O en terminal:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## ✅ Checklist de Variables en Railway

Antes de hacer deploy, verifica que tengas configuradas:

- [ ] `ENVIRONMENT=production`
- [ ] `SECRET_KEY` (generada, no usar la del ejemplo)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` (incluye `.railway.app`)
- [ ] Variables de PostgreSQL (automáticas si conectaste el servicio)
- [ ] `CORS_ALLOWED_ORIGINS` (tu frontend)
- [ ] `CSRF_TRUSTED_ORIGINS` (tu frontend)

