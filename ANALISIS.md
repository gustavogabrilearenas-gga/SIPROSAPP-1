# Análisis exhaustivo del backend SIPROSAPP-1

## Árbol del repositorio
```text
./
    .dockerignore
    .env.dev
    .gitattributes
    .gitignore
    ANALISIS.md
    agents.md
    docker-compose.yml
    manage.py
    requirements.txt
    backend/
        Dockerfile
        __init__.py
        agents.md
        asgi.py
        entrypoint.sh
        load_test_data.py
        pagination.py
        settings.py
        urls.py
        wsgi.py
        observaciones/
            __init__.py
            admin.py
            apps.py
            models.py
            serializers.py
            urls.py
            views.py
            migrations/
                0001_initial.py
                __init__.py
            tests/
                __init__.py
                test_api.py
        incidentes/
            __init__.py
            admin.py
            apps.py
            models.py
            serializers.py
            urls.py
            views.py
            migrations/
                0001_initial.py
                __init__.py
            tests/
                __init__.py
                test_api.py
        core/
            __init__.py
            admin.py
            apps.py
            auth_views.py
            choices.py
            mixins.py
            models.py
            permissions.py
            signals.py
            throttles.py
            urls.py
            user_serializers.py
            views.py
            services/
                __init__.py
                search.py
            management/
                __init__.py
                commands/
                    __init__.py
                    create_superuser_if_none.py
            migrations/
                __init__.py
            tests/
                __init__.py
                test_permissions.py
        mantenimiento/
            __init__.py
            admin.py
            apps.py
            models.py
            serializers.py
            urls.py
            views.py
            migrations/
                0001_initial.py
                __init__.py
        catalogos/
            __init__.py
            admin.py
            apps.py
            models.py
            serializers.py
            urls.py
            views.py
            widgets.py
            static/
                admin/
                    css/
                        etapas-widget.css
                        json-editor.css
                    js/
                        etapas-widget.js
                        json-editor.js
            templates/
                admin/
                    widgets/
                        etapas_editor.html
                        ingredientes_editor.html
                        json_editor.html
            migrations/
                0001_initial.py
                0002_remove_formulaetapa_duracion_min.py
                0003_remove_ingredientes_field.py
                __init__.py
            tests/
                __init__.py
                test_formula_serializer.py
                test_maquinas_api.py
        produccion/
            __init__.py
            admin.py
            apps.py
            models.py
            serializers.py
            urls.py
            views.py
            migrations/
                0001_initial.py
                __init__.py
        usuarios/
            __init__.py
            admin.py
            apps.py
            forms.py
            models.py
            serializers.py
            urls.py
            views.py
            migrations/
                0001_initial.py
                __init__.py
    .vs/
        ProjectSettings.json
        VSWorkspaceState.json
        slnx.sqlite
        SIPROSAPP-1/
            v17/
                .wsuo
                DocumentLayout.json
            FileContentIndex/
                e83b8f94-f11b-4633-838b-5406665994f0.vsidx
```

## Resumen ejecutivo
- Arquitectura modular en Django/DRF con apps bien separadas por dominio y configuración mínima para despliegue local o en contenedores.
- Seguridad basada en JWT, throttles y roles reutilizables; la autenticación y paginación están listas, pero la vista `/api/auth/me/` accede a campos inexistentes del perfil y puede romper la experiencia.
- Los catálogos concentran la mayor parte de las inconsistencias: serializers y filtros hacen referencia a campos removidos, lo que bloqueará flujos CRUD reales y afecta cualquier UI que consuma esos endpoints.
- Las apps de observaciones e incidentes están casi listas para producción; mantenimiento y producción necesitan alinear modelos con serializers antes de exponerlos al frontend.
- La suite de pruebas automatizadas pasa, lo que da confianza en permisos básicos y endpoints principales, pero las pruebas actuales no detectan los desajustes entre modelos y serializers.

