import { API_BASE, apiFetch, authHeaders, unwrap } from './api'

// สร้าง Order / Checkout
export async function createOrder({ addressId, paymentMethod }) {
  const res = await apiFetch(`${API_BASE}/orders/`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address_id: addressId,
      payment_method: paymentMethod,
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