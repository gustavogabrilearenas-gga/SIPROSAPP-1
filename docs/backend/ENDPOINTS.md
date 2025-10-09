# Catálogo de Endpoints

Generado automáticamente a partir del esquema OpenAPI y la inspección de permisos.

## GET `/api/auditoria/firmas/`
ViewSet para gestionar Firmas Electrónicas

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/auditoria/firmas/`
ViewSet para gestionar Firmas Electrónicas

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/CreateSignature``
- **Respuesta principal**: ``#/components/schemas/CreateSignature``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/auditoria/logs/`
Consulta de logs de auditoría con filtros

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## POST `/api/auth/login/`
Endpoint de login
POST /api/auth/login/

- **Acción**: `post`
- **Módulo/Tag**: api
- **Permisos DRF**: AllowAny
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: N/A
- **Errores esperados**: No declarados


## POST `/api/auth/logout/`
Endpoint de logout
POST /api/auth/logout/

- **Acción**: `post`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: N/A
- **Errores esperados**: No declarados


## GET `/api/auth/me/`
Obtener información del usuario actual
GET /api/auth/me/

- **Acción**: `get`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## POST `/api/auth/refresh/`
Refrescar access token
POST /api/auth/refresh/

- **Acción**: `post`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: N/A
- **Errores esperados**: No declarados


## POST `/api/auth/register/`
Registro de nuevo usuario (OPCIONAL - solo para demo)
POST /api/auth/register/

- **Acción**: `post`
- **Módulo/Tag**: api
- **Permisos DRF**: AllowAny
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: N/A
- **Errores esperados**: No declarados


## GET `/api/buscar/`
Vista para búsqueda global en el sistema
GET /api/buscar?q=texto&limit=20

- **Acción**: `get`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## GET `/api/calidad/acciones-correctivas/`
ViewSet para gestionar Acciones Correctivas (CAPA)

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/calidad/acciones-correctivas/`
ViewSet para gestionar Acciones Correctivas (CAPA)

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/AccionCorrectiva``
- **Respuesta principal**: ``#/components/schemas/AccionCorrectiva``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/calidad/acciones-correctivas/pendientes/`

- **Acción**: `pendientes`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/AccionCorrectiva``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/calidad/desviaciones/`
ViewSet para gestionar Desviaciones

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/calidad/desviaciones/`
ViewSet para gestionar Desviaciones

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Desviacion``
- **Respuesta principal**: ``#/components/schemas/Desviacion``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/calidad/desviaciones/abiertas/`

- **Acción**: `abiertas`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/Desviacion``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/calidad/documentos/`
ViewSet para gestionar Documentos Versionados

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/calidad/documentos/`
ViewSet para gestionar Documentos Versionados

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/DocumentoVersionado``
- **Respuesta principal**: ``#/components/schemas/DocumentoVersionado``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/etapas-produccion/`
ViewSet para gestionar Etapas de Producci�n

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/etapas-produccion/`
ViewSet para gestionar Etapas de Producci�n

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/EtapaProduccion``
- **Respuesta principal**: ``#/components/schemas/EtapaProduccion``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/formulas/`
ViewSet para gestionar F�rmulas

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/formulas/`
ViewSet para gestionar F�rmulas

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Formula``
- **Respuesta principal**: ``#/components/schemas/Formula``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/incidencias/incidentes/`
ViewSet para gestionar Incidentes

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/incidencias/incidentes/`
ViewSet para gestionar Incidentes

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Incidente``
- **Respuesta principal**: ``#/components/schemas/Incidente``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/incidencias/incidentes/abiertos/`

- **Acción**: `abiertos`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/Incidente``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/incidencias/tipos-incidente/`
ViewSet para gestionar Tipos de Incidente

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/incidencias/tipos-incidente/`
ViewSet para gestionar Tipos de Incidente

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/TipoIncidente``
- **Respuesta principal**: ``#/components/schemas/TipoIncidente``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/inventario/`
ViewSet para gestionar Insumos

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/inventario/`
ViewSet para gestionar Insumos

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Insumo``
- **Respuesta principal**: ``#/components/schemas/Insumo``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/inventario/insumos/`
ViewSet para gestionar Insumos

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/inventario/insumos/`
ViewSet para gestionar Insumos

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Insumo``
- **Respuesta principal**: ``#/components/schemas/Insumo``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/inventario/lotes-insumo/`
ViewSet para gestionar Lotes de Insumos

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/inventario/lotes-insumo/`
ViewSet para gestionar Lotes de Insumos

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/LoteInsumo``
- **Respuesta principal**: ``#/components/schemas/LoteInsumo``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/inventario/movimientos/`
ViewSet para gestionar Movimientos de Inventario

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/inventario/movimientos/`
ViewSet para gestionar Movimientos de Inventario

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/MovimientoInventario``
- **Respuesta principal**: ``#/components/schemas/MovimientoInventario``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/inventario/movimientos/resumen/`
Devuelve un resumen general de movimientos por tipo de ítem.

