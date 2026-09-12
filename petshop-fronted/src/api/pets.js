const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

function authHeaders() {
  const token = localStorage.getItem('petshop_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// backend ห่อ response เป็น { message?, data?, error? } เสมอ (ยกเว้น error บาง endpoint ที่ตอบ plain text)
async function unwrap(res, errorMessage = 'Request failed') {
  const text = await res.text()

  let body = null
  try {
    body = JSON.parse(text)
  } catch {
    // response ไม่ใช่ JSON (เช่น plain "Bad Request" จาก c.SendStatus)
  }

  if (!res.ok) {
    console.error('API ERROR')
    console.error('URL:', res.url)
    console.error('Status:', res.status)
    console.error('Response:', body || text)

    throw new Error(body?.error || body?.message || errorMessage)
  }

  // ทุก endpoint ของ pet ห่อข้อมูลจริงไว้ใน key "data" เสมอ (ดู pet/handler.go)
  return body?.data
}

export async function getPets() {
  const res = await fetch(`${API_BASE}/pets/`, {
    headers: { ...authHeaders() },
  })

  const data = await unwrap(res, 'โหลดข้อมูลสัตว์เลี้ยงไม่สำเร็จ')
  return Array.isArray(data) ? data : []
}

export async function getPet(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสสัตว์เลี้ยงไม่ถูกต้อง')
  }

  const res = await fetch(`${API_BASE}/pets/${id}`, {
    headers: { ...authHeaders() },
  })

  return unwrap(res, 'โหลดข้อมูลสัตว์เลี้ยงไม่สำเร็จ')
}

export async function createPet(petData) {
  const res = await fetch(`${API_BASE}/pets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(petData),
  })

  return unwrap(res, 'เพิ่มข้อมูลสัตว์เลี้ยงไม่สำเร็จ')
}

export async function updatePet(id, petData) {
  const res = await fetch(`${API_BASE}/pets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(petData),
  })

  return unwrap(res, 'แก้ไขข้อมูลสัตว์เลี้ยงไม่สำเร็จ')
}

export async function deletePet(id) {
  const res = await fetch(`${API_BASE}/pets/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })

  return unwrap(res, 'ลบข้อมูลสัตว์เลี้ยงไม่สำเร็จ')
}
