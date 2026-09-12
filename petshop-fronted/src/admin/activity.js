const KEY = 'petshop_customer_activity_v1'

export function getActivity() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

export function logActivity(type, detail = '', meta = {}) {
  const rawId = localStorage.getItem('petshop_customer_id') || localStorage.getItem('petshop_current_user_id')
  const customerId = Number(rawId) || null
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    customerId,
    type,
    detail,
    ...meta,
    createdAt: new Date().toISOString(),
  }
  const next = [item, ...getActivity()].slice(0, 500)
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('petshop-activity-updated'))
  return item
}

export function clearActivity() {
  localStorage.setItem(KEY, '[]')
  window.dispatchEvent(new CustomEvent('petshop-activity-updated'))
}

export { KEY as ACTIVITY_STORAGE_KEY }
