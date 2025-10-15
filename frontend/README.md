# SIPROSA MES - Frontend

Frontend desarrollado con Next.js 14 para el Sistema de Gestión de Manufactura de SIPROSA.

## 🚀 Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos y diseño
- **Zustand** - Gestión de estado global
- **TanStack Query** - Manejo de datos de API
- **React Hook Form** - Formularios y validación
- **Lucide React** - Iconos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 🌐 Desarrollo

El frontend se ejecuta en `http://localhost:3000` y se conecta con el backend vía la variable de entorno `NEXT_PUBLIC_API_URL`.

Configuración rápida:

```powershell
cd frontend
copy .env.example .env.local
# Editar .env.local si es necesario (por ejemplo, NEXT_PUBLIC_API_URL)
notepad .env.local
npm install
npm run dev
```

Notas:
- Si Next corre dentro de Docker Compose y el backend es el servicio `api`, puedes usar `NEXT_PUBLIC_API_URL_SERVER=http://api:8000`.
- Si las peticiones desde el navegador reciben errores CORS, revisa `backend/settings.py` y asegúrate que `CORS_ALLOWED_ORIGINS` incluya el origen del frontend (por ejemplo `http://localhost:3000`).

## 📁 Estructura

```
src/
├── app/                 # App Router de Next.js
├── components/          # Componentes reutilizables
│   └── ui/             # Componentes base de UI
├── lib/                # Utilidades y configuración
├── stores/             # Stores de Zustand
├── types/              # Definiciones de tipos TypeScript
└── utils/              # Funciones auxiliares
```

## 🎯 Características

- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión de producción (lotes, etapas, controles)
- ✅ Sistema de mantenimiento
- ✅ Gestión de inventario FEFO
- ✅ Sistema de incidentes y acciones correctivas
- ✅ Auditoría completa de operaciones
- ✅ Autenticación JWT integrada
