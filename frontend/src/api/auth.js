// =========================
// Authentication API: Login, Register และการจัดการข้อมูลการเข้าสู่ระบบ
// =========================
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

export async function register({
  username,
  email,
  phone,
  password,
}) {
  const res = await apiFetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      email,
      phone,
      password,
    }),
  })

  return unwrap(res, 'สมัครสมาชิกไม่สำเร็จ')
}

export async function login({
  userPhone,
  userPassword,
}) {
  const res = await apiFetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: userPhone,
      password: userPassword,
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
    console.error('LOGIN API ERROR')
    console.error('URL:', res.url)
    console.error('STATUS:', res.status)
    console.error('RESPONSE:', body || text)

    throw new Error(
      body?.error ||
      body?.message ||
      `เข้าสู่ระบบไม่สำเร็จ (${res.status})`
    )
  }

  if (!body?.token) {
    throw new Error('ไม่พบ token จาก Backend')
  }

  return body.token
}

export async function requestPasswordResetOTP(phone) {
  const response = await fetch(
    `${API_BASE}/auth/forgot-password/request`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
      }),
    },
  )

  const body = await response.json()

  if (!response.ok) {
    throw new Error(
      body?.error || 'ไม่สามารถขอ OTP ได้',
    )
  }

  return body
}

export async function verifyPasswordResetOTP(phone, otp) {
  const response = await fetch(
    `${API_BASE}/auth/forgot-password/verify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        otp,
      }),
    },
  )

  const body = await response.json()

  if (!response.ok) {
    throw new Error(
      body?.error || 'OTP ไม่ถูกต้อง',
    )
  }

  return body
}

export async function resetPassword(phone, newPassword) {
  const response = await fetch(
    `${API_BASE}/auth/forgot-password/reset`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        new_password: newPassword,
      }),
    },
  )

  const body = await response.json()

  if (!response.ok) {
    throw new Error(
      body?.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้',
    )
  }

  return body
}
