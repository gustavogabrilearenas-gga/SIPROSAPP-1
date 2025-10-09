# Auditoría Frontend SIPROSA MES

## Resumen ejecutivo
- Se levantó el inventario completo de rutas de la app Next.js (App Router) y su relación con guardias de autenticación y fuentes de datos del backend documentadas en `lib/api.ts`.
- Se identificaron y encapsularon tras _feature flags_ cuatro controles que aún no tienen soporte real de backend (Configuración general, exportación de auditoría, altas de inventario, vistas de detalle en fórmulas/productos/desviaciones), eliminando mensajes "próximamente" y alertas sin acción útil.
- Se detectaron brechas en estados de carga/error, accesibilidad (modal sin foco, botones sin etiquetas, dependencia exclusiva de color) y seguridad UI (acciones sensibles visibles sin chequeo de rol), generando un backlog priorizado.

## 1. Árbol de rutas y navegación
| Ruta | Archivo | Guard/Layout | Roles visibles | Datos backend | Notas |
| --- | --- | --- | --- | --- | --- |
| `/login` | `app/login/page.tsx` | Pública (sin `ProtectedRoute`) | Todos | `useAuth.login` (tokens) | Redirige a `/` si ya existe sesión; usa toasts y loader de envío.【F:frontend/src/app/login/page.tsx†L12-L189】 |
| `/` (Dashboard) | `app/page.tsx` → `Dashboard` | `ProtectedRoute` | Autenticados; botón Usuarios solo staff/superuser | KPIs (`getDashboardResumen`, `getOEE`, `getHistorialProduccion`) | Botón "Configuración" oculto por flag `featureFlags.configuracion`.【F:frontend/src/app/page.tsx†L3-L11】【F:frontend/src/components/dashboard.tsx†L65-L158】【F:frontend/src/components/dashboard.tsx†L324-L343】 |
| `/perfil` | `app/perfil/page.tsx` | Ninguna (debería envolver en `ProtectedRoute`) | Usuario autenticado (usa store) | `/auth/me`, `updateMiPerfil`, `cambiarMiPassword` | Maneja loading/error propios pero expone pantalla sin guard server-side.【F:frontend/src/app/perfil/page.tsx†L3-L194】 |
| `/inventario` | `app/inventario/page.tsx` | `ProtectedRoute` | Staff/Superuser ven botón de alta si flag `inventarioEdicion` | `getInsumos`, `getLotesInsumo` | Usa `DataState` para loading/error/empty y fallbacks locales en 500.【F:frontend/src/app/inventario/page.tsx†L7-L170】【F:frontend/src/app/inventario/page.tsx†L236-L263】【F:frontend/src/lib/api.ts†L1058-L1106】 |
| `/lotes` | `app/lotes/page.tsx` | `ProtectedRoute` | Todos los autenticados; acciones dependen de prompts | `getLotes`, `iniciarLote`, `pausarLote`, `completarLote`, `cancelarLote` | Falta confirmación accesible para prompts; usa `DataState` para vacíos.【F:frontend/src/app/lotes/page.tsx†L33-L200】【F:frontend/src/lib/api.ts†L1088-L1135】 |
| `/ordenes`, `/mantenimiento`, `/maquinas`, `/paradas`, `/turnos`, `/incidentes`, `/control-calidad`, `/etapas-produccion`, `/kpis`, `/productos`, `/formulas`, `/ubicaciones`, `/desviaciones` | `app/*/page.tsx` | Mayoría envuelve con `ProtectedRoute` y `DataState` | Mayormente todos los autenticados con UI condicional para staff | Ver endpoints correspondientes en `api.ts` (secciones mantenimiento, producción, calidad) | Rutas presentan patrones similares de tarjetas + modales; varias tienen acciones pendientes ahora bajo feature flag (ver tabla 2).【F:frontend/src/lib/api.ts†L780-L1234】 |
| `/configuracion` | `app/configuracion/page.tsx` | `ProtectedRoute` + flag `configuracion` | Oculta si flag off | (Sin endpoints aún) | Renderiza tarjeta "no disponible" cuando flag es `false`; cards sin CTA activa.【F:frontend/src/app/configuracion/page.tsx†L12-L165】 |
| `/configuracion/usuarios` | `app/configuracion/usuarios/page.tsx` | `ProtectedRoute` | Solo acceso desde Dashboard staff/superuser | CRUD usuarios (`getUsuarios`, `createUsuario`, `desactivarUsuario`, `cambiarPasswordUsuario`) | Maneja loaders, vacíos y errores con toasts; hay `alert` en validación de password por mejorar.【F:frontend/src/app/configuracion/usuarios/page.tsx†L1-L210】【F:frontend/src/lib/api.ts†L780-L820】 |

