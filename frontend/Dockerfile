# ============================================
# Dockerfile para SIPROSA MES - Frontend
# ============================================

FROM node:18-alpine AS builder

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de configuración y código fuente
COPY . .

# Instalar dependencias y construir la aplicación
RUN npm ci
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar solo las dependencias de producción
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copiar la aplicación construida
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV PORT 3000
ENV NODE_ENV production

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
