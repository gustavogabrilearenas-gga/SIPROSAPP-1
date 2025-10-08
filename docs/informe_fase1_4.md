# Informe de Auditoría – Fase 1.4

## Resumen general
- El backend de SIPROSA MES ofrece dominios consolidados para usuarios, producción, inventario, catálogos, mantenimiento e incidencias con autenticación JWT obligatoria y middleware de errores centralizado, pero mantiene dependencias a lógica compleja en `core` que requiere un refactor gradual para modularidad y trazabilidad industrial completa.【F:backend/settings.py†L63-L352】【F:backend/middleware/error_handler.py†L12-L41】【F:core/urls.py†L34-L82】
- El frontend Next.js cubre múltiples vistas operativas (lotes, mantenimiento, productos, dashboards) con componentes protegidos por sesión, aunque depende de un cliente `@/lib/api` no versionado y usa datos simulados en áreas críticas, limitando el valor industrial sin un backend plenamente integrado.【F:frontend/src/app/lotes/page.tsx†L1-L200】【F:frontend/src/app/mantenimiento/page.tsx†L1-L120】【F:frontend/src/components/dashboard.tsx†L1-L140】【bd613d†L1-L2】
- El modelo de datos abarca procesos MES claves (batch records, consumos, órdenes de trabajo, incidentes, auditoría), pero persisten campos genéricos (`item_id`, JSON planos) que dificultan integridad, análisis avanzado y normalización propia de entornos regulados.【F:backend/produccion/models.py†L10-L200】【F:backend/inventario/models.py†L213-L311】【F:core/models.py†L322-L600】

## Backend: estado y brechas funcionales
- **Dominios cubiertos**: API REST para catálogos (ubicaciones, máquinas, productos, fórmulas, turnos), calidad, mantenimiento, incidentes, notificaciones y firmas electrónicas, expuestos desde `core/urls.py`. Viewsets soportan filtros, paginación, auditorías y acciones específicas (p.ej. `maquinas/{id}/lotes_recientes`).【F:core/urls.py†L34-L82】【F:core/views.py†L58-L193】
- **Producción**: `LoteViewSet` y asociados ofrecen CRUD, filtros por estado/turno, cancelación, auditoría y controles de calidad, con serializers especializados para listados.【F:backend/produccion/views.py†L22-L200】 Modelos incluyen estados, prioridades y referencias a supervisores/turnos, proporcionando base sólida para gestión de batch records y calidad en línea.【F:backend/produccion/models.py†L10-L200】
- **Inventario**: Viewsets cubren insumos, lotes FEFO, repuestos, productos terminados y movimientos con validaciones FEFO en salidas, aunque `MovimientoInventario` usa campos enteros genéricos sin claves foráneas, limitando reportes automáticos y consistencia.【F:backend/inventario/views.py†L24-L200】【F:backend/inventario/models.py†L213-L311】
- **Usuarios**: `UsuarioViewSet` permite altas, edición de perfil, (re)activación y gestión de contraseñas con permisos diferenciados por acción, alineado con operación administrativa.【F:backend/usuarios/views.py†L17-L118】
- **Salud y observabilidad**: `health_check` verifica conectividad a DB en menos de un roundtrip y middleware devuelve JSON estandarizado en errores, útil para monitoreo industrial.【F:core/views.py†L1306-L1324】【F:backend/middleware/error_handler.py†L12-L41】 Logging centralizado define `StreamHandler`/`RotatingFileHandler` según entorno, registrando configuraciones cargadas.【F:backend/settings.py†L262-L312】
- **Brechas**:
  - Falta separación completa de dominios: gran parte de procesos (calidad, mantenimiento, incidencias) sigue en `core`, dificultando escalado por módulo MES.
  - Validaciones avanzadas (p.ej. controles de acceso por rol operativo, límites de lote, reglas GMP) no se observan en serializers/permissions existentes.
  - Ausencia de endpoints industriales claves como programación de producción fina, integración con mantenimiento preventivo automatizado, y flujos de aprobación multi-firma más allá de registros en `ElectronicSignature`.

