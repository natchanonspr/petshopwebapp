import { API_BASE, apiFetch } from './api'

async function parseResponse(res) {
  const text = await res.text()

  let body = null

  try {
    body = JSON.parse(text)
  } catch {
    body = null
  }

  return { body, text }
}

// CUSTOMER
export async function getNotifications() {
  const res = await apiFetch(`${API_BASE}/notifications`)
  const { body } = await parseResponse(res)

  if (!res.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      'ไม่สามารถโหลดการแจ้งเตือนได้'
    )
  }

  return body
}

export async function getUnreadNotificationCount() {
  const res = await apiFetch(
    `${API_BASE}/notifications/unread-count`
  )

  const { body } = await parseResponse(res)

  if (!res.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      'ไม่สามารถโหลดจำนวนแจ้งเตือนได้'
    )
  }

  return body
}

export async function markNotificationRead(id) {
  const res = await apiFetch(
    `${API_BASE}/notifications/${id}/read`,
    {
      method: 'PATCH',
    }
  )

  const { body } = await parseResponse(res)

  if (!res.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      'ไม่สามารถอ่านการแจ้งเตือนได้'
    )
  }

  return body
}

export async function markAllNotificationsRead() {
  const res = await apiFetch(
    `${API_BASE}/notifications/read-all`,
    {
      method: 'PATCH',
    }
  )

  const { body } = await parseResponse(res)

  if (!res.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      'ไม่สามารถอ่านการแจ้งเตือนทั้งหมดได้'
    )
  }

  return body
}

// ADMIN
export async function getAdminNotifications() {
  const res = await apiFetch(
    `${API_BASE}/admin/notifications`
  )

  const { body } = await parseResponse(res)

  if (!res.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      'ไม่สามารถโหลดประวัติการแจ้งเตือนได้'
    )
  }

  return body
}

export async function createAdminNotification({
  audience = 'all',
  userId = null,
  type,
  title,
  detail,
  icon = '',
  orderId = null,
}) {
  const res = await apiFetch(
    `${API_BASE}/admin/notifications`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audience,
        user_id: userId,
        type,
        title,
        detail,
        icon,
        order_id: orderId,
      }),
    }
  )

  const { body } = await parseResponse(res)

  if (!res.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      'ไม่สามารถส่งการแจ้งเตือนได้'
    )
  }

  return body
}

export async function deleteAdminNotifications() {
  const res = await apiFetch(
    `${API_BASE}/admin/notifications`,
    {
      method: 'DELETE',
    }
  )

  const { body } = await parseResponse(res)

  if (!res.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      'ไม่สามารถล้างประวัติการแจ้งเตือนได้'
    )
  }

  return body
}