import { API_BASE, authHeaders, apiFetch, unwrap } from './api'

function mapProduct(p) {
  return {
    id: p.product_id,
    categoryId: p.category_id,
    name: p.product_name,
    price: p.product_price,
    kcalPer100g: p.product_kcal_per_100g ?? 0,
    image: p.product_image || '',
    stock: p.product_stock,
    status: p.product_status,
    category: p.category_name || '',
    description: p.description || '',

    // ADMIN
    subtitle: '',
    badge: '',
    highlights: [],
    variants: [],
    defaultSize: '',
    rating: '0.0',
    reviews: 0,
    sold: 0,
  }
}

export async function getProducts() {
  const res = await apiFetch(`${API_BASE}/products/`)
  const data = await unwrap(res, 'โหลดข้อมูลสินค้าไม่สำเร็จ')
  return Array.isArray(data) ? data.map(mapProduct) : []
}

export async function getProduct(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสสินค้าไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/products/${id}`, {
    headers: { ...authHeaders() },
  })

  const data = await unwrap(res, 'โหลดข้อมูลสินค้าไม่สำเร็จ')
  return data ? mapProduct(data) : null
}

export async function createProduct(payload) {
  const res = await apiFetch(`${API_BASE}/products/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })

  return unwrap(res, 'เพิ่มสินค้าไม่สำเร็จ')
}

export async function updateProduct(id, payload) {
  const res = await apiFetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })

  return unwrap(res, 'แก้ไขสินค้าไม่สำเร็จ')
}

export async function deleteProduct(id) {
  return unwrap(
    await apiFetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    }),
    'ลบสินค้าไม่สำเร็จ',
  )
}