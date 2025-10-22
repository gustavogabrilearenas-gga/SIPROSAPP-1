import type { ApiError } from './api';

export const isApiError = (e: unknown): e is ApiError =>
  !!e && typeof e === 'object' && 'status' in (e as Record<string, unknown>);

export const toUserMessage = (e: unknown): string => {
  if (isApiError(e)) {
    const status = e.status;
    const message = typeof e.message === 'string' && e.message.trim() ? e.message.trim() : undefined;

    if (status === 400) return message ?? 'Datos inválidos';
    if (status === 401) return message ?? 'Sesión expirada';
    if (status === 403) return message ?? 'No autorizado';
    if (status === 404) return message ?? 'No encontrado';
    if (status >= 500) return message ?? 'Error del servidor';
    return message ?? 'Error inesperado';
  }
  return 'Error inesperado';
};
