import { API_BASE, apiFetch, unwrap } from './api'

export async function loginWithLine({
  lineUserId,
  displayName,
  pictureUrl,
}) {
  const res = await apiFetch(`${API_BASE}/auth/line`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_line_id: lineUserId,
      display_name: displayName,
      picture_url: pictureUrl || '',
    }),
  })

  const text = await res.text()

  let body = null

  try {
    body = JSON.parse(text)
  } catch {
    body = null
  }

  if (!res.ok) {
    console.error('LINE LOGIN API ERROR')
    console.error('Status:', res.status)
    console.error('Response:', body || text)

    throw new Error(
      body?.error ||
      body?.message ||
      'เข้าสู่ระบบ LINE ไม่สำเร็จ'
    )
  }

  console.log('LINE LOGIN RESPONSE:', body)

  if (!body?.token) {
    throw new Error('ไม่พบ token จาก Backend')
  }

  return body.token
}