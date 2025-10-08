# 📚 API Documentation - SIPROSA MES

## 🔐 Autenticación

Todos los endpoints (excepto `/api/health/` y `/api/token/`) requieren autenticación JWT.

### Obtener Token

**Endpoint:** `POST /api/token/`

```bash
curl -X POST https://tu-backend.railway.app/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_password"
  }'
```

**Respuesta:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refrescar Token

**Endpoint:** `POST /api/token/refresh/`

```bash
curl -X POST https://tu-backend.railway.app/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "tu_refresh_token"
  }'
```

### Usar Token en Requests

Incluye el token en el header `Authorization`:

```bash
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 📊 Endpoints Disponibles

### Health Check

**Endpoint:** `GET /api/health/`

**Descripción:** Verifica el estado del servidor y la base de datos.

**Autenticación:** No requerida

**Respuesta:**
```json
{
  "status": "ok",
  "database": true,
  "debug": false,
  "django_version": "5.2.7",
  "server_time": "2025-10-05T15:30:00",
  "environment": "production"
}
```

---

## 🏭 Máquinas

### Listar Máquinas

**Endpoint:** `GET /api/maquinas/`

**Permisos:** Admin o Supervisor

**Query Params:**
- `?activa=true` - Filtrar por estado activo/inactivo
- `?search=nombre` - Buscar por nombre, ubicación o descripción
- `?ordering=nombre` - Ordenar por campo (usar `-nombre` para descendente)
- `?page=1` - Paginación (50 por página)

**Ejemplo:**
```bash
curl https://tu-backend.railway.app/api/maquinas/?activa=true \
  -H "Authorization: Bearer TOKEN"
```

**Respuesta:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "nombre": "Comprimidora Principal",
      "ubicacion": "Lab. Comprimidos",
      "descripcion": "Junior Express - 10 estaciones",
      "activa": true,
      "total_producciones": 45
    }
  ]
}
```

### Obtener Máquina Específica

**Endpoint:** `GET /api/maquinas/{id}/`

**Ejemplo:**
```bash
curl https://tu-backend.railway.app/api/maquinas/1/ \
  -H "Authorization: Bearer TOKEN"
```

### Crear Máquina

**Endpoint:** `POST /api/maquinas/`

**Permisos:** Solo Admin

**Body:**
```json
{
  "nombre": "Emblistadora Grande",
  "ubicacion": "Lab. Comprimidos",
  "descripcion": "MAC S-100",
  "activa": true
}
```

### Actualizar Máquina

**Endpoint:** `PUT /api/maquinas/{id}/` o `PATCH /api/maquinas/{id}/`

**Permisos:** Solo Admin

**Body (PATCH - parcial):**
```json
{
  "activa": false
}
```

### Eliminar Máquina

**Endpoint:** `DELETE /api/maquinas/{id}/`

**Permisos:** Solo Admin

### Producciones Recientes de una Máquina

**Endpoint:** `GET /api/maquinas/{id}/producciones_recientes/`

**Descripción:** Retorna las últimas 10 producciones de la máquina

**Respuesta:**
```json
[
  {
    "id": 123,
    "codigo_lote": "LOTE-2025-001",
    "producto": "Ibuprofeno 400mg",
    "maquina_nombre": "Comprimidora Principal",
    "fecha_inicio": "2025-10-05T08:00:00Z",
    "fecha_fin": "2025-10-05T12:30:00Z",
    "cantidad_producida": 5000,
    "turno_display": "Mañana"
  }
]
```

---

## 📦 Producción

### Listar Producciones

**Endpoint:** `GET /api/producciones/`

**Permisos:** Admin o Supervisor

**Query Params:**
- `?maquina=1` - Filtrar por ID de máquina
- `?turno=M` - Filtrar por turno (M/T/N)
- `?fecha_desde=2025-01-01` - Desde fecha
- `?fecha_hasta=2025-12-31` - Hasta fecha
- `?en_proceso=true` - Solo en proceso (true) o finalizadas (false)
- `?search=codigo_lote` - Buscar por código de lote o producto
- `?ordering=-fecha_inicio` - Ordenar
- `?page=1` - Paginación

**Ejemplo:**
```bash
curl "https://tu-backend.railway.app/api/producciones/?turno=M&en_proceso=true" \
  -H "Authorization: Bearer TOKEN"
```

**Respuesta (lista simplificada):**
```json
{
  "count": 15,
  "next": "https://tu-backend.railway.app/api/producciones/?page=2",
  "previous": null,
  "results": [
    {
      "id": 123,
      "codigo_lote": "LOTE-2025-001",
      "producto": "Ibuprofeno 400mg",
      "maquina_nombre": "Comprimidora Principal",
      "fecha_inicio": "2025-10-05T08:00:00Z",
      "fecha_fin": null,
      "cantidad_producida": 5000,
      "turno_display": "Mañana"
    }
  ]
}
```

### Obtener Producción Específica

**Endpoint:** `GET /api/producciones/{id}/`