## 2. Matriz Control → Acción/Permiso/Decisión
| Pantalla | Control | Acción / Endpoint | Permiso UI | Estado actual | Decisión |
| --- | --- | --- | --- | --- | --- |
| Dashboard | "Actualizar métricas" | `api.getDashboardResumen`, `api.getOEE`, `api.getHistorialProduccion` | Autenticados | Ejecuta fetch paralelo con loaders y toasts de error | D |
| Dashboard | "Usuarios" | `router.push('/configuracion/usuarios')` | Solo `user.is_staff` o `is_superuser` | Operativa | D |
| Dashboard | "Configuración" | Sin backend (solo navegación) | Todos | Ahora oculto tras `featureFlags.configuracion` | B |
| Panel auditoría | "Exportar" | Sin implementación backend | Todos | Botón oculto a menos que flag `auditoriaExport` true; logging al usarlo | B【F:frontend/src/components/AuditDrawer.tsx†L75-L183】 |
| Inventario | "Nuevo Insumo/Lote" | Flujo no implementado | Solo staff | Botón protegido por `featureFlags.inventarioEdicion`, registra warn | B【F:frontend/src/app/inventario/page.tsx†L252-L261】【F:frontend/src/lib/feature-flags.ts†L1-L12】 |
| Formulas | "Insumos" | Falta vista detalle | Todos | Oculto tras `featureFlags.formulasIngredientes` | B【F:frontend/src/app/formulas/page.tsx†L238-L252】 |
| Productos | "Fórmulas" | Falta vista asociada | Todos | Oculto tras `featureFlags.productosAsociaciones` | B【F:frontend/src/app/productos/page.tsx†L232-L246】 |
| Desviaciones | "Nueva Desviación" / click card | Backend pendiente | Staff para crear; todos ven lista | Acciones visibles solo si `featureFlags.desviacionesGestion` | B【F:frontend/src/app/desviaciones/page.tsx†L220-L304】 |
| Usuarios | "Nuevo Usuario" | `UsuarioFormModal` → `api.createUsuario` | Staff | Funcional, recarga lista | D【F:frontend/src/app/configuracion/usuarios/page.tsx†L77-L199】【F:frontend/src/lib/api.ts†L804-L817】 |
| Usuarios | "Desactivar/Activar" | `api.desactivarUsuario` / `reactivarUsuario` | Staff | Confirmación `confirm()` sin accesibilidad | C (necesita modal accesible) |
| Usuarios | "Cambiar contraseña" | `api.cambiarPasswordUsuario` | Staff | Usa `alert` en validaciones | C (migrar a toast/form validation) |
| Global search | Modal cierre (botón X) | Cierra overlay | Todos | Sin `aria-label`; pierde foco al cerrar | C (añadir atributos y focus trap)【F:frontend/src/components/global-search.tsx†L136-L184】 |

Decisión legend: **A** eliminar, **B** ocultar tras flag, **C** requiere refactor, **D** ok.

