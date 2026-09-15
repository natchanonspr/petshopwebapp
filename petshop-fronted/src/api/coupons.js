import { API_BASE, authHeaders, apiFetch, unwrap } from './api'

// แปลงรูปแบบวันเวลาจาก backend ("2026-09-01T00:00:00Z") ให้ตรงกับ
// input type="datetime-local" ("2026-09-01T00:00")
function toDateTimeLocal(value) {
  if (!value) return ''
  return value.slice(0, 16)
}

function mapCoupon(c) {
  return {
    id: c.coupon_id,
    code: c.coupon_code,
    title: c.coupon_title,
    type: c.coupon_type,
    value: c.coupon_value,
    min: c.min_order,
    maxDiscount: c.max_discount,
    limit: c.usage_limit,
    perUser: c.per_user_limit,
    used: c.used_count,
    start: toDateTimeLocal(c.start_at),
    expire: toDateTimeLocal(c.expire_at),
    active: c.active,
  }
}

function toRequestPayload(form) {
  return {
    code: form.coupon_code,
    title: form.coupon_title,
    coupon_type: form.coupon_type,
    value: Number(form.coupon_value) || 0,
    min_order: Number(form.min) || 0,
    max_discount: form.maxDiscount === '' ? 0 : Number(form.maxDiscount) || 0,
    usage_limit: Number(form.limit) || 1,
    per_user_limit: Number(form.perUser) || 1,
    start_at: form.start,
    expire_at: form.expire,
    active: form.active !== undefined ? form.active : true,
  }
}

export async function getCoupons() {
  const res = await apiFetch(`${API_BASE}/coupons/`, {
    headers: { ...authHeaders() },
  })
  const data = await unwrap(res, 'โหลดข้อมูลโปรโมชั่นไม่สำเร็จ')
  return Array.isArray(data) ? data.map(mapCoupon) : []
}

export async function createCoupon(form) {
  const res = await apiFetch(`${API_BASE}/coupons/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(toRequestPayload(form)),
  })
  const data = await unwrap(res, 'สร้างโปรโมชั่นไม่สำเร็จ')
  return mapCoupon(data)
}

export async function updateCoupon(id, form) {
  const res = await apiFetch(`${API_BASE}/coupons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(toRequestPayload(form)),
  })
  const data = await unwrap(res, 'แก้ไขโปรโมชั่นไม่สำเร็จ')
  return mapCoupon(data)
}

export async function deleteCoupon(id) {
  return unwrap(
    await apiFetch(`${API_BASE}/coupons/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    }),
    'ลบโปรโมชั่นไม่สำเร็จ',
  )
}