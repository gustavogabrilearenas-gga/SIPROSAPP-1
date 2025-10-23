# SIPROSA MES - Frontend

Frontend minimalista construido con Next.js 14 (App Router) para interactuar con la API de SIPROSA MES.

## 🚀 Tecnologías

- **Next.js 14** con App Router
- **TypeScript** para tipado estático
- **Tailwind CSS** para estilos utilitarios
- **Zustand** para el estado de autenticación
- **TanStack Query** para operaciones CRUD genéricas
- **Axios** para las peticiones HTTP

## ⚙️ Configuración de entorno

1. Copiá el archivo `.env.example` a `.env.local` dentro de `frontend/`.
2. Ajustá `NEXT_PUBLIC_API_URL` con la URL base del backend **incluyendo** el prefijo `/api`.

```bash
cd frontend
cp .env.example .env.local
# Editá NEXT_PUBLIC_API_URL si es necesario (por defecto http://localhost:8000/api)
```

Las peticiones usan encabezados `Authorization: Bearer <token>`; no se manejan cookies ni `withCredentials`.

## 📦 Scripts principales

```bash
npm install        # Instala dependencias
npm run dev        # Inicia el servidor de desarrollo
npm run build      # Compila la aplicación
npm run lint       # Ejecuta ESLint
npx tsc --noEmit   # Verifica tipos de TypeScript
```

## ✅ Validación FE–BE (smoke test)

Se incluye un script que valida el login y un CRUD básico contra la API.

```bash
cd frontend
API_URL=http://localhost:8000/api \
SMOKE_USERNAME=admin \
SMOKE_PASSWORD=admin \
./scripts/smoke.sh
```

El script:

1. Solicita un token `POST /api/token/`.
2. Consulta `GET /api/usuarios/me/` y muestra los grupos del usuario.
3. Ejecuta un ciclo CRUD completo sobre `/api/catalogos/parametros/` (crear, actualizar y eliminar un parámetro temporal).

> Requisitos: `curl` y `jq` instalados, y credenciales con permisos de administración sobre los catálogos.

## 📁 Estructura relevante

```
frontend/
├── src/
│   ├── app/           # Páginas (App Router)
│   ├── components/    # Layout, CRUD genérico y ruta protegida
│   ├── lib/           # Configuración del cliente HTTP
│   ├── stores/        # Estado global (auth)
│   └── types/         # Tipos compartidos
└── scripts/
    └── smoke.sh       # Smoke test FE–BE
```
