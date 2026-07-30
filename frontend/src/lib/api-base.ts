/** Normalized API root without a trailing slash (e.g. https://host/api/v1). */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
  return raw.replace(/\/+$/, '')
}

/** Join API base with a path segment, avoiding double slashes. */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBase()}${normalizedPath}`
}
