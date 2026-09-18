import { API_BASE, authHeaders, apiFetch, unwrap } from './api'

// ดึง Cart ทั้งหมดของ User ที่ Login อยู่
export async function getCart() {
  const res = await apiFetch(`${API_BASE}/cart/`, {
    method: 'GET',
    headers: authHeaders(),
  })

  return unwrap(res, 'โหลดตะกร้าไม่สำเร็จ')
}

// เพิ่มสินค้าเข้าตะกร้า
export async function addToCart({ productId, cartQuantity }) {
  const res = await apiFetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      cart_quantity: cartQuantity,
    }),
  })

  return unwrap(res, 'เพิ่มสินค้าลงตะกร้าไม่สำเร็จ')
}

// แก้จำนวนสินค้าในตะกร้า
export async function updateCartItem(itemId, { cartQuantity }) {
  const res = await apiFetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cart_quantity: cartQuantity,
    }),
  })

  return unwrap(res, 'แก้ไขจำนวนสินค้าไม่สำเร็จ')
}

// ลบสินค้าออกจากตะกร้า
export async function removeCartItem(itemId) {
  const res = await apiFetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  return unwrap(res, 'ลบสินค้าออกจากตะกร้าไม่สำเร็จ')
}