## Configuración base y plataforma
### Ajustes generales
- `backend/settings.py` carga variables desde `.env`, ofrece fallback a SQLite y habilita CORS en modo `DEBUG`, lo que simplifica la etapa inicial de integración.【F:backend/settings.py†L3-L167】
- La paginación por defecto expone `page_size` configurable hasta 200 ítems, suficiente para una UI minimalista.【F:backend/pagination.py†L1-L11】

### Ruteo y servicios transversales
- `backend/urls.py` organiza los routers por app y expone un health check reutilizable, permitiendo que cualquier cliente verifique disponibilidad.【F:backend/urls.py†L1-L37】
- El endpoint de búsqueda global existe pero el servicio asociado devuelve respuestas vacías; cualquier frontend debería tratarlo como placeholder.【F:backend/core/views.py†L13-L44】【F:backend/core/services/search.py†L1-L25】

### Seguridad y autenticación
- JWT provisto por SimpleJWT con refresco rotativo y throttles diferenciados para login y registro; los comandos de autenticación están centralizados en `core/auth_views.py`.
- `me_view` intenta serializar `profile.area` y `profile.get_area_display()`, atributos que ya no están en `UserProfile`. Esto provocará un `AttributeError` para usuarios con perfil y debe corregirse antes de exponer el endpoint al frontend.【F:backend/core/auth_views.py†L101-L124】【F:backend/usuarios/models.py†L12-L79】
- El comando `create_superuser_if_none` permite bootstrap automatizado del admin a partir de variables de entorno, útil para despliegues en Docker.【F:backend/core/management/commands/create_superuser_if_none.py†L1-L63】

## Cobertura de pruebas y estado
- Se ejecutaron 24 tests con éxito (`python manage.py test`); los warnings `Bad Request` y `Method Not Allowed` provienen de casos negativos previstos en los tests y no representan fallas reales.【757a7e†L1-L7】
- La cobertura actual se enfoca en permisos del núcleo, serializers de fórmulas y API de máquinas/incidentes/observaciones. No hay pruebas que validen los serializers desalineados de producción o catálogos, por lo que estos bugs permanecen ocultos.

## Análisis por aplicación
### Core
**Fortalezas**
- Endpoints de login/logout/refresh/registro listos para usarse con JWT y throttles específicos.【F:backend/core/auth_views.py†L23-L200】
- Permisos reutilizables (`IsAdmin`, `IsAdminOrSupervisor`, etc.) encapsulan la lógica de roles y consideran `is_staff`, alineando API con lo que espera el panel de administración.【F:backend/core/permissions.py†L7-L90】

**Riesgos y pendientes**
- `me_view` falla al acceder a `profile.area`; se requiere ajustar el serializer o reintroducir el campo en el modelo antes de integrarlo con la UI.【F:backend/core/auth_views.py†L101-L114】【F:backend/usuarios/models.py†L12-L79】
- `core.mixins.QueryParamFilterMixin` y `TimeWindowMixin` no se usan en el código; conviene eliminarlos o adoptarlos para evitar mantenimiento innecesario.【F:backend/core/mixins.py†L1-L59】

### Usuarios
**Fortalezas**
- `UsuarioViewSet` expone acciones de autogestión (`me`, `update_me`, `cambiar_mi_password`) además de gestión administrativa con permisos dinámicos, listos para consumir desde frontend.【F:backend/usuarios/views.py†L20-L127】
- Serializers sincronizan usuario y perfil, limpian campos opcionales y validan contraseñas nuevas con confirmación.【F:backend/usuarios/serializers.py†L17-L240】

**Riesgos y pendientes**
- `search_fields` usa prefijo `profile__` que no existe (debería ser `user_profile__`); las búsquedas fallarán silenciosamente.【F:backend/usuarios/views.py†L28-L37】【F:backend/usuarios/models.py†L12-L79】
- Falta protección contra autodesactivación en la API (ya existe en el formulario admin). Evaluar replicar esa validación en el serializer si el frontend permitirá edición de permisos.

