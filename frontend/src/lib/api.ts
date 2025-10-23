/**
 * Cliente Axios mínimo.
 *  – baseURL fija (incluye /api)
 *  – Inserta Authorization si hay token en localStorage
 *  – Expone utilidades comunes: handleApiError y CrudId
 */
import axios, { AxiosError } from 'axios'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = {
        ...(config.headers ?? {}),
        Authorization: `Bearer ${token}`,
      }
    }
  }
  return config
})

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
