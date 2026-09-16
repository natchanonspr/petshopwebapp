import {
  API_BASE,
  apiFetch,
  authHeaders,
  unwrap,
} from './api.js'

export async function getNotifications() {
  const res = await apiFetch(
    `${API_BASE}/notifications`,
    {
      method: 'GET',
      headers: {
        ...authHeaders(),
      },
    }
  )

  return unwrap(
    res,
    'ไม่สามารถโหลดการแจ้งเตือนได้'
  )
}

export async function markNotificationRead(notificationId) {
  const res = await apiFetch(
    `${API_BASE}/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(),
      },
    }
  )

  return unwrap(
    res,
    'ไม่สามารถอ่านการแจ้งเตือนได้'
  )
}

export async function markAllNotificationsRead() {
  const res = await apiFetch(
    `${API_BASE}/notifications/read-all`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(),
      },
    }
  )

  return unwrap(
    res,
    'ไม่สามารถอ่านการแจ้งเตือนทั้งหมดได้'
  )
}

export async function getUnreadNotificationCount() {
  const res = await apiFetch(
    `${API_BASE}/notifications/unread-count`,
    {
      method: 'GET',
      headers: {
        ...authHeaders(),
      },
    }
  )

  if (!res.ok) {
    throw new Error(
      'ไม่สามารถโหลดจำนวนการแจ้งเตือนได้'
    )
  }

  const body = await res.json()

  return Number(body?.count || 0)
}

// Admin: สร้างการแจ้งเตือน
export async function createAdminNotification(data) {
  const res = await apiFetch(
    `${API_BASE}/admin/notifications`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  return unwrap(
    res,
    'ไม่สามารถสร้างการแจ้งเตือนได้'
  )
}

// Admin: ดูประวัติการแจ้งเตือนที่ตัวเองสร้าง
export async function getAdminNotifications() {
  const res = await apiFetch(
    `${API_BASE}/admin/notifications`,
    {
      method: 'GET',
      headers: {
        ...authHeaders(),
      },
    }
  )

  return unwrap(
    res,
    'ไม่สามารถโหลดประวัติการแจ้งเตือนได้'
  )
}

// Admin: ล้างประวัติการแจ้งเตือน
export async function deleteAdminNotifications() {
  const res = await apiFetch(
    `${API_BASE}/admin/notifications`,
    {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    }
  )

  return unwrap(
    res,
    'ไม่สามารถล้างประวัติการแจ้งเตือนได้'
  )
}