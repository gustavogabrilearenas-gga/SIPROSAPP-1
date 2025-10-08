# 🏭 SIPROSA MES - Sistema de Gestión de Manufactura

Sistema MES (Manufacturing Execution System) para la **Farmacia Oficial del Sistema Provincial de Salud (SIPROSA)** de Tucumán.

## 📋 Descripción

Plataforma web integral para la gestión operativa de la planta farmacéutica del SIPROSA. El sistema reemplaza el flujo actual basado en Google Forms/Sheets por una solución centralizada, segura y con trazabilidad completa.

### Módulos Planificados

- ✅ **Producción** (MVP actual): Gestión de lotes y etapas productivas
- 🔄 **Mantenimiento**: Órdenes de trabajo preventivo y correctivo
- 🔄 **Incidentes**: Registro y seguimiento de incidencias
- 🔄 **Inventario**: Control FEFO de insumos, repuestos y terminados
- 🔄 **KPIs**: Dashboards con OEE, MTBF, MTTR
- 🔄 **Reportes**: Generación de reportes PDF auditables

---

## 🚀 Estado Actual del Proyecto

### ✅ Completado (MVP v0.1)

- [x] Backend Django REST Framework
- [x] Autenticación JWT
- [x] Sistema de permisos por roles (Admin/Supervisor/Operario)
- [x] Modelos: Máquina y Producción
- [x] API REST con validaciones robustas
- [x] Filtros y búsqueda avanzada
- [x] Endpoints personalizados (resumen del día, producciones en proceso)
- [x] Deploy configurado para Render
- [x] PostgreSQL como base de datos
- [x] Logging con rotación de archivos
- [x] Middleware de manejo de errores global
- [x] Admin de Django personalizado

### 🔄 En Progreso

- [ ] Frontend Next.js
- [ ] Docker Compose para desarrollo local
- [ ] Tests unitarios
- [ ] Módulo de Mantenimiento
- [ ] Módulo de Inventario

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework:** Django 5.2.7 + Django REST Framework 3.16.1
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT (djangorestframework-simplejwt)
- **Servidor:** Gunicorn
- **Deploy:** Render (Gratuito)

### Frontend (Planificado)
- **Framework:** Next.js 14 (React)
- **UI:** Tailwind CSS + shadcn/ui
- **Gráficos:** Recharts
- **Estado:** React Query + Zustand

### Infraestructura (Futuro)
- **Tareas Asíncronas:** Redis + Celery
- **Almacenamiento:** MinIO (S3-compatible)
- **Orquestación:** Docker Compose

---

## 📁 Estructura del Proyecto

```
ABC1/
├── backend/              # Configuración Django
│   ├── settings.py       # Settings consolidado y limpio
│   ├── urls.py           # URLs principales
│   ├── wsgi.py
│   └── middleware/
│       └── error_handler.py
│
├── core/                 # App principal
│   ├── models.py         # Maquina, Produccion
│   ├── serializers.py    # Serializers con validaciones
│   ├── views.py          # ViewSets con filtros
│   ├── permissions.py    # Permisos personalizados
│   ├── admin.py          # Admin personalizado
│   └── urls.py
│
├── logs/                 # Logs de aplicación (rotación 5MB)
├── requirements.txt      # Dependencias Python
├── runtime.txt           # Versión de Python
├── Procfile              # Comando para Gunicorn
├── nixpacks.toml         # Config de build para Render
│
├── create_admin.py       # Script para crear usuario admin
├── README.md             # Este archivo
├── API_DOCUMENTATION.md  # Documentación completa de la API
├── DEPLOY_RAILWAY.md     # Guía de deploy paso a paso
└── ENV_TEMPLATE.md       # Template de variables de entorno
```

---

## 🚀 **INICIO RÁPIDO - SISTEMA COMPLETO**

### ⚡ Setup Automático en 1 Comando (RECOMENDADO)

#### Con Docker:
```powershell
# PowerShell (Windows)
.\setup_system.ps1

# O con CMD
setup_system.bat
```

#### Sin Docker (Python local):
```powershell
# PowerShell (Windows)
.\setup_system_local.ps1

# O directamente con Python
python setup_and_verify.py
```

**Esto hace TODO automáticamente:**
- ✅ Aplica migraciones de base de datos
- ✅ Carga datos de prueba realistas (usuarios, lotes, máquinas, etc.)
- ✅ Verifica que todo funcione correctamente

### 🌐 Acceder al Sistema

Una vez completado el setup:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **Django Admin:** http://localhost:8000/admin/

### 👥 **Credenciales de Prueba (ACTUALIZADAS)**

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `sandz334@` | Administrador completo |
| `operario1` | `sandz334@` | Operario de producción |
| `supervisor1` | `sandz334@` | Supervisor de producción |
| `calidad1` | `sandz334@` | Quality Assurance (QA) |
| `mantenimiento1` | `sandz334@` | Técnico de mantenimiento |

### 📊 Datos Incluidos

El sistema viene pre-cargado con datos realistas:
- ✅ 5 usuarios con roles diferentes
- ✅ 5 máquinas de producción
- ✅ 5 productos farmacéuticos  
- ✅ 7 lotes en diferentes estados
- ✅ 6 órdenes de trabajo de mantenimiento
- ✅ 5 incidentes con severidades
- ✅ Notificaciones y alertas