## Frontend: estado y brechas funcionales
- **Cobertura actual**: existen páginas para dashboard, lotes, mantenimiento, productos, inventario, calidad, desviaciones, configuraciones y login, todas protegidas por `ProtectedRoute` con hidratación de sesión en `auth-store` y formularios modales ricos.【F:frontend/src/app/page.tsx†L1-L8】【F:frontend/src/app/lotes/page.tsx†L1-L200】【F:frontend/src/app/mantenimiento/page.tsx†L1-L120】【F:frontend/src/app/productos/page.tsx†L1-L170】【F:frontend/src/stores/auth-store.tsx†L1-L117】
- **Interacción con backend**: componentes invocan métodos `api.getLotes`, `api.getOrdenesTrabajo`, `api.get('/productos/')`, `api.buscarGlobal`, etc., esperando endpoints DRF ya disponibles.【F:frontend/src/app/lotes/page.tsx†L38-L55】【F:frontend/src/app/mantenimiento/page.tsx†L33-L49】【F:frontend/src/app/productos/page.tsx†L59-L123】【F:frontend/src/components/global-search.tsx†L56-L84】
- **Brechas**:
  - El repositorio no incluye `src/lib/api`, pese a importarse desde múltiples módulos, lo que impide construir/deployar el frontend sin reintroducir ese cliente HTTP.【bd613d†L1-L2】
  - El dashboard recurre a datos simulados cuando falla la consulta, lo que oculta problemas de backend y limita monitoreo en planta; falta un mecanismo para alertar al usuario o registrar incidentes frontales.【F:frontend/src/components/dashboard.tsx†L84-L139】
  - Los manejos de error suelen ser `console.error` o toasts locales sin mapear `status/message/details` del middleware, desaprovechando la estandarización lograda en backend.【F:frontend/src/app/productos/page.tsx†L62-L69】【F:frontend/src/app/mantenimiento/page.tsx†L33-L49】
  - No se observan dashboards o formularios para módulos como auditoría, firmas electrónicas o KPIs avanzados, pese a existir endpoints dedicados.

## Base de datos: consistencia y sugerencias de mejora
- **Cobertura**: modelos abarcan producción (lotes, etapas, paradas, controles de calidad), inventario (insumos, lotes, movimientos, alertas), mantenimiento (planes, órdenes, historial, indicadores) e incidentes con CAPA, reflejando procesos MES fundamentales.【F:backend/produccion/models.py†L10-L200】【F:backend/inventario/models.py†L145-L311】【F:core/models.py†L322-L600】
- **Consistencia**: uso de `app_label='core'` preserva migraciones, pero mezcla dominios en un único esquema; campos JSON (`parametros_registrados`, `tareas`, `cambios`) ofrecen flexibilidad a costa de validación y reporting nativo.【F:backend/produccion/models.py†L96-L141】【F:core/models.py†L333-L627】
- **Brechas**:
  - `MovimientoInventario` guarda `item_id` y `lote_item_id` como enteros genéricos; sería preferible modelar relaciones explícitas o polimórficas para integridad y trazabilidad auditada.【F:backend/inventario/models.py†L238-L262】
  - Falta granularidad en registros de turno/máquina responsable en eventos de calidad, mantenimiento e incidentes (e.g. `ControlCalidad` no captura lote de instrumento, `AccionCorrectiva` no guarda duración/costos).
  - Ausencia de índices específicos en tablas de alto volumen (lotes, movimientos, alertas) más allá de los definidos en `LogAuditoria` y `Notificacion` puede impactar rendimiento industrial.

