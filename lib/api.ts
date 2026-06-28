/**
 * Thin client for the Python (FastAPI) backend.
 *
 * The browser reaches the API through the publicly mapped port
 * (NEXT_PUBLIC_API_BASE_URL); server-side rendering reaches it through the
 * internal compose network (API_INTERNAL_URL). Both fall back to localhost:8000
 * for plain local development.
 */
const BROWSER_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const SERVER_BASE = process.env.API_INTERNAL_URL || BROWSER_BASE

/** Base URL appropriate for the current execution context. */
export function apiBase(): string {
  return typeof window === 'undefined' ? SERVER_BASE : BROWSER_BASE
}

/** Build an absolute API URL from a path like `/personas/123/chat`. */
export function apiUrl(path: string): string {
  return `${apiBase()}${path}`
}

/** fetch() against the API. Same signature as fetch, but path-relative. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init)
}
