import { apiRequest } from '@/api/client'
import { apiUrl } from '@/lib/api-base'
import { setAccessToken, USE_API } from '@/lib/api-config'
import type { MockUser, UserRole } from '@/types'

export interface AuthSession {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  club_id?: string | null
  club_name?: string | null
  player_id?: string | null
  league_ids?: string[]
}

export function mapSessionToUser(session: AuthSession): MockUser {
  return {
    id: session.id,
    email: session.email,
    firstName: session.first_name,
    lastName: session.last_name,
    role: session.role,
    clubId: session.club_id ?? undefined,
    clubName: session.club_name ?? undefined,
    playerId: session.player_id ?? undefined,
    leagueIds: session.league_ids,
  }
}

export async function loginWithPassword(email: string, password: string) {
  if (!USE_API) return null

  const body = new URLSearchParams({ username: email, password })
  const response = await fetch(apiUrl('/auth/token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const payload = await response.json().catch(() => ({})) as {
    access_token?: string
    detail?: string
    message?: string
    error?: { message?: string }
  }

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.message ?? payload.error?.message ?? payload.detail ?? 'Invalid email or password.',
    )
  }

  setAccessToken(payload.access_token)
  return { access_token: payload.access_token, token_type: 'bearer' as const }
}

export async function fetchCurrentSession() {
  if (!USE_API) return null
  return apiRequest<AuthSession>('/auth/me')
}

export async function requestPasswordReset(email: string) {
  if (!USE_API) return null
  return apiRequest<void>('/auth/password-reset/request', {
    method: 'POST',
    body: { email },
    public: true,
  })
}

export async function confirmPasswordReset(password: string, recoveryToken: string) {
  if (!USE_API) return null
  return apiRequest<void>('/auth/password-reset/confirm', {
    method: 'POST',
    body: { password },
    token: recoveryToken,
  })
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (!USE_API) return null
  return apiRequest<void>('/auth/password/change', {
    method: 'POST',
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  })
}

export async function requestOtp(email: string, purpose: 'APPLICATION_SUBMIT' | 'STATUS_LOOKUP') {
  if (!USE_API) return null
  return apiRequest<void>('/auth/otp/request', {
    method: 'POST',
    body: { email, purpose },
    public: true,
  })
}

export async function verifyOtp(email: string, code: string, purpose: 'APPLICATION_SUBMIT' | 'STATUS_LOOKUP') {
  if (!USE_API) return null
  return apiRequest<{ email_verification_token: string }>('/auth/otp/verify', {
    method: 'POST',
    body: { email, code, purpose },
    public: true,
  })
}
