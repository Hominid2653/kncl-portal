import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiUrl, getApiBase } from '@/lib/api-base'

describe('api-base', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('normalizes trailing slashes from the API base URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api/v1///')
    expect(getApiBase()).toBe('https://api.example.com/api/v1')
  })

  it('falls back to the local API when env is unset', () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined)
    expect(getApiBase()).toBe('http://localhost:8000/api/v1')
  })

  it('joins paths without double slashes', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api/v1')
    expect(apiUrl('/players/')).toBe('https://api.example.com/api/v1/players/')
    expect(apiUrl('leagues/public')).toBe('https://api.example.com/api/v1/leagues/public')
  })
})
