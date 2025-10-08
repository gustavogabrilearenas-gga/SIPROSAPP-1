import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'

export interface ApiError extends Error {
  status: number
  details?: unknown
  response?: AxiosResponse
}

const DEFAULT_API_BASE = 'http://localhost:8000'
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE
const API_BASE_URL = RAW_BASE_URL.replace(/\/$/, '')

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

const createApiError = (error: unknown): ApiError => {
  if (error instanceof Error && (error as ApiError).status) {
    return error as ApiError
  }

  const axiosError = error as AxiosError
  const status = axiosError.response?.status ?? 500
  const data = axiosError.response?.data as Record<string, unknown> | undefined

  const message =
    (typeof data?.message === 'string' && data?.message) ||
    (typeof data?.detail === 'string' && data?.detail) ||
    (typeof data?.error === 'string' && data?.error) ||
    axiosError.message ||
    'Error inesperado'

  const apiError = new Error(message) as ApiError
  apiError.status = status
  apiError.details = data
  apiError.response = axiosError.response

  return apiError
}

const resolvePath = (path: string): string => {
  if (/^https?:/i.test(path)) {
    return path
  }
  const normalized = path.startsWith('/api/') ? path.slice(4) : path
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

const getStoredToken = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(key)
}

const storeToken = (key: string, value: string | null) => {
  if (typeof window === 'undefined') {
    return
  }
  if (value) {
    window.localStorage.setItem(key, value)
  } else {
    window.localStorage.removeItem(key)
  }
}

const buildClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    withCredentials: true,
    timeout: 15000,
  })

  instance.interceptors.request.use((config) => {
    const token = getStoredToken(ACCESS_TOKEN_KEY)
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  let isRefreshing = false
  let pendingRequests: Array<(token: string | null) => void> = []

  const processQueue = (token: string | null) => {
    pendingRequests.forEach((cb) => cb(token))
    pendingRequests = []
  }

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
      const status = error.response?.status

      if (status === 401 && !originalRequest?._retry) {
        const refreshToken = getStoredToken(REFRESH_TOKEN_KEY)
        if (!refreshToken) {
          return Promise.reject(createApiError(error))
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingRequests.push((token) => {
              if (token) {
                if (!originalRequest.headers) {
                  originalRequest.headers = {}
                }
                originalRequest.headers.Authorization = `Bearer ${token}`
                resolve(instance(originalRequest))
              } else {
                reject(createApiError(error))
              }
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const { access } = await refreshAccessToken(instance)
          storeToken(ACCESS_TOKEN_KEY, access)
          processQueue(access)

          if (!originalRequest.headers) {
            originalRequest.headers = {}
          }
          originalRequest.headers.Authorization = `Bearer ${access}`
          return instance(originalRequest)
        } catch (refreshError) {
          processQueue(null)
          clearTokens()
          return Promise.reject(createApiError(refreshError))
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(createApiError(error))
    },
  )

  return instance
}

const client = buildClient()

const clearTokens = () => {
  storeToken(ACCESS_TOKEN_KEY, null)
  storeToken(REFRESH_TOKEN_KEY, null)
}

const setTokens = (access: string, refresh: string) => {
  storeToken(ACCESS_TOKEN_KEY, access)
  storeToken(REFRESH_TOKEN_KEY, refresh)
}

const refreshAccessToken = async (customClient: AxiosInstance) => {
  const refresh = getStoredToken(REFRESH_TOKEN_KEY)
  if (!refresh) {
    throw new Error('Refresh token ausente')
  }
  const response = await customClient.post(resolvePath('/auth/refresh/'), {
    refresh,
  })
  const data = response.data as { access: string }
  return data
}

const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const finalConfig: AxiosRequestConfig = {
    ...config,
    url: config.url ? resolvePath(config.url) : config.url,
  }

  try {
    const response = await client.request<T>(finalConfig)
    return response.data
  } catch (error) {
    throw createApiError(error)
  }
}

const get = async <T>(path: string, config?: AxiosRequestConfig): Promise<T> =>
  request<T>({ ...config, method: 'get', url: path })

const post = async <T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  request<T>({ ...config, method: 'post', url: path, data })

const put = async <T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  request<T>({ ...config, method: 'put', url: path, data })

const patch = async <T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  request<T>({ ...config, method: 'patch', url: path, data })

const del = async <T>(path: string, config?: AxiosRequestConfig): Promise<T> =>
  request<T>({ ...config, method: 'delete', url: path })

const api = {
  client,
  get,
  post,
  put,
  patch,
  delete: del,
  isAuthenticated: () => !!getStoredToken(ACCESS_TOKEN_KEY),
  getAccessToken: () => getStoredToken(ACCESS_TOKEN_KEY),

  async login(credentials: { username: string; password: string }) {
    const data = await post<{
      user: unknown
      access: string
      refresh: string
    }>('/auth/login/', credentials)

    setTokens(data.access, data.refresh)
    return data
  },

  async logout() {
    const refresh = getStoredToken(REFRESH_TOKEN_KEY)
    try {
      if (refresh) {
        await post('/auth/logout/', { refresh })
      }
    } finally {
      clearTokens()
    }
  },

  async getCurrentUser() {
    return get('/auth/me/')
  },

  async getMiPerfil() {
    return this.getCurrentUser()
  },

  async updateMiPerfil(data: Record<string, unknown>) {
    return patch('/usuarios/update_me/', data)
  },

  async cambiarMiPassword(payload: Record<string, unknown>) {
    return post('/usuarios/cambiar_mi_password/', payload)
  },

  async getUsuarios(params?: Record<string, unknown>) {
    return get('/usuarios/', { params })
  },

  async createUsuario(data: Record<string, unknown>) {
    return post('/usuarios/', data)
  },

  async updateUsuario(id: number | string, data: Record<string, unknown>) {
    return put(`/usuarios/${id}/`, data)
  },

  async desactivarUsuario(id: number | string) {
    return del(`/usuarios/${id}/`)
  },

  async reactivarUsuario(id: number | string) {
    return post(`/usuarios/${id}/reactivar/`)
  },

  async cambiarPasswordUsuario(id: number | string, data: Record<string, unknown>) {
    return post(`/usuarios/${id}/cambiar_password/`, data)
  },

  async getParadas(params?: Record<string, unknown>) {
    return get('/produccion/paradas/', { params })
  },

  async getLotes(params?: Record<string, unknown>) {
    return get('/produccion/lotes/', { params })
  },

  async getLote(id: number | string) {
    return get(`/produccion/lotes/${id}/`)
  },

  async createLote(data: Record<string, unknown>) {
    return post('/produccion/lotes/', data)
  },

  async updateLote(id: number | string, data: Record<string, unknown>) {
    return put(`/produccion/lotes/${id}/`, data)
  },

  async getLotesEtapas(params?: Record<string, unknown>) {
    return get('/produccion/lotes-etapas/', { params })
  },

  async iniciarLoteEtapa(id: number | string, payload?: Record<string, unknown>) {
    return post(`/produccion/lotes-etapas/${id}/iniciar/`, payload)
  },

  async pausarLoteEtapa(id: number | string, payload: Record<string, unknown>) {
    return post(`/produccion/lotes-etapas/${id}/pausar/`, payload)
  },

  async completarLoteEtapa(id: number | string, payload?: Record<string, unknown>) {
    return post(`/produccion/lotes-etapas/${id}/completar/`, payload)
  },

  async getControlesCalidad(params?: Record<string, unknown>) {
    return get('/produccion/controles-calidad/', { params })
  },

  async getFormulas(params?: Record<string, unknown>) {
    return get('/formulas/', { params })
  },

  async getProductos(params?: Record<string, unknown>) {
    return get('/productos/', { params })
  },

  async createProducto(data: Record<string, unknown>) {
    return post('/productos/', data)
  },

  async updateProducto(id: number | string, data: Record<string, unknown>) {
    return put(`/productos/${id}/`, data)
  },

  async getMaquinas(params?: Record<string, unknown>) {
    return get('/maquinas/', { params })
  },

  async createMaquina(data: Record<string, unknown>) {
    return post('/maquinas/', data)
  },

  async updateMaquina(id: number | string, data: Record<string, unknown>) {
    return put(`/maquinas/${id}/`, data)
  },

  async getUbicaciones(params?: Record<string, unknown>) {
    return get('/ubicaciones/', { params })
  },

  async getTurnos(params?: Record<string, unknown>) {
    return get('/turnos/', { params })
  },

  async getIncidentes(params?: Record<string, unknown>) {
    return get('/incidentes/', { params })
  },

  async getIncidente(id: number | string) {
    return get(`/incidentes/${id}/`)
  },

  async createIncidente(data: Record<string, unknown>) {
    return post('/incidentes/', data)
  },

  async updateIncidente(id: number | string, data: Record<string, unknown>) {
    return put(`/incidentes/${id}/`, data)
  },

  async getNotificaciones(params?: Record<string, unknown>) {
    return get('/notificaciones/', { params })
  },

  async getContadorNotificacionesNoLeidas() {
    return get('/notificaciones/no_leidas/')
  },

  async marcarNotificacionLeida(id: number | string) {
    return post(`/notificaciones/${id}/marcar_leida/`)
  },

  async marcarTodasNotificacionesLeidas() {
    return post('/notificaciones/marcar_todas_leidas/')
  },

  async getDashboardStats(params?: Record<string, unknown>) {
    return get('/kpis/resumen_dashboard/', { params })
  },

  async getOrdenesTrabajo(params?: Record<string, unknown>) {
    return get('/mantenimiento/ordenes-trabajo/', { params })
  },

  async getOrdenTrabajo(id: number | string) {
    return get(`/mantenimiento/ordenes-trabajo/${id}/`)
  },

  async createOrdenTrabajo(data: Record<string, unknown>) {
    return post('/mantenimiento/ordenes-trabajo/', data)
  },

  async updateOrdenTrabajo(id: number | string, data: Record<string, unknown>) {
    return put(`/mantenimiento/ordenes-trabajo/${id}/`, data)
  },

  async iniciarOrdenTrabajo(id: number | string, payload?: Record<string, unknown>) {
    return post(`/mantenimiento/ordenes-trabajo/${id}/iniciar/`, payload)
  },

  async pausarOrdenTrabajo(id: number | string, payload: Record<string, unknown>) {
    return post(`/mantenimiento/ordenes-trabajo/${id}/pausar/`, payload)
  },

  async completarOrdenTrabajo(id: number | string, payload: Record<string, unknown>) {
    return post(`/mantenimiento/ordenes-trabajo/${id}/completar/`, payload)
  },

  async cerrarOrdenTrabajo(id: number | string, payload?: Record<string, unknown>) {
    return post(`/mantenimiento/ordenes-trabajo/${id}/cerrar/`, payload)
  },

  async getLogsAuditoria(params?: Record<string, unknown>) {
    return get('/auditoria/', { params })
  },

  async buscarGlobal(params: Record<string, unknown>) {
    return get('/buscar/', { params })
  },
}

export { api, request, get, post, put, patch, del as delete, createApiError }
