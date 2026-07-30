/**
 * HTTP client for FastAPI backend.
 * Set VITE_API_BASE_URL (e.g. http://localhost:8000/api/v1).
 */

import { getApiAuthHeaders } from '@/lib/api-config'
import { apiUrl, getApiBase } from '@/lib/api-base'

const API_BASE = getApiBase()

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
  emailVerificationToken?: string | null
  /** Skip auto-attached session headers (public endpoints). */
  public?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, emailVerificationToken, public: isPublic = false } = options
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(isPublic ? {} : getApiAuthHeaders()),
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

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json().catch(() => ({})) as {
    message?: string
    error_code?: string
    detail?: string | { message?: string }
    error?: { message?: string; code?: string }
  }

  if (!response.ok) {
    const message =
      payload.message ??
      payload.error?.message ??
      (typeof payload.detail === 'string' ? payload.detail : payload.detail?.message) ??
      `Request failed (${response.status})`
    throw new ApiError(message, response.status, payload.error_code ?? payload.error?.code)
  }

  return payload as T
}

export { API_BASE }
