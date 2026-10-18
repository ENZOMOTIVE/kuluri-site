// Base HTTP client for the Kuluri API.
// During development / prototype phase, VITE_API_BASE is unset and the client
// resolves requests from the local mock data layer instead of a real server.
import { useAuthStore } from '../stores/auth.js'

const BASE = import.meta.env.VITE_API_BASE ?? null

async function request(method, path, body) {
  if (!BASE) {
    throw new Error(`[api] No VITE_API_BASE set — use mock data layer (services return local data)`)
  }
  const auth = useAuthStore()
  const headers = { 'Content-Type': 'application/json' }
  // Attach Privy JWT when available (backend validates against Privy public keys)
  if (auth.user?.id) {
    const token = localStorage.getItem('privy:token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
}
