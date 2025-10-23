# ============================================
# Dockerfile para SIPROSA MES - Frontend
# ============================================

FROM node:18-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar y construir la aplicación
COPY . .
RUN npm install
RUN npm run build

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Cambiar permisos del directorio
RUN chown -R nextjs:nodejs /app
USER nextjs

# Limpiar caché y dependencias de desarrollo
RUN npm prune --omit=dev && npm cache clean --force

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV PORT 3000
ENV NODE_ENV production

# Comando para iniciar la aplicación
CMD ["npm", "start"]