### Catálogos
**Fortalezas**
- Modelos contemplan índices y validaciones para ubicaciones, máquinas, productos, fórmulas y turnos, proporcionando una base sólida del dominio.【F:backend/catalogos/models.py†L16-L315】
- Tests de API para máquinas verifican filtros (`activa`, `tipo`) y performance con `assertNumQueries`, útil para evitar regresiones.【F:backend/catalogos/tests/test_maquinas_api.py†L14-L90】

**Inconsistencias críticas**
- `ProductoSerializer` publica un campo `documentos` que no existe en `Producto`; cualquier respuesta o validación provocará error de atributo.【F:backend/catalogos/serializers.py†L107-L129】【F:backend/catalogos/models.py†L142-L181】
- `ProductoViewSet` filtra por `principio_activo` y `forma_farmaceutica`, atributos ausentes en el modelo (`tipo` y `presentacion` son los reales). Los filtros devolverán resultados vacíos y confusos para la UI.【F:backend/catalogos/views.py†L111-L131】【F:backend/catalogos/models.py†L142-L181】
- `FormulaSerializer` espera listas `ingredientes` y `etapas`, pero el modelo solo mantiene la relación `etapas` y la migración 0003 eliminó la columna `ingredientes`; falta implementar lógica de creación/actualización con modelos intermedios, de lo contrario el serializer no podrá persistir datos reales.【F:backend/catalogos/serializers.py†L132-L194】【F:backend/catalogos/migrations/0003_remove_ingredientes_field.py†L1-L17】
- `FormulaViewSet` declara `ordering_fields = ['fecha_vigencia_desde']` que no existe en el modelo `Formula`, ocasionando errores si el frontend intenta ordenar por ese campo.【F:backend/catalogos/views.py†L141-L168】【F:backend/catalogos/models.py†L240-L265】
- `load_test_data.py` importa `catalogos` sin el prefijo `backend`, por lo que falla cuando se ejecuta desde la raíz del proyecto; además intenta establecer `duracion_min` en `FormulaEtapa`, campo eliminado por migraciones recientes.【F:backend/load_test_data.py†L1-L121】【F:backend/catalogos/migrations/0002_remove_formulaetapa_duracion_min.py†L1-L17】

### Observaciones
**Fortalezas**
- Modelo y serializer minimalistas, con `perform_create` que asigna automáticamente el autor y bloquea updates/deletes, perfecto para un log inmutable.【F:backend/observaciones/models.py†L1-L20】【F:backend/observaciones/views.py†L9-L22】【F:backend/observaciones/serializers.py†L1-L10】
- Tests cubren creación, validación de campos de solo lectura y paginación.【F:backend/observaciones/tests/test_api.py†L12-L74】

**Riesgos**
- Los tests provocan `Method Not Allowed` en logs (esperado), pero conviene ajustar la configuración del logger si se desea un output más limpio en CI.

### Incidentes
**Fortalezas**
- Serializer valida coherencia de fechas y exige acciones correctivas cuando corresponde; la vista aplica autenticación básica y ordenación por fechas.【F:backend/incidentes/serializers.py†L5-L38】【F:backend/incidentes/views.py†L1-L14】
- Tests de API verifican creación exitosa y mensajes de error esperados para escenarios inválidos.【F:backend/incidentes/tests/test_api.py†L31-L65】

**Riesgos y pendientes**
- Se definen `filterset_fields` y `search_fields` pero no se agregan `filter_backends`; los filtros nunca se aplicarán. Añadir `DjangoFilterBackend` (y dependencia) o eliminar esos atributos para evitar confusión.【F:backend/incidentes/views.py†L7-L14】

