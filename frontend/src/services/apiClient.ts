import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  storeAuth,
} from '@/lib/authStorage';
import type { ApiSuccess, AuthResult } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60_000,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuth();
    return null;
  }

  try {
    const response = await axios.post<ApiSuccess<AuthResult>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    const result = response.data.data;
    storeAuth(result.user, result.tokens);
    return result.tokens.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiSuccess<unknown> & { message?: string; code?: string; details?: unknown; success?: boolean }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      }
    }

    const payload = error.response?.data;
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: string }).message ?? error.message)
        : error.message;

    throw new ApiClientError(
      message || 'Request failed',
      status ?? 0,
      payload && typeof payload === 'object' && 'code' in payload
        ? String((payload as { code?: string }).code)
        : undefined,
      payload && typeof payload === 'object' && 'details' in payload
        ? (payload as { details?: unknown }).details
        : payload,
    );
  },
);

export async function apiRequest<T>(
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await axiosInstance.request<ApiSuccess<T>>({
    method,
    url: path,
    data: body,
  });
  return response.data.data;
}

export const apiClient = {
  get: <T>(path: string) => apiRequest<T>('get', path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>('post', path, body),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>('patch', path, body),
  put: <T>(path: string, body?: unknown) => apiRequest<T>('put', path, body),
  delete: <T>(path: string) => apiRequest<T>('delete', path),
};
