# Análisis exhaustivo del backend SIPROSAPP-1

## Árbol del repositorio
```text
.dockerignore
.env.dev
.gitattributes
.gitignore
agents.md
backend/
    Dockerfile
    __init__.py
    agents.md
    asgi.py
    catalogos/
        __init__.py
        admin.py
        apps.py
        migrations/
            0001_initial.py
            0002_remove_formulaetapa_duracion_min.py
            0003_remove_ingredientes_field.py
            __init__.py
        models.py
        serializers.py
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
        tests/
            __init__.py
            test_formula_serializer.py
            test_maquinas_api.py
        urls.py
        views.py
        widgets.py
    core/
        __init__.py
        admin.py
        apps.py
        auth_views.py
        choices.py
        management/
            __init__.py
            commands/
                __init__.py
                create_superuser_if_none.py
        migrations/
            __init__.py
        mixins.py
        models.py
        permissions.py
        services/
            __init__.py
            search.py
        signals.py
        tests/
            __init__.py
            test_permissions.py
        throttles.py
        urls.py
        user_serializers.py
        views.py
    entrypoint.sh
    incidentes/
        __init__.py
        admin.py
        apps.py
        migrations/
            0001_initial.py
            __init__.py
        models.py
        serializers.py
        tests/
            __init__.py
            test_api.py
        urls.py
        views.py
    load_test_data.py
    mantenimiento/
        __init__.py
        admin.py
        apps.py
        migrations/
            0001_initial.py
            __init__.py
        models.py
        serializers.py
        urls.py
        views.py
    observaciones/
        __init__.py
        admin.py
        apps.py
        migrations/
            0001_initial.py
            __init__.py
        models.py
        serializers.py
        tests/
            __init__.py
            test_api.py
        urls.py
        views.py
    pagination.py
    produccion/
        __init__.py
        admin.py
        apps.py
        migrations/
            0001_initial.py
            __init__.py
        models.py
        serializers.py
        urls.py
        views.py
    settings.py
    urls.py
    usuarios/
        __init__.py
        admin.py
        apps.py
        forms.py
        migrations/
            0001_initial.py
            __init__.py
        models.py
        serializers.py
        urls.py
        views.py
    wsgi.py
docker-compose.yml
manage.py
requirements.txt
```

## Visión general del backend
- El proyecto organiza un backend Django/DRF modular con apps de dominio claras (core, catálogos, usuarios, observaciones, producción, mantenimiento e incidentes) declaradas en la configuración junto con DRF y CORS.【F:backend/settings.py†L22-L142】
- Se mantiene el modelo de usuario nativo (`auth.User`) y se delegan los datos extendidos a `UserProfile`, lo que simplifica la migración pero obliga a revisar accesos que asumen atributos personalizados.【F:backend/settings.py†L111-L142】【F:backend/usuarios/models.py†L12-L79】
- La autenticación usa JWT (SimpleJWT) con throttling dedicado para login/registro, alineado con la política de seguridad declarada en `REST_FRAMEWORK` y `SIMPLE_JWT`.【F:backend/settings.py†L129-L153】【F:backend/core/throttles.py†L1-L16】
- Existe un `health_check` HTTP básico y un endpoint de búsqueda global que actualmente delega en un servicio placeholder que siempre devuelve listas vacías, por lo que la funcionalidad está incompleta aunque la interfaz ya está cableada.【F:backend/core/views.py†L13-L66】【F:backend/core/services/search.py†L1-L25】
- La suite de tests integrada actualmente falla: hay errores por campos inexistentes en catálogos y por permisos demasiado restrictivos en incidentes, lo que impide considerar la rama como estable sin intervención.【5be54b†L1-L85】

## Análisis por módulo

### Core
- `core.auth_views` cubre login, logout, refresh, registro y `/me`, respetando los throttles y devolviendo metadatos útiles; sin embargo, el serializer de `/me` intenta acceder a `profile.area`, atributo que ya no existe en `UserProfile`, lo que produciría un `AttributeError` cuando el perfil está presente.【F:backend/core/auth_views.py†L94-L124】【F:backend/usuarios/models.py†L12-L52】
- El paquete de permisos centraliza lógica de roles (admin, supervisor, operario, calidad) y refleja buenas prácticas al documentar las reglas y al incluir `is_staff` en `is_admin`. Las clases de permiso reutilizan esa lógica para componer combinaciones comunes.【F:backend/core/permissions.py†L1-L90】
- `core.mixins` ofrece utilidades genéricas (`TimeWindowMixin`, `SafeMethodPermissionMixin`, `QueryParamFilterMixin`) que fomentan reutilización, aunque ninguna app las usa actualmente; conviene evaluar su eliminación o adopción para reducir código muerto.【F:backend/core/mixins.py†L1-L44】

### Usuarios
- `UserProfile` agrega DNI validado, legajo opcional único, función, turno y metadatos, creando perfiles automáticamente mediante una señal al crear usuarios nativos; esto mantiene encapsulados los datos de RR.HH.【F:backend/usuarios/models.py†L12-L79】
- `UsuarioViewSet` ofrece endpoints de autogestión (`me`, `update_me`, `cambiar_mi_password`) y acciones administrativas con permisos dinámicos que permiten a cada usuario editar solo sus datos mientras reserva el resto a administradores.【F:backend/usuarios/views.py†L20-L127】
- Los serializers contemplan la sincronización entre usuario base y perfil, limpian campos opcionales y validan contraseñas nuevas, lo que demuestra atención a consistencia; no obstante, no hay tests específicos que cubran estos flujos complejos.