### Producción
**Fortalezas**
- `RegistroProduccionEtapa` modela correctamente etapas con validaciones de tiempo y maquinaria, listo para integrarse con el frontend una vez que el registro maestro funcione.【F:backend/produccion/models.py†L1-L64】

**Riesgos críticos**
- `RegistroProduccion` duplica los campos `producto` y `formula` y carece de atributos como `hora_inicio`, `hora_fin`, `maquina`, `turno`, `unidad_medida` o `cantidad_producida` que el serializer y la vista esperan, por lo que cualquier request fallará con errores de atributo o columnas inexistentes.【F:backend/produccion/models.py†L68-L124】【F:backend/produccion/serializers.py†L1-L34】【F:backend/produccion/views.py†L8-L23】
- La migración inicial solo crea campos `estado`, `producto`, `formula`, `observaciones`, `registrado_por` y `fecha_registro`; se necesitan migraciones para añadir los campos que la API expone antes de conectar un frontend.【F:backend/produccion/migrations/0001_initial.py†L18-L73】

### Mantenimiento
**Fortalezas**
- Modelo con validaciones estrictas (horas no futuras, descripción de anomalías obligatoria) y serializer que completa automáticamente el usuario registrador, listo para integrarse tras ajustes menores.【F:backend/mantenimiento/models.py†L1-L78】【F:backend/mantenimiento/serializers.py†L1-L34】

**Riesgos y pendientes**
- Al igual que en incidentes, la vista declara `filterset_fields`, `search_fields` y `ordering_fields` sin configurar `filter_backends`; los filtros no se activarán hasta agregar `DjangoFilterBackend` en `DEFAULT_FILTER_BACKENDS` o localmente.【F:backend/mantenimiento/views.py†L8-L37】

## Scripts, utilidades y datos
- `load_test_data.py` necesita ajustes de import y campos eliminados como se detalla arriba.
- Existe un directorio `.vs/` con artefactos de Visual Studio en el repo; conviene eliminarlo o agregarlo a `.gitignore` para mantener el repositorio limpio.

## Preparación para el frontend MVP
**Listo**
- Autenticación, permisos, observaciones e incidentes tienen endpoints consistentes y probados.
- Catálogos de ubicaciones/máquinas/turnos/fun-ciones funcionan correctamente en lectura y filtros básicos, útiles para poblar selectores iniciales.

**No listo**
- Endpoint `/api/auth/me/` falla con perfiles existentes.
- CRUD de productos y fórmulas presenta errores serios (campos inexistentes, filtros inválidos), bloqueando cualquier UI que necesite gestionar maestros clave.
- API de producción está incompleta: el modelo no soporta los campos que la UI necesitará registrar.
- Mantenimiento/incidentes requieren habilitar filtros declarados para ofrecer una experiencia consistente en la UI.
- `load_test_data.py` no puede ejecutar sin errores, por lo que no hay datos de ejemplo listos para que un frontend los consuma.

**Recomendación**: Antes de iniciar un desarrollo frontend—even minimalista—deberían resolverse los puntos rojos anteriores. De lo contrario, la UI chocará con errores 500/400 al consumir productos, fórmulas y producción, y la vista `/api/auth/me/` fallará al cargar el perfil del usuario. El backend aún necesita una ronda de estabilización para alcanzar un MVP robusto.

## Lista priorizada de ajustes recomendados
1. Corregir `me_view` y los `search_fields` de usuarios para eliminar referencias a campos inexistentes.
2. Alinear serializers/vistas de catálogos con los modelos (`documentos`, filtros de productos, carga de fórmulas) y completar la lógica de persistencia para ingredientes/etapas.
3. Normalizar `RegistroProduccion` y su serializer/vista, creando las migraciones faltantes.
4. Activar `DjangoFilterBackend` (o retirar configuraciones) en incidentes y mantenimiento para que los filtros expuestos al frontend funcionen.
5. Reparar `load_test_data.py` o proveer fixtures equivalentes y limpiar el directorio `.vs/` del repositorio.
