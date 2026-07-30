import type { AuthSession } from '@/api/auth'

const SESSION_CACHE_KEY = 'kncl_session_cache_v1'

export function readSessionCache(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function writeSessionCache(session: AuthSession | null): void {
  try {
    if (!session) {
      sessionStorage.removeItem(SESSION_CACHE_KEY)
      return
    }
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session))
  } catch {
    // sessionStorage may be unavailable in private mode
  }
}
