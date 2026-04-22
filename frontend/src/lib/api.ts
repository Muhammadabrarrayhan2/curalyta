import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';

const TOKEN_KEY = 'curalyta_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 responses → clear token, redirect
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiError>) => {
    if (err.response?.status === 401) {
      // Only clear if we actually had a token (avoid wiping on login fail)
      if (tokenStorage.get()) {
        tokenStorage.clear();
        // Soft redirect — consumers can react
        if (!window.location.pathname.startsWith('/')) {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Extracts a user-friendly message from an axios error.
 */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.error?.message) return data.error.message;
    if (err.code === 'ECONNABORTED') return 'Koneksi timeout, coba lagi.';
    if (err.code === 'ERR_NETWORK') return 'Tidak bisa terhubung ke server.';
    return err.message || 'Terjadi kesalahan';
  }
  if (err instanceof Error) return err.message;
  return 'Terjadi kesalahan tidak terduga';
}