- **Acción**: `resumen`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/MovimientoInventario``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/inventario/productos-terminados/`
ViewSet para gestionar Productos Terminados

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/inventario/productos-terminados/`
ViewSet para gestionar Productos Terminados

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/ProductoTerminado``
- **Respuesta principal**: ``#/components/schemas/ProductoTerminado``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/inventario/repuestos/`
ViewSet para gestionar Repuestos

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/inventario/repuestos/`
ViewSet para gestionar Repuestos

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Repuesto``
- **Respuesta principal**: ``#/components/schemas/Repuesto``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/kpis/alertas/`
Provee un resumen de alertas críticas y operativas.

- **Acción**: `get`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## GET `/api/kpis/export.csv`
Vista para exportar KPIs en CSV
GET /api/kpis/export.csv?desde=YYYY-MM-DD&hasta=YYYY-MM-DD

- **Acción**: `get`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## GET `/api/kpis/historial_produccion/`
Entregra series temporales de la producción diaria.

- **Acción**: `get`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## GET `/api/kpis/live_alerts/`
Entrega eventos recientes con nivel de severidad para el monitoreo en vivo.

- **Acción**: `get`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## GET `/api/kpis/oee/`
Vista para calcular OEE (Overall Equipment Effectiveness)
GET /api/kpis/oee/?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&turno=M

- **Acción**: `get`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## GET `/api/kpis/resumen_dashboard/`
Vista para resumen del dashboard
GET /api/kpis/resumen_dashboard/

- **Acción**: `get`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``array``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
[
  ""
]
````

## GET `/api/mantenimiento/`
ViewSet para gestionar Órdenes de Trabajo.

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/mantenimiento/`
ViewSet para gestionar Órdenes de Trabajo.

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/OrdenTrabajo``
- **Respuesta principal**: ``#/components/schemas/OrdenTrabajo``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/mantenimiento/abiertas/`

- **Acción**: `abiertas`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/OrdenTrabajo``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/mantenimiento/ordenes-trabajo/`
ViewSet para gestionar Órdenes de Trabajo.

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/mantenimiento/ordenes-trabajo/`
ViewSet para gestionar Órdenes de Trabajo.

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/OrdenTrabajo``
- **Respuesta principal**: ``#/components/schemas/OrdenTrabajo``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/mantenimiento/ordenes-trabajo/abiertas/`

- **Acción**: `abiertas`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/OrdenTrabajo``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/mantenimiento/tipos-mantenimiento/`
ViewSet para gestionar Tipos de Mantenimiento.

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/mantenimiento/tipos-mantenimiento/`
ViewSet para gestionar Tipos de Mantenimiento.

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/TipoMantenimiento``
- **Respuesta principal**: ``#/components/schemas/TipoMantenimiento``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/maquinas/`
ViewSet para gestionar M�quinas

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/maquinas/`
ViewSet para gestionar M�quinas

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Maquina``
- **Respuesta principal**: ``#/components/schemas/Maquina``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/notificaciones/`
ViewSet para gestionar Notificaciones

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/notificaciones/`
ViewSet para gestionar Notificaciones

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Notificacion``
- **Respuesta principal**: ``#/components/schemas/Notificacion``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## POST `/api/notificaciones/marcar_todas_leidas/`

- **Acción**: `marcar_todas_leidas`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Notificacion``
- **Respuesta principal**: ``#/components/schemas/Notificacion``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/notificaciones/no_leidas/`

- **Acción**: `no_leidas`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/Notificacion``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/produccion/`
ViewSet para gestionar Lotes de Producción

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/produccion/`
ViewSet para gestionar Lotes de Producción

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Lote``
- **Respuesta principal**: ``#/components/schemas/Lote``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/produccion/controles-calidad/`
ViewSet para gestionar Controles de Calidad

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/produccion/controles-calidad/`
ViewSet para gestionar Controles de Calidad

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/ControlCalidad``
- **Respuesta principal**: ``#/components/schemas/ControlCalidad``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/produccion/lotes-etapas/`
ViewSet para gestionar Etapas de Lotes

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/produccion/lotes-etapas/`
ViewSet para gestionar Etapas de Lotes

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrOperario
- **Roles habilitados**: Admin, Operario
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/LoteEtapa``
- **Respuesta principal**: ``#/components/schemas/LoteEtapa``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/produccion/lotes/`
ViewSet para gestionar Lotes de Producción

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/produccion/lotes/`
ViewSet para gestionar Lotes de Producción

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Lote``
- **Respuesta principal**: ``#/components/schemas/Lote``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/produccion/lotes/en_proceso/`

