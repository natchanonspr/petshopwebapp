import { API_BASE, apiFetch, authHeaders, unwrap } from './api'

// สร้าง Order / Checkout
export async function createOrder({ addressId, paymentMethod, couponCode }) {
  const res = await apiFetch(`${API_BASE}/orders/`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address_id: addressId,
      payment_method: paymentMethod,
      coupon_code: couponCode || '',
    }),
  })

  return unwrap(res, 'สร้างคำสั่งซื้อไม่สำเร็จ')
}

// ดึง Order ทั้งหมดของ User
export async function getOrders() {
  const res = await apiFetch(`${API_BASE}/orders/`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'โหลดคำสั่งซื้อไม่สำเร็จ')
}

// ดึง Order เดียว
export async function getOrder(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสคำสั่งซื้อไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/orders/${id}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'โหลดรายละเอียดคำสั่งซื้อไม่สำเร็จ')
}

// ยกเลิก Order
export async function cancelOrder(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสคำสั่งซื้อไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/orders/${id}/cancel`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'ยกเลิกคำสั่งซื้อไม่สำเร็จ')
}

// Admin: ดึง Order ทั้งหมด
export async function getAdminOrders() {
  const res = await apiFetch(`${API_BASE}/admin/orders/`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'โหลดรายการคำสั่งซื้อไม่สำเร็จ')
}

// Admin: ดึงรายละเอียด Order
export async function getAdminOrder(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสคำสั่งซื้อไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/admin/orders/${id}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'โหลดรายละเอียดคำสั่งซื้อไม่สำเร็จ')
}

// Admin: เปลี่ยนสถานะ Order
export async function updateAdminOrderStatus(id, status) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสคำสั่งซื้อไม่ถูกต้อง')
  }

  const validStatuses = [
    'pending',
    'confirmed',
    'shipped',
    'deliveried',
    'cancelled',
  ]

  if (!validStatuses.includes(status)) {
    throw new Error('สถานะคำสั่งซื้อไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
    }),
  })

  return unwrap(res, 'เปลี่ยนสถานะคำสั่งซื้อไม่สำเร็จ')
}