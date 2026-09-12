import { API_BASE, authHeaders, unwrap } from './api'

function mapProduct(p) {
  return {
    id: p.product_id,
    name: p.product_name,
    price: p.product_price,
    image: p.product_image,
    stock: p.product_stock,
    status: p.product_status,
    categoryId: p.category_id, // TODO: ยังไม่มี endpoint category → ยังไม่มีชื่อหมวดให้โชว์
    icon: 'fa-box', // fallback ตายตัว ไม่มาจาก backend
  }
}

export async function getProducts() {
  const res = await fetch(`${API_BASE}/products/`, {
    headers: { ...authHeaders() },
  })
  const data = await unwrap(res, 'โหลดข้อมูลสินค้าไม่สำเร็จ')
  return Array.isArray(data) ? data.map(mapProduct) : []
}

export async function getProduct(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสสินค้าไม่ถูกต้อง')
  }
  const res = await fetch(`${API_BASE}/products/${id}`, {
    headers: { ...authHeaders() },
  })
  const data = await unwrap(res, 'โหลดข้อมูลสินค้าไม่สำเร็จ')
  return data ? mapProduct(data) : null
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
  return unwrap(
    await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    }),
    'ลบสินค้าไม่สำเร็จ',
  )
}