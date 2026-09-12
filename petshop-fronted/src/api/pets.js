import { API_BASE, authHeaders, unwrap } from './http'

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
