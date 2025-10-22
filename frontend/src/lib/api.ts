import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export type ApiError = { status: number; message: string; details?: unknown };

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE ?? '/drf/api',
  withCredentials: true,
});

// Control de refresh concurrente
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function enqueueRefreshWaiter() {
  return new Promise<void>((resolve) => {
    refreshQueue.push(resolve);
  });
}
function flushRefreshQueue() {
  refreshQueue.forEach((res) => res());
  refreshQueue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Solo 401 no reintentado aún
    if (status === 401 && original && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        // Espera a que termine un refresh en curso y reintenta
        await enqueueRefreshWaiter();
        return api(original);
      }

      isRefreshing = true;
      try {
        // Llama el endpoint Next que refresca cookies contra DRF
        const resp = await fetch('/api/auth/token', { method: 'POST' });
        // Independiente del resultado, soltar la cola
        flushRefreshQueue();

        if (resp.ok) {
          // Reintenta una sola vez
          return api(original);
        }
      } finally {
        isRefreshing = false;
      }
    }

    const apiErr: ApiError = {
      status,
      message:
        (error.response?.data as any)?.detail ||
        (error.response?.data as any)?.message ||
        error.message ||
        'Error inesperado',
      details: error.response?.data,
    };
    return Promise.reject(apiErr);
  }
);

export const get = async <T>(url: string, config?: any): Promise<T> => (await api.get<T>(url, config)).data;
export const post = async <T>(url: string, body?: any, config?: any): Promise<T> =>
  (await api.post<T>(url, body, config)).data;
export const put = async <T>(url: string, body?: any, config?: any): Promise<T> =>
  (await api.put<T>(url, body, config)).data;
export const del = async <T>(url: string, config?: any): Promise<T> => (await api.delete<T>(url, config)).data;

export default api;