## 3. Estados obligatorios por pantalla
| Pantalla | Loading | Empty | Error | Sin permiso | Observaciones |
| --- | --- | --- | --- | --- | --- |
| Dashboard | ✓ Loader inicial en `ProtectedRoute` + `DataState` | ✓ `emptyState` cuando no hay datos | ✓ Toast + banner | ✗ (redirige a login pero no hay vista 403 diferenciada) | Implementar mensaje "sin permiso" cuando backend devuelva 403.【F:frontend/src/components/protected-route.tsx†L12-L55】【F:frontend/src/components/dashboard.tsx†L65-L146】 |
| Inventario | ✓ con spinner | ✓ mensaje "Sin registros" | ✓ via `DataState` y toast | ✗ (solo oculta acciones) | Requiere manejar 401/403 en `handleApiError` (actualmente se cae al fallback 500).【F:frontend/src/app/inventario/page.tsx†L133-L169】 |
| Lotes | ✓ `isLoading` + skeleton | ✓ `DataState` sin elementos | ✓ toast + banner | ✗ | Añadir branch 403 → mensaje "No autorizado" en `handleApiError`.【F:frontend/src/app/lotes/page.tsx†L33-L199】 |
| Usuarios | ✓ spinner | ✓ card "No se encontraron" | ✓ toast + banner rojo | ✗ | Añadir manejo explícito de `error.status === 403` para usuarios sin privilegios.【F:frontend/src/app/configuracion/usuarios/page.tsx†L44-L210】 |
| Configuración | ✓ (a través de `ProtectedRoute`) | ✓ `DataState` vacío | ✓ mensaje descriptivo | ✓ (flag actúa como gate) | Sin problemas tras refactor.【F:frontend/src/app/configuracion/page.tsx†L15-L165】 |
| Desviaciones | ✓ `DataState` | ✓ "No se encontraron" | ✓ banner | ✗ | Falta UI para 403 y para sesión expirada. 【F:frontend/src/app/desviaciones/page.tsx†L283-L304】 |

## 4. Reporte de accesibilidad (a11y)
1. **Modal de búsqueda global sin atributos ARIA**: el botón de cierre carece de `aria-label` y no se anuncia el rol modal; además se pierde el foco al cerrar.【F:frontend/src/components/global-search.tsx†L136-L184】 _Fix_: añadir `aria-label`, `role="dialog"`, `aria-modal="true"`, y devolver foco al botón que abre.
2. **Controles sólo color**: badges de severidad/estado en desviaciones y lotes dependen únicamente del color (sin texto adicional). Añadir íconos o texto accesible (`aria-label`).【F:frontend/src/app/lotes/page.tsx†L153-L183】【F:frontend/src/app/desviaciones/page.tsx†L298-L319】
3. **Uso de `window.prompt`/`alert` en acciones críticas**: genera bloqueos no accesibles y sin foco controlado en Lotes y Usuarios.【F:frontend/src/app/lotes/page.tsx†L106-L149】【F:frontend/src/app/configuracion/usuarios/page.tsx†L116-L149】 _Fix_: reemplazar por modales propios con focus trap.
4. **Links simulados con tarjetas clicables**: varias cards (`desviaciones`, `inventario`) usan `div`/`Card` con `onClick` sin `role="button"`; se mitigó en desviaciones al deshabilitar onClick pero se recomienda reemplazar por `<button>`/`<Link>` con foco visible.【F:frontend/src/app/desviaciones/page.tsx†L298-L304】
5. **Falta de teclado en búsqueda**: atajo `Ctrl+K` abre modal pero no se documenta navegación con teclado ni hay trampa de foco; incorporar ciclo de foco y cierre con `Escape` ya existe pero sin anunciarse.【F:frontend/src/components/global-search.tsx†L19-L33】
6. **Contrastes borderline**: botones `variant="outline"` sobre fondos pastel (ej. Dashboard) quedan con contraste <AA; revisar tokens Tailwind para garantizar ratio >4.5.

## 5. Métricas de performance y plan
- **Build**: intento de `npm run build` falla al descargar la fuente Google `Inter` por política offline del entorno.【a259c2†L1-L27】 Recomendación: self-hostear tipografía (usar `next/font/local`) para garantizar builds reproducibles y medir `First Load JS`.
- **Plan de mejora**:
  1. Self-host fuentes + reintentar `next build` para obtener baseline de tamaño de bundle.
  2. Activar `next build --analyze` y revisar gráficos de Recharts/Tremor para code-splitting en páginas secundarias.
  3. Cachear peticiones de dashboard con React Query (actualmente usa `useState` + polling manual cada 30s).【F:frontend/src/components/dashboard.tsx†L98-L158】
  4. Reemplazar fallback de inventario por SWR/React Query con `staleTime` para reducir fetches duplicados al cambiar tabs.【F:frontend/src/app/inventario/page.tsx†L123-L170】

