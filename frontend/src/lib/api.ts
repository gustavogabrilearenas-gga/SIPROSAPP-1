import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { User, UsuarioDetalle } from '@/types/models'

export type CrudId = number | string

export interface PaginatedResponse<T> {
  count?: number
  next?: string | null
  previous?: string | null
  results: T[]
}

export interface ApiErrorPayload {
  status?: number
  message: string
  details?: unknown
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'
export const AUTH_TOKEN_KEY = 'siprosa.auth.token'

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await client.request<T>(config)
  return response.data
}

const normalizeResource = (resource: string): string =>
  resource.endsWith('/') ? resource : `${resource}/`

const extractResults = <T>(payload: T[] | PaginatedResponse<T>): T[] => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload?.results) {
    return payload.results
  }

  return []
}

export const handleApiError = (error: unknown): ApiErrorPayload => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as Record<string, unknown> | undefined
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.error === 'string'
          ? data.error
          : typeof data?.message === 'string'
            ? data.message
            : null

    return {
      status,
      message: detail ?? error.message ?? 'Error inesperado',
      details: data,
    }
  }

  if (error instanceof Error) {
    return { message: error.message }
  }

  return { message: 'Error inesperado' }
}

export const api = {
  client,

  async list<T>(resource: string, params?: Record<string, unknown>) {
    const endpoint = normalizeResource(resource)
    return request<T[] | PaginatedResponse<T>>({
      method: 'get',
      url: endpoint,
      params,
    })
  },

  async retrieve<T>(resource: string, id: CrudId) {
    const endpoint = normalizeResource(resource)
    return request<T>({
      method: 'get',
      url: `${endpoint}${id}/`,
    })
  },

  async create<T>(resource: string, data: unknown) {
    const endpoint = normalizeResource(resource)
    return request<T>({
      method: 'post',
      url: endpoint,
      data,
    })
  },

  async update<T>(resource: string, id: CrudId, data: unknown) {
    const endpoint = normalizeResource(resource)
    return request<T>({
      method: 'patch',
      url: `${endpoint}${id}/`,
      data,
    })
  },

  async remove(resource: string, id: CrudId) {
    const endpoint = normalizeResource(resource)
    await request<void>({
      method: 'delete',
      url: `${endpoint}${id}/`,
    })
  },

  async login(credentials: { username: string; password: string }) {
    return request<{ user?: User; access?: string; token?: string } & Record<string, unknown>>({
      method: 'post',
      url: 'auth/login/',
      data: credentials,
    })
  },

  async logout() {
    try {
      await request({ method: 'post', url: 'auth/logout/' })
    } catch (error) {
      // Ignorar errores de logout para no bloquear el flujo del usuario
      console.warn('Error al cerrar sesión', error)
    }
  },

  async getCurrentUser() {
    return request<User>({ method: 'get', url: 'auth/me/' })
  },

  async getProfile() {
    return request<UsuarioDetalle>({ method: 'get', url: 'usuarios/me/' })
  },

  async updateProfile(data: Record<string, unknown>) {
    return request<UsuarioDetalle>({
      method: 'patch',
      url: 'usuarios/update_me/',
      data,
    })
  },

  async changePassword(data: Record<string, unknown>) {
    return request<void>({
      method: 'post',
      url: 'usuarios/cambiar_mi_password/',
      data,
    })
  },
}

export const apiUtils = {
  extractResults,
}

