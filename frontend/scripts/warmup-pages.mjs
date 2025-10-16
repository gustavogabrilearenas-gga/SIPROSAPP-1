import { promises as fs } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const APP_DIR = path.join(process.cwd(), 'src', 'app')
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const buildRouteFromParts = (parts) => {
  if (parts.length === 0) {
    return '/'
  }

  const cleaned = parts
    .filter(Boolean)
    .map((part) => part.replace(/\(.+\)/g, '').replace(/^\[|\]$/g, ''))
    .filter(Boolean)

  const route = `/${cleaned.join('/')}`
  return route === '' ? '/' : route
}

const discoverRoutes = async (dir, parentSegments = []) => {
  const routes = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isFile() && entry.name === 'page.tsx') {
      routes.push(buildRouteFromParts(parentSegments))
      continue
    }

    if (entry.isDirectory()) {
      const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')')
      const isDynamic = /\[.*\]/.test(entry.name)

      if (isDynamic) {
        // Las rutas dinámicas requieren parámetros concretos, así que las omitimos en el warmup
        continue
      }

      const segment = isGroup ? null : entry.name

      const childSegments = segment ? [...parentSegments, segment] : parentSegments
      const childRoutes = await discoverRoutes(entryPath, childSegments)
      routes.push(...childRoutes)
    }
  }

  return Array.from(new Set(routes)).sort((a, b) => a.localeCompare(b))
}

const fetchRoute = async (route, baseUrl) => {
  const url = new URL(route, baseUrl)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'manual' })
      if (response.status >= 200 && response.status < 400) {
        console.log(`[warmup] ✅ ${url.href} (status ${response.status})`)
        return
      }

      console.warn(`[warmup] ⚠️ ${url.href} returned status ${response.status}`)
      return
    } catch (error) {
      console.warn(`[warmup] intento ${attempt} fallido para ${url.href}:`, error.message)
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS)
      }
    }
  }
}

export const warmupRoutes = async ({
  baseUrl,
  port,
} = {}) => {
  const resolvedPort = typeof port === 'number' ? port : process.env.PORT ? Number(process.env.PORT) : 3000
  const resolvedBaseUrl = baseUrl || process.env.WARMUP_BASE_URL || `http://127.0.0.1:${resolvedPort}`

  try {
    await fs.access(APP_DIR)
  } catch (error) {
    throw new Error('No se encontró el directorio src/app')
  }

  const routes = await discoverRoutes(APP_DIR)

  if (routes.length === 0) {
    console.warn('[warmup] No se encontraron rutas para precalentar.')
    return
  }

  console.log(`[warmup] Precargando ${routes.length} rutas desde ${resolvedBaseUrl}...`)
  for (const route of routes) {
    await fetchRoute(route, resolvedBaseUrl)
  }
}

const executedDirectly = typeof process.argv[1] === 'string'
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (executedDirectly) {
  warmupRoutes().catch((error) => {
    console.error('[warmup] Error inesperado:', error)
    process.exit(1)
  })
}
