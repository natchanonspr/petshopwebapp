import { API_BASE, apiFetch, unwrap } from './api'

export async function uploadPaymentSlip(orderId, file) {
  const formData = new FormData()

  formData.append('slip', file)

  const res = await apiFetch(
    `${API_BASE}/orders/${orderId}/payment-slip`,
    {
      method: 'POST',
      body: formData,
    },
  )

  return unwrap(
    res,
    'ไม่สามารถส่งหลักฐานการชำระเงินได้',
  )
}