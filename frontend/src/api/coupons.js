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

function toISODateTime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function toRequestPayload(form) {
  return {
    coupon_code: form.code, 
    coupon_title: form.title, 
    coupon_type: form.type,
    coupon_value: Number(form.coupon_value) || 0,
    min_order: Number(form.min) || 0,
    max_discount: form.maxDiscount === '' ? 0 : Number(form.maxDiscount) || 0,
    usage_limit: Number(form.limit) || 1,
    per_user_limit: Number(form.perUser) || 1,
    start_at: toISODateTime(form.start),
    expire_at: toISODateTime(form.expire),
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

// รายการคูปองที่เปิดใช้งาน ใช้โดย user ทั่วไป (เช่น แจ้งเตือนโปรโมชั่นเริ่ม/ใกล้หมดอายุ)
export async function getActiveCoupons() {
  const res = await apiFetch(`${API_BASE}/coupons/active`, {
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

// ตรวจสอบ/คำนวณส่วนลดของโค้ด ใช้ตอน checkout
export async function applyCoupon(code, subtotal) {
  const res = await apiFetch(`${API_BASE}/coupons/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ coupon_code: code, subtotal }),
  })

  if (!res.ok) {
    return { ok: false, reason: 'ตรวจสอบโค้ดส่วนลดไม่สำเร็จ' }
  }

  const result = await res.json()
  return {
    ok: result.ok,
    reason: result.reason || '',
    code: result.code || '',
    amount: result.amount || 0,
    freeShipping: Boolean(result.free_shipping),
    min: result.min || 0,
    maxDiscount: result.max_discount || 0,
    perUser: result.per_user || 1,
  }
}