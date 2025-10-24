import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import type {
  CambiarPasswordRequest,
  EtapaProduccion,
  Formula,
  Funcion,
  Incidente,
  Maquina,
  ObservacionGeneral,
  Parametro,
  Producto,
  RegistroMantenimiento,
  RegistroProduccion,
  Turno,
  Ubicacion,
  User,
  UsuarioDetalle,
} from '@/types/models'

export interface ApiError extends Error {
  status: number
  details?: unknown
  response?: AxiosResponse
}

export interface ApiErrorPayload {
  status: number
  message: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const DEFAULT_API_BASE = 'http://localhost:8000'
const DEFAULT_BROWSER_BASE = '/api'

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const ensureApiBase = (value: string, fallback: string): string => {
  if (!value) {
    return fallback
  }

  if (/^https?:/i.test(value)) {
    const sanitized = trimTrailingSlash(value)
    return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const sanitized = trimTrailingSlash(withLeadingSlash || DEFAULT_BROWSER_BASE)
  return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`
}

const resolveApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    const serverBase =
      process.env.NEXT_PUBLIC_API_URL_SERVER ||
      process.env.NEXT_PUBLIC_API_URL ||
      DEFAULT_API_BASE

    return ensureApiBase(serverBase, ensureApiBase(DEFAULT_API_BASE, `${DEFAULT_API_BASE}/api`))
  }

  const browserBase =
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BROWSER_BASE

  return ensureApiBase(browserBase, ensureApiBase(DEFAULT_BROWSER_BASE, DEFAULT_BROWSER_BASE))
}

const API_BASE_URL = resolveApiBaseUrl()

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

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

const clearTokens = () => {
  storeToken(ACCESS_TOKEN_KEY, null)
  storeToken(REFRESH_TOKEN_KEY, null)
}

const setTokens = (access: string, refresh: string) => {
  storeToken(ACCESS_TOKEN_KEY, access)
  storeToken(REFRESH_TOKEN_KEY, refresh)
}

const createApiError = (error: unknown): ApiError => {
  if (error instanceof Error && (error as ApiError).status) {
    return error as ApiError
  }

  const axiosError = error as AxiosError
  const status = axiosError.response?.status ?? 500
  const data = axiosError.response?.data as Record<string, unknown> | undefined
  const details = data?.details || data?.detail || data

  const apiError = new Error(
    (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      axiosError.message ||
      'Error inesperado'
  ) as ApiError

  apiError.status = status
  apiError.details = details
  apiError.response = axiosError.response

  return apiError
}

export const handleApiError = (error: unknown): ApiErrorPayload => {
  const apiError = createApiError(error)

  return {
    status: apiError.status ?? 500,
    message: apiError.message,
    details: apiError.details ?? apiError.response?.data,
  }
}

const resolvePath = (path: string): string => {
  if (!path) {
    return path
  }

  if (/^https?:/i.test(path)) {
    return path
  }

  const trimmed = path.replace(/^\/+/, '')
  return `/${trimmed}`
}

const buildClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
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
          clearTokens()
          return Promise.reject(createApiError(error))
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingRequests.push((token) => {
              if (token) {
                originalRequest.headers = originalRequest.headers || {}
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
          setTokens(access, refreshToken)
          processQueue(access)

          originalRequest.headers = originalRequest.headers || {}
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
    }
  )

  return instance
}

const client = buildClient()

const refreshAccessToken = async (customClient: AxiosInstance) => {
  const refresh = getStoredToken(REFRESH_TOKEN_KEY)
  if (!refresh) {
    throw new Error('Refresh token ausente')
  }
  const response = await customClient.post(resolvePath('auth/refresh/'), {
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

  const response = await client.request<T>(finalConfig)
  return response.data
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

export type WithResults<T> = T | PaginatedResponse<T>

const unpackResults = <T>(payload: WithResults<T[]>): T[] => {
  if (Array.isArray(payload)) {
    return payload
  }
  return payload.results
}

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
    const data = await post<{ user: User; access: string; refresh: string }>('auth/login/', credentials)
    setTokens(data.access, data.refresh)
    return data
  },

  async logout() {
    const refresh = getStoredToken(REFRESH_TOKEN_KEY)
    try {
      if (refresh) {
        await post('auth/logout/', { refresh })
      }
    } finally {
      clearTokens()
    }
  },

  async getCurrentUser() {
    return get<User>('auth/me/')
  },

  async getMiPerfil() {
    return get<UsuarioDetalle>('usuarios/me/')
  },

  async updateMiPerfil(data: Record<string, unknown>) {
    return patch<UsuarioDetalle>('usuarios/update_me/', data)
  },

  async cambiarMiPassword(payload: CambiarPasswordRequest) {
    return post('usuarios/cambiar_mi_password/', payload)
  },

  async getUsuarios(params?: Record<string, unknown>) {
    return get<PaginatedResponse<UsuarioDetalle>>('usuarios/', { params })
  },

  async createUsuario(data: Record<string, unknown>) {
    return post<UsuarioDetalle>('usuarios/', data)
  },

  async updateUsuario(id: number | string, data: Record<string, unknown>) {
    return put<UsuarioDetalle>(`usuarios/${id}/`, data)
  },

  async desactivarUsuario(id: number | string) {
    return del(`usuarios/${id}/`)
  },

  async reactivarUsuario(id: number | string) {
    return post(`usuarios/${id}/reactivar/`)
  },

  async cambiarPasswordUsuario(id: number | string, data: CambiarPasswordRequest) {
    return post(`usuarios/${id}/cambiar_password/`, data)
  },

  async getFunciones(params?: Record<string, unknown>) {
    return get<PaginatedResponse<Funcion>>('catalogos/funciones/', { params })
  },

  async getParametros(params?: Record<string, unknown>) {
    return get<PaginatedResponse<Parametro>>('catalogos/parametros/', { params })
  },

  async getProductos(params?: Record<string, unknown>) {
    return get<PaginatedResponse<Producto>>('catalogos/productos/', { params })
  },

  async getProducto(id: number | string) {
    return get<Producto>(`catalogos/productos/${id}/`)
  },

  async createProducto(data: Record<string, unknown>) {
    return post('catalogos/productos/', data)
  },

  async updateProducto(id: number | string, data: Record<string, unknown>) {
    return patch(`catalogos/productos/${id}/`, data)
  },

  async deleteProducto(id: number | string) {
    return del(`catalogos/productos/${id}/`)
  },

  async getFormulas(params?: Record<string, unknown>) {
    return get<PaginatedResponse<Formula>>('catalogos/formulas/', { params })
  },

  async getFormula(id: number | string) {
    return get<Formula>(`catalogos/formulas/${id}/`)
  },

  async createFormula(data: Record<string, unknown>) {
    return post('catalogos/formulas/', data)
  },

  async updateFormula(id: number | string, data: Record<string, unknown>) {
    return patch(`catalogos/formulas/${id}/`, data)
  },

  async deleteFormula(id: number | string) {
    return del(`catalogos/formulas/${id}/`)
  },

  async getEtapasProduccion(params?: Record<string, unknown>) {
    return get<PaginatedResponse<EtapaProduccion>>('catalogos/etapas-produccion/', { params })
  },

  async getEtapaProduccion(id: number | string) {
    return get<EtapaProduccion>(`catalogos/etapas-produccion/${id}/`)
  },

  async updateEtapaProduccion(id: number | string, data: Record<string, unknown>) {
    return patch(`catalogos/etapas-produccion/${id}/`, data)
  },

  async createEtapaProduccion(data: Record<string, unknown>) {
    return post('catalogos/etapas-produccion/', data)
  },

  async deleteEtapaProduccion(id: number | string) {
    return del(`catalogos/etapas-produccion/${id}/`)
  },

  async getTurnos(params?: Record<string, unknown>) {
    return get<PaginatedResponse<Turno>>('catalogos/turnos/', { params })
  },

  async getTurno(id: number | string) {
    return get<Turno>(`catalogos/turnos/${id}/`)
  },

  async createTurno(data: Record<string, unknown>) {
    return post('catalogos/turnos/', data)
  },

  async updateTurno(id: number | string, data: Record<string, unknown>) {
    return patch(`catalogos/turnos/${id}/`, data)
  },

  async deleteTurno(id: number | string) {
    return del(`catalogos/turnos/${id}/`)
  },

  async getUbicaciones(params?: Record<string, unknown>) {
    return get<PaginatedResponse<Ubicacion>>('catalogos/ubicaciones/', { params })
  },

  async getUbicacion(id: number | string) {
    return get<Ubicacion>(`catalogos/ubicaciones/${id}/`)
  },

  async createUbicacion(data: Record<string, unknown>) {
    return post('catalogos/ubicaciones/', data)
  },

  async updateUbicacion(id: number | string, data: Record<string, unknown>) {
    return patch(`catalogos/ubicaciones/${id}/`, data)
  },

  async deleteUbicacion(id: number | string) {
    return del(`catalogos/ubicaciones/${id}/`)
  },

  async getMaquinas(params?: Record<string, unknown>) {
    return get<PaginatedResponse<Maquina>>('catalogos/maquinas/', { params })
  },

  async getMaquina(id: number | string) {
    return get<Maquina>(`catalogos/maquinas/${id}/`)
  },

  async createMaquina(data: Record<string, unknown>) {
    return post('catalogos/maquinas/', data)
  },

  async updateMaquina(id: number | string, data: Record<string, unknown>) {
    return patch(`catalogos/maquinas/${id}/`, data)
  },

  async getObservacionesGenerales(params?: Record<string, unknown>) {
    return get<PaginatedResponse<ObservacionGeneral>>('observaciones/observaciones/', { params })
  },

  async createObservacionGeneral(data: { texto: string }) {
    return post<ObservacionGeneral>('observaciones/observaciones/', data)
  },

  async getProduccionRegistros(params?: Record<string, unknown>) {
    return get<PaginatedResponse<RegistroProduccion>>('produccion/registros/', { params })
  },

  async createProduccionRegistro(data: Record<string, unknown>) {
    return post('produccion/registros/', data)
  },

  async updateProduccionRegistro(id: number | string, data: Record<string, unknown>) {
    return patch(`produccion/registros/${id}/`, data)
  },

  async getMantenimientoRegistros(params?: Record<string, unknown>) {
    return get<PaginatedResponse<RegistroMantenimiento>>('mantenimiento/registros/', { params })
  },

  async createMantenimientoRegistro(data: Record<string, unknown>) {
    return post('mantenimiento/registros/', data)
  },

  async updateMantenimientoRegistro(id: number | string, data: Record<string, unknown>) {
    return patch(`mantenimiento/registros/${id}/`, data)
  },

  async getIncidentes(params?: Record<string, unknown>) {
    return get<PaginatedResponse<Incidente>>('incidentes/incidentes/', { params })
  },

  async getIncidente(id: number | string) {
    return get<Incidente>(`incidentes/incidentes/${id}/`)
  },

  async createIncidente(data: Record<string, unknown>) {
    return post('incidentes/incidentes/', data)
  },

  async updateIncidente(id: number | string, data: Record<string, unknown>) {
    return patch(`incidentes/incidentes/${id}/`, data)
  },
/* Funciones */
async getFunciones(params?: Record<string, unknown>) {
  return get<PaginatedResponse<Funcion>>('catalogos/funciones/', { params })
},

async getFuncion(id: number | string) {
  return get<Funcion>(`catalogos/funciones/${id}/`)
},

async createFuncion(data: Record<string, unknown>) {
  return post('catalogos/funciones/', data)
},

async updateFuncion(id: number | string, data: Record<string, unknown>) {
  return patch(`catalogos/funciones/${id}/`, data)
},

async deleteFuncion(id: number | string) {
  return del(`catalogos/funciones/${id}/`)
},

/* Parámetros */
async getParametros(params?: Record<string, unknown>) {
  return get<PaginatedResponse<Parametro>>('catalogos/parametros/', { params })
},

async getParametro(id: number | string) {
  return get<Parametro>(`catalogos/parametros/${id}/`)
},

async createParametro(data: Record<string, unknown>) {
  return post('catalogos/parametros/', data)
},

async updateParametro(id: number | string, data: Record<string, unknown>) {
  return patch(`catalogos/parametros/${id}/`, data)
},

async deleteParametro(id: number | string) {
  return del(`catalogos/parametros/${id}/`)
},

}

export {
  api,
  request,
  get,
  post,
  put,
  patch,
  del as delete,
  createApiError,
  unpackResults,
}