- **Acción**: `en_proceso`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/Lote``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/produccion/lotes/resumen_hoy/`

- **Acción**: `resumen_hoy`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/Lote``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## GET `/api/produccion/paradas/`
ViewSet para gestionar Paradas

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/produccion/paradas/`
ViewSet para gestionar Paradas

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrOperario
- **Roles habilitados**: Admin, Operario
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Parada``
- **Respuesta principal**: ``#/components/schemas/Parada``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/productos/`
ViewSet para gestionar Productos

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/productos/`
ViewSet para gestionar Productos

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Producto``
- **Respuesta principal**: ``#/components/schemas/Producto``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## POST `/api/token/`
Takes a set of user credentials and returns an access and refresh JSON web
token pair to prove the authentication of those credentials.

- **Acción**: `post`
- **Módulo/Tag**: api
- **Permisos DRF**: (ninguno)
- **Roles habilitados**: No asignado
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/TokenObtainPair``
- **Respuesta principal**: ``#/components/schemas/TokenObtainPair``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## POST `/api/token/refresh/`
Takes a refresh type JSON web token and returns an access type JSON web
token if the refresh token is valid.

- **Acción**: `post`
- **Módulo/Tag**: api
- **Permisos DRF**: (ninguno)
- **Roles habilitados**: No asignado
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/TokenRefresh``
- **Respuesta principal**: ``#/components/schemas/TokenRefresh``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/turnos/`
ViewSet para gestionar Turnos

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/turnos/`
ViewSet para gestionar Turnos

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Turno``
- **Respuesta principal**: ``#/components/schemas/Turno``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/ubicaciones/`
ViewSet para gestionar Ubicaciones

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdminOrSupervisor
- **Roles habilitados**: Admin, Supervisor
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/ubicaciones/`
ViewSet para gestionar Ubicaciones

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/Ubicacion``
- **Respuesta principal**: ``#/components/schemas/Ubicacion``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/usuarios/`
ViewSet para gestión de usuarios (solo admin/superuser).

- **Acción**: `list`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: page, page_size, search, ordering
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``object``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
{
  "count": 0,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    ""
  ]
}
````

## POST `/api/usuarios/`
ViewSet para gestión de usuarios (solo admin/superuser).

- **Acción**: `create`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAdmin
- **Roles habilitados**: Admin
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/CrearUsuario``
- **Respuesta principal**: ``#/components/schemas/CrearUsuario``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## POST `/api/usuarios/cambiar_mi_password/`
ViewSet para gestión de usuarios (solo admin/superuser).

- **Acción**: `cambiar_mi_password`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/CambiarPassword``
- **Respuesta principal**: ``#/components/schemas/CambiarPassword``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## GET `/api/usuarios/me/`
ViewSet para gestión de usuarios (solo admin/superuser).

- **Acción**: `me`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado**: N/A
- **Respuesta principal**: ``#/components/schemas/UsuarioDetalle``
- **Errores esperados**: No declarados


**Ejemplo de respuesta**
````json
""
````

## PATCH `/api/usuarios/update_me/`
ViewSet para gestión de usuarios (solo admin/superuser).

- **Acción**: `update_me`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/UsuarioPerfil``
- **Respuesta principal**: ``#/components/schemas/UsuarioPerfil``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````

## PUT `/api/usuarios/update_me/`
ViewSet para gestión de usuarios (solo admin/superuser).

- **Acción**: `update_me`
- **Módulo/Tag**: api
- **Permisos DRF**: IsAuthenticated
- **Roles habilitados**: Admin, Supervisor, Operario, Calidad, Mantenimiento, Planificación, Gerencia
- **Parámetros de ruta**: N/A
- **Parámetros query**: N/A
- **Cuerpo esperado (schema)**: ``#/components/schemas/UsuarioPerfil``
- **Respuesta principal**: ``#/components/schemas/UsuarioPerfil``
- **Errores esperados**: No declarados

**Ejemplo de request**
````json
""
````

**Ejemplo de respuesta**
````json
""
````
