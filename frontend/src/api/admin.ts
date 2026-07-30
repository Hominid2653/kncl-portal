import { apiRequest } from '@/api/client'
import { USE_API } from '@/lib/api-config'

export async function createLeague(payload: { name: string; description?: string }) {
  if (!USE_API) return null
  return apiRequest('/leagues/', { method: 'POST', body: payload })
}

export async function createNotification(payload: {
  user_profile_id: string
  title: string
  message: string
}) {
  if (!USE_API) return null
  return apiRequest('/notifications/', { method: 'POST', body: payload })
}

export async function uploadDocument(formData: FormData) {
  if (!USE_API) return null
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
  const { getApiAuthHeaders } = await import('@/lib/api-config')
  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: getApiAuthHeaders(),
    body: formData,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(payload.message ?? 'Upload failed')
  }
  return response.json()
}
