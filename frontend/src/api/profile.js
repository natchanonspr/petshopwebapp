import { API_BASE, apiFetch, authHeaders, unwrap } from './api'

export async function getProfile() {
  const res = await apiFetch(`${API_BASE}/profile/`, {
    method: 'GET',
    headers: authHeaders(),
  })

  return unwrap(res, 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ')
}

export async function updateProfile({
  name,
  phone,
  email,
  password = '',
  pictureUrl = '',
}) {
  const res = await apiFetch(`${API_BASE}/profile/`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: name,
      phone,
      email,
      password,
      picture_url: pictureUrl,
    }),
  })

  return unwrap(res, 'บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ')
}