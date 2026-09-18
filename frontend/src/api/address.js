import { API_BASE, apiFetch, authHeaders, unwrap } from './api'

// ดึงที่อยู่ทั้งหมดของ User
export async function getAddresses() {
  const res = await apiFetch(`${API_BASE}/addresses/`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'โหลดข้อมูลที่อยู่ไม่สำเร็จ')
}

// ดึงที่อยู่เดียว
export async function getAddress(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสที่อยู่ไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/addresses/${id}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'โหลดข้อมูลที่อยู่ไม่สำเร็จ')
}

// เพิ่มที่อยู่
export async function createAddress(addressData) {
  const res = await apiFetch(`${API_BASE}/addresses/`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient_name: addressData.recipientName,
      phone: addressData.phone,
      address_line: addressData.addressLine,
      subdistrict: addressData.subdistrict,
      district: addressData.district,
      province: addressData.province,
      postal_code: addressData.postalCode,
      is_default: addressData.isDefault,
    }),
  })

  return unwrap(res, 'เพิ่มที่อยู่ไม่สำเร็จ')
}

// แก้ไขที่อยู่
export async function updateAddress(id, addressData) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสที่อยู่ไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/addresses/${id}`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient_name: addressData.recipientName,
      phone: addressData.phone,
      address_line: addressData.addressLine,
      subdistrict: addressData.subdistrict,
      district: addressData.district,
      province: addressData.province,
      postal_code: addressData.postalCode,
      is_default: addressData.isDefault,
    }),
  })

  return unwrap(res, 'แก้ไขที่อยู่ไม่สำเร็จ')
}

// ลบที่อยู่
export async function deleteAddress(id) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('รหัสที่อยู่ไม่ถูกต้อง')
  }

  const res = await apiFetch(`${API_BASE}/addresses/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrap(res, 'ลบที่อยู่ไม่สำเร็จ')
}