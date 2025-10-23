# ============================================
# Dockerfile para SIPROSA MES - Frontend
# ============================================

FROM node:18-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Cambiar permisos del directorio
RUN chown nextjs:nodejs /app
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV PORT 3000
ENV NODE_ENV production

# Comando para iniciar la aplicación
CMD ["npm", "start"]
