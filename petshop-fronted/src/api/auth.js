const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export async function loginWithLine({ lineUserId, displayName, pictureUrl }) {
  const res = await fetch(`${API_BASE}/auth/line`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line_user_id: lineUserId,
      display_name: displayName,
      picture_url: pictureUrl,
    }),
  })

  let body = null
  try {
    body = await res.json()
  } catch {
    // ไม่มี body
  }

  if (!res.ok || !body?.token) {
    throw new Error(body?.error || 'เข้าสู่ระบบไม่สำเร็จ')
  }

  return body.token
}