## Integración y despliegue: observaciones técnicas
- **Routing**: `backend/urls.py` agrupa API pública bajo `/api/` con subrutas para producción/inventario y JWT, alineado con separación de dominios y health-checks redundantes.【F:backend/urls.py†L9-L19】
- **Infraestructura**: `docker-compose.fullstack.yml` define stack de desarrollo con backend, frontend Next.js y PostgreSQL, montando volúmenes para logs, node_modules y caché, y exponiendo `NEXT_PUBLIC_API_URL` hacia el contenedor web.【F:docker-compose.fullstack.yml†L1-L88】
- **Brechas**:
  - Variables sensibles (`SECRET_KEY`, credenciales DB) están incrustadas en compose de desarrollo; falta plantilla productiva con secretos externos y hardening (reverse proxy, HTTPS, rotación de logs compartidos).
  - No se observan pipelines CI/CD ni scripts para levantar servicios en Kubernetes u orquestadores industriales.
  - El frontend depende de un cliente `@/lib/api` ausente, lo que rompería despliegues contenedorizados a menos que se regenere.

## Recomendaciones priorizadas
1. **Completar modularización y validaciones**: extraer dominios restantes de `core` (mantenimiento, calidad, incidentes) a apps dedicadas y reforzar serializers con reglas GMP (límite de estados, doble verificación, bloqueos según roles) aprovechando la estructura existente.【F:core/urls.py†L34-L82】【F:core/models.py†L322-L600】
2. **Normalizar inventario y trazabilidad**: reemplazar campos genéricos en `MovimientoInventario` y registros similares por FKs explícitas o modelos polimórficos, adicionando índices y timestamps adicionales (turno, máquina, lote externo) para auditoría y reporting MES.【F:backend/inventario/models.py†L213-L311】
3. **Restaurar cliente API frontend y manejar errores estándar**: versionar `src/lib/api` con axios/fetch que propague `status/message/details`, y ajustar vistas para mostrar alertas amigables o flujos de reintento en vez de `console.error`, alineando UX con middleware.【F:frontend/src/app/productos/page.tsx†L59-L69】【F:frontend/src/components/global-search.tsx†L56-L84】【bd613d†L1-L2】
4. **Observabilidad y monitoreo**: instrumentar logs con IDs de correlación, métricas de tiempos de proceso y contadores de errores; ampliar health-check para incluir verificación de colas/eventos sin exponer secretos.【F:backend/middleware/error_handler.py†L12-L41】【F:core/views.py†L1306-L1324】
5. **Endurecer despliegue**: preparar configuración productiva (compose o Helm) con secretos externos, TLS, supervisión de logs rotativos compartidos y políticas de backup DB; documentar procedimientos de arranque y restauración.【F:docker-compose.fullstack.yml†L1-L88】

## Sugerencias para la Fase 2
- Incorporar módulos funcionales pendientes (plan maestro de producción, mantenimiento predictivo, control estadístico de procesos) con campos específicos para lotes, máquinas, turnos y responsables, extendiendo modelos existentes.【F:backend/produccion/models.py†L10-L200】【F:core/models.py†L322-L600】
- Desarrollar reportes y dashboards industriales (OEE, MTBF, consumos, alertas) que consuman endpoints actuales y futuros, eliminando datos mock del frontend.【F:frontend/src/components/dashboard.tsx†L84-L139】
- Completar flujo de firmas electrónicas con aprobación multi-etapa y soporte de anexos/documentación asociada a lotes, órdenes y CAPA, integrando `ElectronicSignature` en los endpoints relevantes.【F:core/models.py†L680-L746】【F:backend/produccion/views.py†L112-L179】
- Implementar monitoreo de inventario en tiempo real (websockets/notificaciones) y automatizar generación de alertas de stock/fecha de vencimiento dentro de `AlertaInventario`, con panel front-end dedicado.【F:backend/inventario/models.py†L213-L311】
- Formalizar autenticación y autorización avanzada en frontend/backend (roles operativos, MFA, expiración de sesión), apoyándose en `UsuarioRol` y permisos centralizados para robustez en planta.【F:backend/usuarios/models.py†L5-L63】【F:backend/usuarios/views.py†L33-L118】
