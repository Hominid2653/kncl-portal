/**
 * HTTP client for Phase 8 API wiring.
 * Set VITE_API_BASE_URL (e.g. http://localhost:8000/api/v1).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
  emailVerificationToken?: string | null
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, emailVerificationToken } = options
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (emailVerificationToken) {
    headers.Authorization = `Bearer ${emailVerificationToken}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => ({})) as {
    message?: string
    error_code?: string
    detail?: string | { message?: string }
  }

  if (!response.ok) {
    const message =
      payload.message ??
      (typeof payload.detail === 'string' ? payload.detail : payload.detail?.message) ??
      `Request failed (${response.status})`
    throw new ApiError(message, response.status, payload.error_code)
  }

  return payload as T
}

export { API_BASE }
