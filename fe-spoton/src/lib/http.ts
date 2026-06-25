/**
 * lib/http.ts
 * HTTP client dùng chung cho toàn FE.
 * Tất cả API call phải đi qua file này, KHÔNG fetch trực tiếp trong component.
 */

import { AppError, handleFetchError, parseApiError } from './errors';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  // Auto-inject auth token from localStorage if not provided explicitly
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('spoton_token') : null);

  const headers: HeadersInit = {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...fetchOptions.headers,
  };

  // Only set application/json if Content-Type is not explicitly removed or set to something else,
  // AND we are not passing FormData (which requires browser to set Content-Type with boundary)
  const isFormData = fetchOptions.body instanceof FormData;
  const hasContentType = Array.isArray(headers) 
    ? headers.some(([key]) => key.toLowerCase() === 'content-type')
    : headers instanceof Headers 
      ? headers.has('content-type')
      : Object.keys(headers as Record<string, string>).some(k => k.toLowerCase() === 'content-type');

  if (!isFormData && !hasContentType) {
    if (headers instanceof Headers) {
      headers.set('Content-Type', 'application/json');
    } else if (Array.isArray(headers)) {
      headers.push(['Content-Type', 'application/json']);
    } else {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw handleFetchError(error);
  }
}

export const http = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body), ...options }),

  put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body), ...options }),

  patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body), ...options }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