**Respuesta (detallada):**
```json
{
  "id": 123,
  "maquina": 1,
  "maquina_nombre": "Comprimidora Principal",
  "maquina_ubicacion": "Lab. Comprimidos",
  "codigo_lote": "LOTE-2025-001",
  "producto": "Ibuprofeno 400mg",
  "fecha_inicio": "2025-10-05T08:00:00Z",
  "fecha_fin": "2025-10-05T12:30:00Z",
  "cantidad_producida": 5000,
  "turno": "M",
  "turno_display": "Mañana",
  "observaciones": "Producción normal sin incidentes",
  "duracion_horas": 4.5,
  "estado": "Finalizado"
}
```

### Crear Producción

**Endpoint:** `POST /api/producciones/`

**Permisos:** Admin u Operario

**Body:**
```json
{
  "maquina": 1,
  "codigo_lote": "LOTE-2025-002",
  "producto": "Paracetamol 500mg",
  "fecha_inicio": "2025-10-05T14:00:00Z",
  "fecha_fin": null,
  "cantidad_producida": 3000,
  "turno": "T",
  "observaciones": ""
}
```

**Validaciones automáticas:**
- ✅ Código de lote debe ser único
- ✅ Cantidad producida > 0
- ✅ Fecha fin debe ser posterior a fecha inicio
- ✅ Máquina debe estar activa

### Actualizar Producción

**Endpoint:** `PATCH /api/producciones/{id}/`

**Permisos:** Solo Admin

**Ejemplo (finalizar producción):**
```json
{
  "fecha_fin": "2025-10-05T18:00:00Z",
  "cantidad_producida": 4500
}
```

### Producciones en Proceso

**Endpoint:** `GET /api/producciones/en_proceso/`

**Descripción:** Solo retorna producciones sin `fecha_fin`

```bash
curl https://tu-backend.railway.app/api/producciones/en_proceso/ \
  -H "Authorization: Bearer TOKEN"
```

### Resumen del Día

**Endpoint:** `GET /api/producciones/resumen_hoy/`

**Descripción:** Estadísticas de producción del día actual

```bash
curl https://tu-backend.railway.app/api/producciones/resumen_hoy/ \
  -H "Authorization: Bearer TOKEN"
```

**Respuesta:**
```json
{
  "fecha": "2025-10-05",
  "total_producciones": 8,
  "en_proceso": 2,
  "finalizadas": 6,
  "cantidad_total_producida": 35000,
  "por_turno": {
    "manana": 3,
    "tarde": 3,
    "noche": 2
  },
  "por_maquina": [
    {
      "maquina__nombre": "Comprimidora Principal",
      "total": 5
    },
    {
      "maquina__nombre": "Emblistadora Grande",
      "total": 3
    }
  ]
}
```

---

## 🔒 Permisos por Rol

| Endpoint | Admin | Supervisor | Operario | Almacén | Mantenimiento |
|----------|-------|------------|----------|---------|---------------|
| **Máquinas** | | | | | |
| Ver | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar/Eliminar | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Producción** | | | | | |
| Ver | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear | ✅ | ❌ | ✅ | ❌ | ❌ |
| Editar/Eliminar | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📝 Códigos de Estado HTTP

| Código | Significado | Cuándo Ocurre |
|--------|-------------|---------------|
| 200 | OK | Request exitoso |
| 201 | Created | Recurso creado exitosamente |
| 204 | No Content | Eliminación exitosa |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos para esta acción |
| 404 | Not Found | Recurso no existe |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Server Error | Error interno del servidor |

---

## 🚦 Rate Limiting

Para prevenir abuso, la API tiene límites de peticiones:

- **Usuarios autenticados:** 1000 requests/hora
- **Usuarios anónimos:** 100 requests/hora

Si excedes el límite, recibirás:
```json
{
  "detail": "Request was throttled. Expected available in 3600 seconds."
}
```

---

## 🧪 Ejemplos de Uso con Fetch (JavaScript)

### Obtener Token y Hacer Request

```javascript
// 1. Login
const response = await fetch('https://tu-backend.railway.app/api/token/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'operario',
    password: 'password123'
  })
});

const { access } = await response.json();

// 2. Usar el token
const producciones = await fetch('https://tu-backend.railway.app/api/producciones/', {
  headers: {
    'Authorization': `Bearer ${access}`
  }
});

const data = await producciones.json();
console.log(data);
```

### Crear Producción

```javascript
const nuevaProduccion = await fetch('https://tu-backend.railway.app/api/producciones/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    maquina: 1,
    codigo_lote: 'LOTE-2025-003',
    producto: 'Aspirina 500mg',
    fecha_inicio: new Date().toISOString(),
    cantidad_producida: 2000,
    turno: 'M'
  })
});

const produccion = await nuevaProduccion.json();
console.log(produccion);
```

---

## 📌 Notas Importantes

1. **Tokens JWT expiran en 8 horas** (duración de jornada laboral)
2. **Refresh tokens válidos por 7 días**
3. **Todos los timestamps en formato ISO 8601 UTC**
4. **Paginación por defecto: 50 items por página**
5. **Los códigos de lote se convierten automáticamente a mayúsculas**

---

## 🔄 Próximos Endpoints (Roadmap)

- [ ] `/api/mantenimiento/` - Órdenes de trabajo
- [ ] `/api/incidentes/` - Registro de incidentes
- [ ] `/api/inventario/` - Gestión de stock
- [ ] `/api/kpis/` - Cálculo de KPIs (OEE, MTBF, MTTR)
- [ ] `/api/reportes/` - Generación de reportes PDF

