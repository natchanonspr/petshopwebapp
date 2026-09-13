import { API_BASE, apiFetch, authHeaders, unwrap } from './api'

// ดึงหมวดหมู่ทั้งหมด
export async function getCategories() {
  const res = await apiFetch(`${API_BASE}/categories`, {
    method: 'GET',
  })

  return unwrap(res, 'โหลดข้อมูลหมวดหมู่ไม่สำเร็จ')
}

// ดึงหมวดหมู่เดียว
export async function getCategory(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสหมวดหมู่ไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/categories/${id}`, {
    method: 'GET',
  })

  return unwrap(res, 'โหลดข้อมูลหมวดหมู่ไม่สำเร็จ')
}

// เพิ่มหมวดหมู่
export async function createCategory(categoryName) {
  const res = await apiFetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category_name: categoryName,
    }),
  })

  return unwrap(res, 'เพิ่มหมวดหมู่ไม่สำเร็จ')
}

// แก้ไขหมวดหมู่
export async function updateCategory(id, categoryName) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสหมวดหมู่ไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category_name: categoryName,
    }),
  })

  return unwrap(res, 'แก้ไขหมวดหมู่ไม่สำเร็จ')
}

// ลบหมวดหมู่
export async function deleteCategory(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสหมวดหมู่ไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'ลบหมวดหมู่ไม่สำเร็จ')
}