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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

if (!API_BASE_URL) {
  console.warn('NEXT_PUBLIC_API_URL no está definida. Las peticiones usarán rutas relativas.')
}

export const AUTH_TOKEN_KEY = 'siprosa.auth.token'

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
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

const USER_ENDPOINT_CANDIDATES = ['usuarios/me/', 'auth/me/', 'users/me/'] as const

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
      method: 'put',
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
    return request<{ access: string; refresh?: string }>({
      method: 'post',
      url: 'token/',
      data: credentials,
    })
  },

  async fetchCurrentUser(options: { username?: string } = {}) {
    const { username } = options

    for (const endpoint of USER_ENDPOINT_CANDIDATES) {
      try {
        const user = await request<User>({ method: 'get', url: endpoint })
        if (user) {
          return user
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status === 404) {
            continue
          }
          if (status === 401 || status === 403) {
            throw error
          }
        }
        throw error
      }
    }

    if (username) {
      try {
        const endpoint = normalizeResource('usuarios')
        const payload = await request<User[] | PaginatedResponse<User>>({
          method: 'get',
          url: endpoint,
          params: { username, limit: 1 },
        })
        const [user] = extractResults(payload)
        if (user) {
          return user
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // Ignorar y continuar con el error final.
        } else {
          throw error
        }
      }
    }

    throw new Error('No se pudo obtener la información del usuario actual.')
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
