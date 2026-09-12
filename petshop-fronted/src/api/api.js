export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export function authHeaders() {
  const token = localStorage.getItem('petshop_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function unwrap(res, errorMessage = 'Request failed') {
  const text = await res.text()

  let body = null
  try {
    body = JSON.parse(text)
  } catch {
    // response ไม่ใช่ JSON
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