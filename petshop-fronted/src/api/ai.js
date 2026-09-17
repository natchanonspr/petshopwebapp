import { API_BASE, authHeaders, apiFetch, unwrap } from './api'

export async function getRecommendations(petId) {
  const res = await apiFetch(
    `${API_BASE}/ai/recommendations?pet_id=${petId}`,
    {
      headers: {
        ...authHeaders(),
      },
    },
  )

  return unwrap(res, 'ขอคำแนะนำจาก AI ไม่สำเร็จ')
}

export async function getRecommendationHistory(petId) {
  const query = petId
    ? `?pet_id=${encodeURIComponent(petId)}`
    : ''

  const res = await apiFetch(
    `${API_BASE}/ai/history${query}`,
  )

  return unwrap(res, 'ไม่สามารถโหลดประวัติ AI ได้')
}