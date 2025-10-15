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

export interface ApiErrorPayload {
  status: number
  message: string
  details?: unknown
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

const createApiError = (error: unknown): ApiError => {
  if (error instanceof Error && (error as ApiError).status) {
    return error as ApiError
  }

  const axiosError = error as AxiosError
  const status = axiosError.response?.status ?? 500
  const data = axiosError.response?.data as Record<string, unknown> | undefined
  const details = data?.details || data?.detail || data

  let message = 'Error inesperado';
  
  if (status === 400) {
    message = 'Acción no permitida';
  } else if (status === 422) {
    // Para errores 422, intentamos obtener el mensaje directamente
    const responseData = axiosError.response?.data;
    console.log('Error 422 Response:', {
      data: responseData,
      status,
      statusText: axiosError.response?.statusText,
      headers: axiosError.response?.headers,
      raw: axiosError.response
    });

    if (typeof responseData === 'string') {
      message = responseData;
    } else if (responseData && typeof responseData === 'object') {
      const dataObj = responseData as Record<string, unknown>;
      // Intentar obtener el mensaje desde cualquier parte de la respuesta
      if (typeof dataObj === 'object') {
        message = String(
          // Intentar todas las posibles ubicaciones del mensaje de error
          dataObj.detail ||
          dataObj.message ||
          dataObj.error ||
          // Si hay un objeto anidado, intentar obtener el mensaje de allí
          (typeof dataObj.body === 'object' && dataObj.body && (dataObj.body as any).message) ||
          // Si la respuesta completa es un string, usarlo
          (typeof axiosError.response?.data === 'string' && axiosError.response.data) ||
          // Si hay un mensaje en el error mismo, usarlo
          axiosError.message ||
          'Error de validación'
        );
      }
    }
    
    // Si después de todo no tenemos mensaje, usar el statusText
    if (!message || message === '[object Object]' || message === 'Error de validación') {
      message = axiosError.response?.statusText || 'Error de validación';
    }
  } else {
    message = (typeof data?.error === 'string' && data?.error) ||
              (typeof data?.message === 'string' && data?.message) ||
              (typeof data?.detail === 'string' && data?.detail) ||
              axiosError.message ||
              'Error inesperado';
  }

  const apiError = new Error(message) as ApiError
  apiError.status = status
  apiError.details = data
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
  if (/^https?:/i.test(path)) {
    return path
  }

  const trimmed = path.replace(/^\/+/, '')

  return `/${trimmed}`
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

const withHandledRequest = async <T>(factory: () => Promise<T>): Promise<T> => {
  try {
    return await factory()
  } catch (error) {
    throw handleApiError(error)
  }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LoteListItem {
  id: number
  codigo_lote: string
  producto: number
  producto_nombre: string
  estado: string
  estado_display: string
  prioridad: string
  prioridad_display: string
  cantidad_planificada: number
  cantidad_producida: number | null
  cantidad_rechazada: number | null
  unidad: string
  rendimiento_porcentaje: number | null
  fecha_planificada_inicio: string | null
  fecha_real_inicio: string | null
  fecha_planificada_fin: string | null
  fecha_real_fin: string | null
  fecha_creacion: string
  supervisor: number | null
  supervisor_nombre: string | null
}

export interface LoteListParams {
  estado?: string
  producto?: number
  turno?: number
  fecha_desde?: string
  fecha_hasta?: string
  en_proceso?: boolean
  mostrar_ocultos?: boolean
  ordering?: string
  page?: number
}

export interface Lote extends LoteListItem {
  formula: number
  formula_version: string | null
  turno: number | null
  turno_nombre: string | null
  observaciones: string | null
  creado_por: number
  creado_por_nombre: string | null
  visible: boolean
  cancelado_por: number | null
  cancelado_por_nombre: string | null
  fecha_cancelacion: string | null
  motivo_cancelacion?: string | null
}

export type CreateLotePayload = Partial<Omit<Lote, 'id' | 'creado_por' | 'creado_por_nombre' | 'fecha_creacion' | 'rendimiento_porcentaje'>> & {
  codigo_lote: string
  producto: number
  formula: number
  cantidad_planificada: number
  unidad: string
  prioridad: string
}

export type UpdateLotePayload = Partial<CreateLotePayload>

export interface CancelLotePayload {
  motivo: string
}

export type IniciarLotePayload = Record<string, unknown>

export type CompletarLotePayload = Record<string, unknown>

export interface PausarLotePayload {
  motivo: string
}

export interface LiberarLotePayload {
  password: string
  motivo: string
  comentarios?: string
}

export interface RechazarLotePayload extends LiberarLotePayload {}

export interface LoteActionResponse {
  message?: string
  lote: Lote
  [key: string]: unknown
}

export interface OrdenTrabajoListItem {
  id: number
  codigo: string
  maquina: number | null
  maquina_nombre: string | null
  tipo: number
  tipo_nombre: string
  prioridad: string
  prioridad_display: string
  estado: string
  estado_display: string
  titulo: string
  fecha_creacion: string
  fecha_planificada: string | null
  asignada_a: number | null
}

export interface OrdenTrabajoListParams {
  maquina?: number
  tipo?: number
  estado?: string
  prioridad?: string
  ordering?: string
  page?: number
}

export interface TipoMantenimiento {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  activo: boolean
}

export interface OrdenTrabajo extends OrdenTrabajoListItem {
  descripcion: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  duracion_real_horas: number | null
  creada_por: number
  creada_por_nombre: string | null
  completada_por: number | null
  trabajo_realizado: string | null
  observaciones: string | null
  requiere_parada_produccion: boolean
  costo_estimado: number | null
  costo_real: number | null
}

export type CreateOrdenTrabajoPayload = {
  tipo: number
  maquina: number
  prioridad: string
  titulo: string
  descripcion?: string
  fecha_planificada?: string
  requiere_parada_produccion?: boolean
  costo_estimado?: number
}

export type UpdateOrdenTrabajoPayload = Partial<CreateOrdenTrabajoPayload> & {
  estado?: string
  asignada_a?: number | null
  observaciones?: string | null
  trabajo_realizado?: string | null
  costo_real?: number | null
}

export interface OrdenTrabajoActionResponse {
  message: string
  orden_trabajo: OrdenTrabajo
}

export interface ControlCalidad {
  id: number
  lote_etapa: number
  tipo_control: string
  valor_medido: number
  unidad: string
  valor_minimo: number | null
  valor_maximo: number | null
  conforme?: boolean
  fecha_control: string
  controlado_por: number
  observaciones?: string | null
}

export type CreateControlCalidadPayload = Omit<
  ControlCalidad,
  'id' | 'fecha_control' | 'conforme'
>

export type UpdateControlCalidadPayload = Partial<CreateControlCalidadPayload>

export interface ControlCalidadListParams {
  lote_etapa?: number
  ordering?: string
  search?: string
  page?: number
}

export interface Desviacion {
  id: number
  codigo: string
  lote: number | null
  lote_codigo: string | null
  lote_etapa: number | null
  lote_etapa_descripcion?: string | null
  titulo: string
  descripcion: string
  severidad: string
  severidad_display?: string
  estado: string
  estado_display?: string
  fecha_deteccion: string
  detectado_por: number
  detectado_por_nombre?: string
  area_responsable?: string | null
  impacto_calidad?: boolean
  impacto_seguridad?: boolean
  impacto_eficacia?: boolean
  investigacion_realizada?: string | null
  causa_raiz?: string | null
  accion_inmediata?: string | null
  requiere_capa?: boolean
  fecha_cierre?: string | null
  cerrado_por?: number | null
  cerrado_por_nombre?: string | null
}

export interface DesviacionListParams {
  severidad?: string
  estado?: string
  lote?: number
  ordering?: string
  search?: string
  page?: number
}

export type CreateDesviacionPayload = {
  titulo: string
  descripcion: string
  severidad: string
  lote?: number | null
  lote_etapa?: number | null
  area_responsable?: string | null
  impacto_calidad?: boolean
  impacto_seguridad?: boolean
  impacto_eficacia?: boolean
  investigacion_realizada?: string | null
  causa_raiz?: string | null
  accion_inmediata?: string | null
  requiere_capa?: boolean
}

export type UpdateDesviacionPayload = Partial<CreateDesviacionPayload> & {
  estado?: string
  fecha_cierre?: string
  cerrado_por?: number | null
}

export interface AccionCorrectiva {
  id: number
  incidente: number
  incidente_codigo?: string
  incidente_titulo?: string
  tipo: string
  tipo_display?: string
  descripcion: string
  responsable: number
  responsable_nombre?: string
  fecha_planificada: string
  fecha_implementacion?: string | null
  estado: string
  estado_display?: string
  eficacia_verificada?: boolean
  verificado_por?: number | null
  verificado_por_nombre?: string | null
  fecha_verificacion?: string | null
  observaciones?: string | null
}

export type CreateAccionCorrectivaPayload = {
  incidente: number
  tipo: string
  descripcion: string
  responsable: number
  fecha_planificada: string
  fecha_implementacion?: string | null
  estado?: string
  eficacia_verificada?: boolean
  verificado_por?: number | null
  fecha_verificacion?: string | null
  observaciones?: string | null
}

export interface DashboardStats {
  fecha: string
  lotes: {
    activos: number
    hoy: number
    total: number
  }
  incidentes: {
    abiertos: number
    criticos: number
    total: number
  }
  ordenes_trabajo: {
    abiertas: number
    urgentes: number
    total: number
  }
  oee_7_dias: {
    oee: number
    disponibilidad: number
    rendimiento: number
    calidad: number
  }
}

export type ApiEnvelope<T> = {
  status: number
  data: T
  message?: string
}

export interface KpiDashboard {
  produccion_diaria: number
  produccion_semanal: number
  rendimiento_promedio: number
  mantenimiento_abiertas: number
  mantenimiento_en_pausa: number
  mantenimiento_completadas_semana: number
  calidad_desviaciones_abiertas: number
  calidad_controles_no_conformes: number
}

export interface KpiOEE {
  oee: number
  disponibilidad: number
  rendimiento: number
  calidad: number
}

export interface KpiHistorialPoint {
  fecha: string
  lotes_finalizados: number
  unidades_producidas: number
  unidades_rechazadas: number
}

export interface KpiHistorial {
  historial: KpiHistorialPoint[]
}



export interface OeeSeriesPoint {
  fecha: string
  lotes: number
  cantidad_producida: number
}

export interface OeeMetrics {
  desde: string
  hasta: string
  turno: string | null
  total_lotes: number
  oee: number
  disponibilidad: number
  rendimiento: number
  calidad: number
  message?: string
  metricas?: {
    tiempo_planificado_horas: number
    tiempo_real_horas: number
    tiempo_paradas_horas: number
    tiempo_operativo_horas: number
    cantidad_planificada: number
    cantidad_producida: number
    cantidad_rechazada: number
    cantidad_buena: number
  }
  series?: OeeSeriesPoint[]
}

export interface OeeParams {
  desde?: string
  hasta?: string
  turno?: string
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

  async createParada(data: Record<string, unknown>) {
    return post('/produccion/paradas/', data)
  },

  async updateParada(id: number | string, data: Record<string, unknown>) {
    return patch(`/produccion/paradas/${id}/`, data)
  },

  async finalizarParada(id: number | string, data: Record<string, unknown>) {
    return post(`/produccion/paradas/${id}/finalizar/`, data)
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

  async getLogsAuditoria(params?: Record<string, unknown>) {
    return get('/auditoria/logs/', { params })
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

  async createUbicacion(data: Record<string, unknown>) {
    return post('/ubicaciones/', data)
  },

  async updateUbicacion(id: number | string, data: Record<string, unknown>) {
    return patch(`/ubicaciones/${id}/`, data)
  },

  async getTurnos(params?: Record<string, unknown>) {
    return get('/turnos/', { params })
  },

  async createTurno(data: Record<string, unknown>) {
    return post('/turnos/', data)
  },

  async updateTurno(id: number | string, data: Record<string, unknown>) {
    return patch(`/turnos/${id}/`, data)
  },

  async getIncidentes(params?: Record<string, unknown>) {
    return get('/incidencias/incidentes/', { params })
  },

  async getIncidente(id: number | string) {
    return get(`/incidencias/incidentes/${id}/`)
  },

  async createIncidente(data: Record<string, unknown>) {
    return post('/incidencias/incidentes/', data)
  },

  async updateIncidente(id: number | string, data: Record<string, unknown>) {
    return put(`/incidencias/incidentes/${id}/`, data)
  },



  async getDashboardResumen(): Promise<KpiDashboard> {
    try {
      const response = await get<ApiEnvelope<KpiDashboard>>('/kpis/resumen_dashboard/')
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async getOEE(): Promise<KpiOEE> {
    try {
      const response = await get<ApiEnvelope<KpiOEE>>('/kpis/oee/')
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async getHistorialProduccion(): Promise<KpiHistorial> {
    try {
      const response = await get<ApiEnvelope<KpiHistorial>>('/kpis/historial_produccion/')
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
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


}

export const getLotes = async (
  params?: LoteListParams,
): Promise<PaginatedResponse<LoteListItem>> =>
  withHandledRequest(() => get<PaginatedResponse<LoteListItem>>('produccion/lotes/', { params }))

export const createLote = async (payload: CreateLotePayload): Promise<Lote> =>
  withHandledRequest(() => post<Lote>('produccion/lotes/', payload))

export const cancelarLote = async (
  id: number | string,
  payload: CancelLotePayload,
): Promise<LoteActionResponse> =>
  withHandledRequest(() => post<LoteActionResponse>(`produccion/lotes/${id}/cancelar/`, payload))

export const iniciarLote = async (
  id: number | string,
  payload?: IniciarLotePayload,
): Promise<LoteActionResponse> =>
  withHandledRequest(() => post<LoteActionResponse>(`produccion/lotes/${id}/iniciar/`, payload))

export const completarLote = async (
  id: number | string,
  payload?: CompletarLotePayload,
): Promise<LoteActionResponse> =>
  // If client provides an explicit fecha_real_fin, prefer to update the lote via PUT
  // to set estado=FINALIZADO and fecha_real_fin in one request. This avoids server-side
  // overwriting with timezone.now() and avoids 422 when lote is not in EN_PROCESO.
  withHandledRequest(() => {
    if (payload && (payload as any).fecha_real_fin) {
      const data: Record<string, unknown> = { ...(payload as Record<string, unknown>), estado: 'FINALIZADO' }
      return put<LoteActionResponse>(`produccion/lotes/${id}/`, data)
    }
    return post<LoteActionResponse>(`produccion/lotes/${id}/completar/`, payload)
  })

export const pausarLote = async (
  id: number | string,
  payload: PausarLotePayload,
): Promise<LoteActionResponse> =>
  withHandledRequest(() => post<LoteActionResponse>(`produccion/lotes/${id}/pausar/`, payload))

export const liberarLote = async (
  id: number | string,
  payload: LiberarLotePayload,
): Promise<LoteActionResponse> =>
  withHandledRequest(() => post<LoteActionResponse>(`produccion/lotes/${id}/liberar/`, payload))

export const rechazarLote = async (
  id: number | string,
  payload: RechazarLotePayload,
): Promise<LoteActionResponse> =>
  withHandledRequest(() => post<LoteActionResponse>(`produccion/lotes/${id}/rechazar/`, payload))

export const getOrdenesTrabajo = async (
  params?: OrdenTrabajoListParams,
): Promise<PaginatedResponse<OrdenTrabajoListItem>> =>
  withHandledRequest(() => get<PaginatedResponse<OrdenTrabajoListItem>>('mantenimiento/ordenes-trabajo/', { params }))

export const getTiposMantenimiento = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<TipoMantenimiento>> =>
  withHandledRequest(() => get<PaginatedResponse<TipoMantenimiento>>('mantenimiento/tipos-mantenimiento/', { params }))

export const createOrdenTrabajo = async (
  payload: CreateOrdenTrabajoPayload,
): Promise<OrdenTrabajo> =>
  withHandledRequest(() => post<OrdenTrabajo>('mantenimiento/ordenes-trabajo/', payload))

export const updateOrdenTrabajo = async (
  id: number | string,
  payload: UpdateOrdenTrabajoPayload,
): Promise<OrdenTrabajo> =>
  withHandledRequest(() => put<OrdenTrabajo>(`mantenimiento/ordenes-trabajo/${id}/`, payload))

export const iniciarOrdenTrabajo = async (
  id: number | string,
  payload?: Record<string, unknown>,
): Promise<OrdenTrabajoActionResponse> =>
  withHandledRequest(() => post<OrdenTrabajoActionResponse>(`mantenimiento/ordenes-trabajo/${id}/iniciar/`, payload))

export const completarOrdenTrabajo = async (
  id: number | string,
  payload: UpdateOrdenTrabajoPayload,
): Promise<OrdenTrabajoActionResponse> =>
  withHandledRequest(() => post<OrdenTrabajoActionResponse>(`mantenimiento/ordenes-trabajo/${id}/completar/`, payload))

export const cerrarOrdenTrabajo = async (
  id: number | string,
  payload?: UpdateOrdenTrabajoPayload,
): Promise<OrdenTrabajoActionResponse> =>
  withHandledRequest(() => post<OrdenTrabajoActionResponse>(`mantenimiento/ordenes-trabajo/${id}/cerrar/`, payload))

export const getControlesCalidad = async (
  params?: ControlCalidadListParams,
): Promise<PaginatedResponse<ControlCalidad>> =>
  withHandledRequest(() => get<PaginatedResponse<ControlCalidad>>('produccion/controles-calidad/', { params }))

export const createControlCalidad = async (
  payload: CreateControlCalidadPayload,
): Promise<ControlCalidad> =>
  withHandledRequest(() => post<ControlCalidad>('produccion/controles-calidad/', payload))

export const updateControlCalidad = async (
  id: number | string,
  payload: UpdateControlCalidadPayload,
): Promise<ControlCalidad> =>
  withHandledRequest(() => put<ControlCalidad>(`produccion/controles-calidad/${id}/`, payload))

export const getDesviaciones = async (
  params?: DesviacionListParams,
): Promise<PaginatedResponse<Desviacion>> =>
  withHandledRequest(() => get<PaginatedResponse<Desviacion>>('calidad/desviaciones/', { params }))

export const createDesviacion = async (
  payload: CreateDesviacionPayload,
): Promise<Desviacion> =>
  withHandledRequest(() => post<Desviacion>('calidad/desviaciones/', payload))

export const updateDesviacion = async (
  id: number | string,
  payload: UpdateDesviacionPayload,
): Promise<Desviacion> =>
  withHandledRequest(() => put<Desviacion>(`calidad/desviaciones/${id}/`, payload))

export const createAccionCorrectiva = async (
  payload: CreateAccionCorrectivaPayload,
): Promise<AccionCorrectiva> =>
  withHandledRequest(() => post<AccionCorrectiva>('calidad/acciones-correctivas/', payload))

export const getDashboardStats = async (params?: Record<string, unknown>): Promise<DashboardStats> =>
  withHandledRequest(() => get<DashboardStats>('kpis/resumen_dashboard/', { params }))

export const getOEE = async (params?: OeeParams): Promise<OeeMetrics> =>
  withHandledRequest(() => get<OeeMetrics>('kpis/oee/', { params }))

export const exportCSV = async (params?: OeeParams): Promise<Blob> =>
  withHandledRequest(() => get<Blob>('kpis/export.csv', { params, responseType: 'blob' }))

Object.assign(api, {
  getLotes,
  createLote,
  cancelarLote,
  iniciarLote,
  completarLote,
  pausarLote,
  liberarLote,
  rechazarLote,
  getOrdenesTrabajo,
  getTiposMantenimiento,
  createOrdenTrabajo,
  updateOrdenTrabajo,
  iniciarOrdenTrabajo,
  completarOrdenTrabajo,
  cerrarOrdenTrabajo,
  getControlesCalidad,
  createControlCalidad,
  updateControlCalidad,
  getDesviaciones,
  createDesviacion,
  updateDesviacion,
  createAccionCorrectiva,
  getDashboardStats,
  getOEE,
  exportCSV,
})

export { api, request, get, post, put, patch, del as delete, createApiError }