### Catálogos
- Los modelos definen catálogos clave (ubicaciones, máquinas, productos, fórmulas, etapas, parámetros y turnos) con índices, choices y validaciones, mostrando diseño cuidadoso del dominio.【F:backend/catalogos/models.py†L16-L315】
- **Inconsistencias críticas**:
  - `ProductoSerializer` expone un campo `documentos`, pero el modelo `Producto` no lo define (sólo existe en `Maquina`), provocando errores cuando el serializer se instancie.【F:backend/catalogos/serializers.py†L107-L129】【F:backend/catalogos/models.py†L142-L181】
  - `FormulaSerializer` espera campos `ingredientes` y `etapas` en la instancia del modelo; tras la migración 0003, el campo `ingredientes` fue eliminado y la relación `etapas` es ManyToMany, por lo que el serializer queda desalineado y rompe al inicializarse (como muestran los tests).【F:backend/catalogos/serializers.py†L132-L214】【F:backend/catalogos/models.py†L240-L265】【5be54b†L1-L85】
  - `ProductoViewSet` filtra por `principio_activo` y `forma_farmaceutica`, atributos que el modelo no posee (`concentracion` y `presentacion` son los campos disponibles), dejando filtros inoperantes y confusos para los consumidores.【F:backend/catalogos/views.py†L111-L131】【F:backend/catalogos/models.py†L142-L181】
  - `FormulaViewSet` intenta ordenar por `fecha_vigencia_desde`, inexistente en el modelo `Formula`, lo que causará errores al ejecutar consultas con ordenación explícita.【F:backend/catalogos/views.py†L141-L168】【F:backend/catalogos/models.py†L240-L265】
- El módulo de widgets/admin incluye archivos estáticos para editores personalizados, coherentes con la intención de proveer interfaces ricas desde el admin.

### Observaciones
- API sencilla y coherente: `ObservacionGeneralViewSet` obliga autenticación, asigna el autor automáticamente y bloquea update/delete, exponiendo sólo creación y lectura paginada, en línea con un historial inmutable.【F:backend/observaciones/views.py†L9-L24】
- Los tests de API cubren creación, respeto de campos de sólo lectura y paginación, asegurando que la implementación responda a los casos de uso declarados.【F:backend/observaciones/tests/test_api.py†L12-L74】

### Incidentes
- El modelo captura atributos básicos de un incidente y valida coherencia (fechas y acciones correctivas), reutilizando el serializer para exponer detalle de la máquina asociada.【F:backend/incidentes/models.py†L1-L34】【F:backend/incidentes/serializers.py†L5-L38】
- El `IncidenteViewSet` restringe el acceso a usuarios administradores combinando `IsAuthenticated` con `IsAdmin`, pero los tests esperan que cualquier usuario autenticado pueda reportar incidentes, lo que produce respuestas 403 y fallos en la suite; se debe alinear la política de permisos (probablemente permitir creación a operarios/supervisores).【F:backend/incidentes/views.py†L7-L14】【F:backend/incidentes/tests/test_api.py†L30-L65】【5be54b†L1-L85】
- También se definen `filterset_fields` sin registrar `DjangoFilterBackend`, por lo que los filtros declarativos nunca se activarán.

### Producción
- `RegistroProduccionEtapa` muestra un modelado detallado por etapa con validaciones robustas sobre tiempos, maquinaria y estado de completitud.【F:backend/produccion/models.py†L10-L97】
- El modelo `RegistroProduccion` presenta duplicación de campos `producto` y `formula`, y carece de atributos como `hora_inicio`, `maquina`, `unidad_medida`, `cantidad_producida` y `turno` que el serializer y la vista esperan, lo que hará fallar cualquier CRUD real.【F:backend/produccion/models.py†L99-L188】【F:backend/produccion/serializers.py†L12-L29】【F:backend/produccion/views.py†L11-L23】
- La vista usa `select_related` y filtros sobre relaciones inexistentes, reforzando la necesidad de normalizar el modelo/serializer antes de exponer el endpoint públicamente.

### Mantenimiento
- `RegistroMantenimiento` captura mantenimientos correctivos/autónomos/preventivos con validaciones de dominio (horas no futuras, descripción de anomalías obligatoria).【F:backend/mantenimiento/models.py†L8-L114】
- Serializer y vista aplican la misma regla de descripción para anomalías y autocompletan el usuario que registra; sin embargo, al igual que en incidentes/producción, se declaran `filterset_fields` sin configurar backend de filtros, por lo que conviene incorporar `django_filters` o retirar esos atributos.【F:backend/mantenimiento/serializers.py†L6-L42】【F:backend/mantenimiento/views.py†L8-L23】

### Usuarios
- Los serializers administran correctamente la sincronización usuario/perfil, normalizando campos opcionales y validando contraseñas (incluida confirmación). Las acciones diferenciadas (`CrearUsuarioSerializer`, `UsuarioPerfilSerializer`, `CambiarPasswordSerializer`) cubren los distintos flujos administrativos.【F:backend/usuarios/serializers.py†L1-L247】
- Las pruebas existentes sólo cubren permisos base (`core/tests/test_permissions.py`); sería deseable añadir casos específicos de estos serializers y viewsets para detectar regresiones como el acceso a atributos eliminados.【F:backend/core/tests/test_permissions.py†L1-L79】

## Scripts y utilidades
- `load_test_data.py` inicializa datos de ejemplo pero importa `catalogos` sin el prefijo de paquete (`backend.catalogos`), por lo que fallará al ejecutarse desde la raíz del proyecto; debe ajustarse el import antes de usarse en entornos reales.【F:backend/load_test_data.py†L9-L118】

## Pruebas automatizadas
- La ejecución de `python manage.py test` actualmente termina con 9 errores y 3 fallos derivados de las inconsistencias señaladas (campos inexistentes en catálogos y permisos 403 en incidentes), lo que confirma la urgencia de corregir esas áreas antes de integrar nuevos cambios.【5be54b†L1-L85】
