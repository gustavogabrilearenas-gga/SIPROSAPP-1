import type { ApiError } from './api';

export const isApiError = (e: unknown): e is ApiError =>
  !!e && typeof e === 'object' && 'status' in (e as Record<string, unknown>);

export const toUserMessage = (e: unknown): string => {
  if (isApiError(e)) {
    const status = e.status;
    if (status === 400) return 'Datos inválidos';
    if (status === 401) return 'Sesión expirada';
    if (status === 403) return 'No autorizado';
    if (status === 404) return 'No encontrado';
    if (status >= 500) return 'Error del servidor';
    return e.message || 'Error inesperado';
  }
  return 'Error inesperado';
};