## 6. Seguridad de UI
- **Guardias**: sólo `ProtectedRoute` client-side evita acceso anónimo; no hay middleware efectivo ni verificación de roles por ruta (p.ej. `/perfil` está expuesto).【F:frontend/src/components/protected-route.tsx†L12-L55】【F:frontend/src/app/perfil/page.tsx†L29-L194】
- **Manejo de 401/403**: `handleApiError` transforma respuestas pero las pantallas no distinguen visualmente un 403; se recomienda patrón centralizado con redirección a vista "Sin permisos".
- **Persistencia tokens**: `api.ts` refresca tokens y limpia storage en errores 401, pero UI no siempre notifica expiración; integrar toasts consistentes.
- **Exposición de acciones**: botones sensibles en inventario/desviaciones ahora condicionados por flags, pero se debe reforzar con chequeo de permisos desde backend (`useAuth.user.groups`).

## 7. Backlog priorizado (Quick wins incluidos)
| ID | Prioridad | Descripción | Owner sugerido | Esfuerzo (días) | Dependencias |
| --- | --- | --- | --- | --- | --- |
| P0-1 | P0 | Self-host tipografía `Inter` y ejecutar `next build` para obtener métricas base; configurar CI offline | Frontend | 0.5 | Acceso repo frontend |
| P0-2 | P0 | Reemplazar `alert/prompt` en Lotes y Usuarios por dialogos accesibles con toasts | Frontend | 1.5 | Diseño UX diálogo |
| P0-3 | P0 | Añadir manejo de estados 401/403 centralizado (`DataState` + vista sin permiso) | Frontend | 1 | Backend (códigos correctos) |
| P1-1 | P1 | Implementar focus trap + atributos ARIA en GlobalSearch y AuditDrawer | Frontend | 1 | Ninguna |
| P1-2 | P1 | Integrar React Query para dashboard e inventario evitando `setInterval` manual | Frontend | 1.5 | Backend estable |
| P1-3 | P1 | Ajustar contraste de botones outline (Tailwind tokens) | Frontend/UX | 0.5 | Diseño |
| P2-1 | P2 | Planificar feature flags reales (persistidas en config) + documentación para toggles (`feature-flags.ts`) | Frontend + DevOps | 1 | Gestión de configuraciones |
| P2-2 | P2 | Migrar páginas sin `ProtectedRoute` (`/perfil`, etc.) a guard server-side o middleware robusto | Frontend | 1 | Estrategia auth |
| P2-3 | P2 | Crear componentes reutilizables para badges con texto accesible | Frontend | 0.5 | Diseño |

## 8. Quick wins aplicados en esta PR
- **Feature flags centralizados** (`feature-flags.ts`) para módulos sin backend activo.【F:frontend/src/lib/feature-flags.ts†L1-L12】
- **Configuración**: pantalla ahora protegida y muestra mensaje "no disponible" en lugar de `alert('próximamente')`.【F:frontend/src/app/configuracion/page.tsx†L15-L125】
- **Inventario/Formulas/Productos/Desviaciones**: botones sin implementación real ocultos tras flags y logging; se evita mostrar acciones muertas al usuario.【F:frontend/src/app/inventario/page.tsx†L252-L261】【F:frontend/src/app/formulas/page.tsx†L238-L252】【F:frontend/src/app/productos/page.tsx†L232-L246】【F:frontend/src/app/desviaciones/page.tsx†L220-L304】
- **Auditoría**: exportación queda deshabilitada por defecto, sin `alert en desarrollo`, respetando especificación de no mostrar CTA vacías.【F:frontend/src/components/AuditDrawer.tsx†L75-L183】

