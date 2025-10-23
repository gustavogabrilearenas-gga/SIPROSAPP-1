/**
 * Cliente Axios mínimo.
 *  – baseURL fija (incluye /api)
 *  – Inserta Authorization si hay token en localStorage
 *  – Expone utilidades comunes: handleApiError y CrudId
 *  – Implementa métodos de autenticación
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { User } from '@/types/models'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL?: string
    }
  }
}

export const AUTH_TOKEN_KEY = 'siprosa.auth.token'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

interface LoginPayload {
  username?: string
  email?: string
  password: string
}

interface LoginResponse {
  access: string
  refresh?: string
}

type ExtendedAxiosInstance = AxiosInstance & {
  login(payload: LoginPayload): Promise<LoginResponse>
  fetchCurrentUser(): Promise<User>
}

// Crear instancia base de axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
})

// Configurar el interceptor
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      config.headers = {
        ...(config.headers ?? {}),
        Authorization: `Bearer ${token}`,
      }
    }
  }
  return config
})

// Crear y configurar la instancia extendida
export const api = axiosInstance as ExtendedAxiosInstance

// Implementar los métodos de autenticación
api.login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/auth/login/', payload)
  return response.data
}

api.fetchCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get<User>('/auth/me/')
  return response.data
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      config.headers = {
        ...(config.headers ?? {}),
        Authorization: `Bearer ${token}`,
      }
    }
  }
  return config
})

// Implementación de los métodos de autenticación
api.login = async (payload: LoginPayload) => {
  const response = await api.post<LoginResponse>('/auth/login/', payload)
  return response.data
}

api.fetchCurrentUser = async () => {
  const response = await api.get<User>('/auth/me/')
  return response.data
}

/** ID genérico de recursos CRUD */
export type CrudId = string | number

/**
 * Normaliza errores de red o de negocio en llamadas Axios.
 * Devuelve siempre un objeto { message, code? }.
 */
export function handleApiError(err: unknown): { message: string; code?: number } {
  if (axios.isAxiosError(err)) {
    const axErr = err as AxiosError<any>
    const code = axErr.response?.status
    const data = axErr.response?.data
    const message =
      (typeof data === 'string' && data) ||
      data?.detail ||
      data?.message ||
      axErr.message ||
      'Error de red'
    return { message, code }
  }
  if (err instanceof Error) return { message: err.message }
  return { message: 'Error desconocido' }
}