### 🎯 Verificación Rápida

1. Abre http://localhost:3000
2. Login con `admin` / `sandz334@`
3. Verifica que veas:
   - Dashboard con KPIs reales
   - 7 lotes en el módulo "Lotes"
   - 6 órdenes en "Mantenimiento"
   - 5 incidentes en "Incidentes"

### 📚 Más Información

- **Guía detallada:** Ver `INICIO_RAPIDO.md`
- **Testing exhaustivo:** Ver `TESTING_AND_DEPLOYMENT.md`
- **Documentación técnica:** Ver `IMPLEMENTATION_SUMMARY.md`

### **Probar la API**

```bash
# Obtener token JWT
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123456"
  }'

# Probar API con token
curl http://localhost:8000/api/maquinas/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 📚 Documentación Completa

- **`API_DOCUMENTATION.md`** - Todos los endpoints y ejemplos
- **`DEPLOY_RAILWAY.md`** - Guía de deploy paso a paso  
- **`ENV_TEMPLATE.md`** - Variables de entorno necesarias

---

## 🔧 Instalación Local

### Prerrequisitos

- Python 3.10.12
- PostgreSQL 14+
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ABC1.git
cd ABC1
```

### 2. Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Crea un archivo `.env.dev` en la raíz:

```bash
ENVIRONMENT=development
SECRET_KEY=tu-secret-key-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=siprosa_mes
DB_USER=postgres
DB_PASSWORD=tu-password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

### 5. Crear base de datos

```bash
# Conecta a PostgreSQL y crea la DB
psql -U postgres
CREATE DATABASE siprosa_mes;
\q
```

### 6. Aplicar migraciones

```bash
python manage.py migrate
```

### 7. Crear superusuario

```bash
python manage.py createsuperuser
```

### 8. Ejecutar servidor

```bash
python manage.py runserver
```

Accede a:
- **API:** http://localhost:8000/api/
- **Admin:** http://localhost:8000/admin/
- **Health Check:** http://localhost:8000/api/health/

---

## 🚂 Deploy en Render

✅ **Ya configurado y funcionando**

**URL del Backend:** https://abc1-qifd.onrender.com

---

## 🔒 Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Admin** | Administrador del sistema | Acceso total |
| **Supervisor** | Supervisión de producción | Ver máquinas y producción |
| **Operario** | Operador de planta | Crear registros de producción |
| **Mantenimiento** | Personal de mantenimiento | (Futuro) Gestionar WOs |
| **Almacén** | Personal de almacén | (Futuro) Gestionar inventario |

---

## 📊 Roadmap

### Fase 1: Base Sólida ✅ (Actual)
- [x] Backend Django con autenticación
- [x] Modelos básicos (Máquina, Producción)
- [x] Deploy en Render

### Fase 2: Producción Completa (En progreso)
- [ ] Frontend Next.js
- [ ] Módulo de Etapas de Producción
- [ ] Registro de Consumos de Insumos
- [ ] Dashboard básico

### Fase 3: Mantenimiento
- [ ] Órdenes de Trabajo
- [ ] Historial de Mantenimiento
- [ ] Cálculo de MTBF/MTTR

### Fase 4: Inventario FEFO
- [ ] Control de Stock
- [ ] Movimientos de Inventario
- [ ] Alertas de Stock Mínimo
- [ ] Lógica FEFO

### Fase 5: KPIs y Reportes
- [ ] Cálculo de OEE
- [ ] Dashboards Recharts
- [ ] Reportes PDF auditables
- [ ] Exportación de datos

### Fase 6: Infraestructura Final
- [ ] Redis + Celery
- [ ] MinIO para archivos
- [ ] Sistema de notificaciones
- [ ] Docker Compose completo

---

## 🤝 Contribución

Este proyecto es desarrollado para SIPROSA. Para contribuir:

1. Reporta bugs o solicita features en Issues
2. Crea un branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m "feat: agregar nueva funcionalidad"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crea un Pull Request

---

## 📝 Convenciones de Código

- **PEP 8** para Python
- **Docstrings** en funciones y clases
- **Type hints** cuando sea posible
- **Español** para comentarios y documentación
- **Inglés** para nombres de variables y funciones

---

## 🐛 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'dotenv'"
```bash
pip install python-dotenv
```

### Error: "django.db.utils.OperationalError: could not connect to server"
Verifica que PostgreSQL esté corriendo y las credenciales en `.env.dev` sean correctas.

### Error 401 en la API
Tu token JWT expiró. Obtén uno nuevo con `/api/token/` o refresca con `/api/token/refresh/`.

---

## 📞 Contacto

**Desarrollador:** Ingeniero Industrial + AI Assistant
**Cliente:** SIPROSA - Farmacia Oficial Tucumán
**Ubicación:** Crisóstomo Álvarez 343, San Miguel de Tucumán

---

## 📄 Licencia

Este proyecto es de uso interno para SIPROSA.

---

## 🙏 Agradecimientos

- Equipo de SIPROSA por la confianza en el proyecto
- Comunidad Django y DRF por el excelente framework
- Render por facilitar el deploy gratuito

---

**Versión:** 0.1.0-MVP  
**Última actualización:** Octubre 2025  
**Status:** 🟢 En desarrollo activo#   G G A - 1  
 