export const API_BASE = import.meta.env.VITE_API_BASE || ''

export function ngrokHeaders() {
  return { 'ngrok-skip-browser-warning': 'true' }
}

export function authHeaders() {
  const token = localStorage.getItem('petshop_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...ngrokHeaders(),
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })
}

export async function unwrap(res, errorMessage = 'Request failed') {
  const text = await res.text()

  let body = null
  try {
    body = JSON.parse(text)
  } catch {
  }

  if (!res.ok) {
    console.error('API ERROR')
    console.error('URL:', res.url)
    console.error('Status:', res.status)
    console.error('Response:', body || text)
    throw new Error(body?.error || body?.message || errorMessage)
  }

  return body?.data
}
