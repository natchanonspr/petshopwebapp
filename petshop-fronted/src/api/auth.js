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

  const data = await unwrap(
    res,
    'เข้าสู่ระบบ LINE ไม่สำเร็จ'
  )

  return data?.token || data
}