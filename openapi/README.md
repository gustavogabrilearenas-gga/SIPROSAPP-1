# OpenAPI Artifacts

Este directorio contiene el contrato OpenAPI exportado desde Django y los tipos TypeScript generados.

## Exportar esquema
Ejecuta desde la raíz del repositorio:

```bash
make openapi-export
```

## Generar y validar tipos
Desde la raíz del repositorio se recomienda ejecutar el flujo completo:

```bash
make openapi
```

También puedes correr los scripts directamente dentro de esta carpeta:

```bash
npm run gen:types
npm run check:types
```
