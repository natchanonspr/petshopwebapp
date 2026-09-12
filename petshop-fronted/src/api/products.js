import { API_BASE, authHeaders, unwrap } from './http'

export async function getProducts() {
  const res = await fetch(`${API_BASE}/products/`, {
    headers: { ...authHeaders() },
  })
  const data = await unwrap(res, 'โหลดข้อมูลสินค้าไม่สำเร็จ')
  return Array.isArray(data) ? data : []
}

export async function getProduct(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสสินค้าไม่ถูกต้อง')
  }
  const res = await fetch(`${API_BASE}/products/${id}`, {
    headers: { ...authHeaders() },
  })
  return unwrap(res, 'โหลดข้อมูลสินค้าไม่สำเร็จ')
}

export async function createProduct(payload) {
  const res = await fetch(`${API_BASE}/products/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return unwrap(res, 'เพิ่มสินค้าไม่สำเร็จ')
}

export async function updateProduct(id, payload) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return unwrap(res, 'แก้ไขสินค้าไม่สำเร็จ')
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  return unwrap(res, 'ลบสินค้าไม่สำเร็จ')
}