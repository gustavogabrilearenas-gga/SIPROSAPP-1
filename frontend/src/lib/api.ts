import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export type ApiError = { status: number; message: string; details?: unknown };

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE ?? '/drf/api',
  withCredentials: true,
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = (error.config ?? {}) as RetriableConfig;
    const status = error.response?.status;

    if (status === 401 && !original._retry) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await fetch('/api/auth/token', {
            method: 'POST',
            credentials: 'include',
          });
        } finally {
          isRefreshing = false;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      return api(original);
    }

    const data = error.response?.data as { detail?: unknown } | undefined;
    const err: ApiError = {
      status: status ?? 0,
      message:
        (typeof data?.detail === 'string' && data.detail) ||
        error.message ||
        'Error inesperado',
      details: data,
    };

    return Promise.reject(err);
  },
);

export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  (await api.get<T>(url, config)).data;

export const post = async <T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => (await api.post<T>(url, body, config)).data;

export const put = async <T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => (await api.put<T>(url, body, config)).data;

export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  (await api.delete<T>(url, config)).data;

export default api;
