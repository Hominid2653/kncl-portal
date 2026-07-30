/**
 * API feature flags — set VITE_USE_API=true to call FastAPI instead of mocks.
 * Restart the Vite dev server after changing .env.
 */

import type { MockUser } from '@/types'

export const USE_API = import.meta.env.VITE_USE_API === 'true'
export const API_MOCK = import.meta.env.VITE_API_MOCK !== 'false' && !USE_API

const TOKEN_KEY = 'kncl_access_token'
const MOCK_ROLE_KEY = 'kncl_mock_role'
const MOCK_USER_ID_KEY = 'kncl_mock_user_id'
const MOCK_EMAIL_KEY = 'kncl_mock_email'

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  clearDevMockHeaders()
}

export function setDevMockUser(user: Pick<MockUser, 'id' | 'email' | 'role'>): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.setItem(MOCK_ROLE_KEY, user.role)
  localStorage.setItem(MOCK_USER_ID_KEY, user.id)
  localStorage.setItem(MOCK_EMAIL_KEY, user.email)
}

export function hasApiSession(): boolean {
  return Boolean(getAccessToken() || localStorage.getItem(MOCK_ROLE_KEY))
}

export function clearBearerToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function clearAuthSession(): void {
  clearBearerToken()
  clearDevMockHeaders()
}

/** Use mock seed data offline; empty collections when the API is enabled. */
export function apiSeed<T>(mockValue: T, apiEmpty: T): T {
  return USE_API ? apiEmpty : mockValue
}

function clearDevMockHeaders(): void {
  localStorage.removeItem(MOCK_ROLE_KEY)
  localStorage.removeItem(MOCK_USER_ID_KEY)
  localStorage.removeItem(MOCK_EMAIL_KEY)
}

/** Bearer token or backend dev mock headers (AUTH_MOCK_ENABLED). */
export function getApiAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }

  const role = localStorage.getItem(MOCK_ROLE_KEY)
  if (!role) {
    return {}
  }

  const headers: Record<string, string> = { 'X-Mock-Role': role }
  const userId = localStorage.getItem(MOCK_USER_ID_KEY)
  const email = localStorage.getItem(MOCK_EMAIL_KEY)
  if (userId) headers['X-Mock-User-ID'] = userId
  if (email) headers['X-Mock-Email'] = email
  return headers
}
