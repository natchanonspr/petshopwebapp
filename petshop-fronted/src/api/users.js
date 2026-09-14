import {
  API_BASE,
  apiFetch,
  authHeaders,
  unwrap,
} from './api'

// Admin: ดึงลูกค้าทั้งหมด
export async function getAdminUsers() {
  const res = await apiFetch(
    `${API_BASE}/admin/users/`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  )

  return unwrap(
    res,
    'โหลดข้อมูลลูกค้าไม่สำเร็จ',
  )
}

// Admin: ดึงลูกค้ารายเดียว
export async function getAdminUser(id) {
  if (
    !id ||
    id === 'undefined' ||
    id === 'null'
  ) {
    throw new Error(
      'รหัสผู้ใช้งานไม่ถูกต้อง',
    )
  }

  const res = await apiFetch(
    `${API_BASE}/admin/users/${id}`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  )

  return unwrap(
    res,
    'โหลดข้อมูลลูกค้าไม่สำเร็จ',
  )
}

// Admin: ลบลูกค้า
export async function deleteAdminUser(id) {
  if (
    !id ||
    id === 'undefined' ||
    id === 'null'
  ) {
    throw new Error(
      'รหัสผู้ใช้งานไม่ถูกต้อง',
    )
  }

  const res = await apiFetch(
    `${API_BASE}/admin/users/${id}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  )

  return unwrap(
    res,
    'ลบลูกค้าไม่สำเร็จ',
  )
}

export async function updateAdminUserRole(
  id,
  role,
) {
  if (
    !id ||
    id === 'undefined' ||
    id === 'null'
  ) {
    throw new Error(
      'รหัสผู้ใช้งานไม่ถูกต้อง',
    )
  }

  if (!['user', 'admin'].includes(role)) {
    throw new Error(
      'Role ไม่ถูกต้อง',
    )
  }

  const res = await apiFetch(
    `${API_BASE}/admin/users/${id}/role`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(),
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        role,
      }),
    },
  )

  return unwrap(
    res,
    'เปลี่ยนสิทธิ์ผู้ใช้งานไม่สำเร็จ',
  )
}