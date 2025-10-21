import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "/drf/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error?.response?.status === 401) {
      try {
        const res = await fetch("/api/auth/token", { cache: "no-store" });
        if (res.ok) {
          return api.request(error.config);
        }
      } catch {}
    }
    return Promise.reject(error);
  }
);
