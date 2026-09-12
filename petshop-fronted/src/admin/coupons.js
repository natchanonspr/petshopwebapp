import { addNotification } from '../lib/notifications.js'

const KEY = 'petshop_admin_coupons_v1'
const NOTICE_KEY = 'petshop_coupon_notice_markers_v1'

const fallback = [
  { id: 'CP001', code: 'PETLOVE20', title: 'ลด 20% สำหรับอาหารสัตว์', type: 'เปอร์เซ็นต์', value: 20, used: 42, limit: 100, start: '2026-09-01T00:00', expire: '2026-09-30T23:59', active: true },
  { id: 'CP002', code: 'WELCOME100', title: 'สมาชิกใหม่ลด 100 บาท', type: 'ส่วนลดคงที่', value: 100, used: 18, limit: 200, start: '2026-09-01T00:00', expire: '2026-10-31T23:59', active: true },
  { id: 'CP003', code: 'FREESHIP', title: 'ส่งฟรีเมื่อซื้อครบ 500 บาท', type: 'ค่าส่ง', value: 0, used: 76, limit: 100, start: '2026-08-01T00:00', expire: '2026-09-15T23:59', active: false },
]

export function getCoupons() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null')
    return Array.isArray(value) ? value : fallback
  } catch { return fallback }
}

export function saveCoupons(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('petshop-coupons-updated'))
  window.dispatchEvent(new Event('petshop-admin-data-updated'))
  return items
}

export function getCoupon(code, subtotal = 0, now = new Date()) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) return { ok: false, reason: 'กรุณากรอกรหัสโปรโมชั่น' }
  const coupon = getCoupons().find(item => String(item.code).toUpperCase() === normalized)
  if (!coupon) return { ok: false, reason: 'ไม่พบโค้ดส่วนลดนี้' }
  if (!coupon.active) return { ok: false, reason: 'โปรโมชั่นนี้ปิดใช้งานอยู่' }
  if (coupon.start && now < new Date(coupon.start)) return { ok: false, reason: 'โปรโมชั่นนี้ยังไม่เริ่ม' }
  if (coupon.expire && now > new Date(coupon.expire)) return { ok: false, reason: 'โปรโมชั่นนี้หมดอายุแล้ว' }
  if (Number(coupon.limit) > 0 && Number(coupon.used || 0) >= Number(coupon.limit)) return { ok: false, reason: 'สิทธิ์โปรโมชั่นถูกใช้ครบแล้ว' }
  const min = Number(coupon.min || 0)
  if (Number(subtotal) < min) return { ok: false, reason: `ยอดสั่งซื้อขั้นต่ำ ฿${min.toLocaleString()} สำหรับโค้ด ${normalized}` }
  let amount = coupon.type === 'เปอร์เซ็นต์' ? Math.min(Number(subtotal) * Number(coupon.value || 0) / 100, Number(subtotal)) : Math.min(Number(coupon.value || 0), Number(subtotal))
  if (coupon.type === 'เปอร์เซ็นต์' && Number(coupon.maxDiscount || 0) > 0) amount = Math.min(amount, Number(coupon.maxDiscount))
  return { ok: true, coupon, code: normalized, amount, freeShipping: coupon.type === 'ค่าส่ง', min, maxDiscount: Number(coupon.maxDiscount || 0), perUser: Number(coupon.perUser || 1), newMemberOnly: Boolean(coupon.newMemberOnly), category: coupon.category || 'ทุกหมวดหมู่' }
}

export function consumeCoupon(code) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) return
  saveCoupons(getCoupons().map(item => String(item.code).toUpperCase() === normalized ? { ...item, used: Number(item.used || 0) + 1 } : item))
}

export function processScheduledCouponNotifications(now = new Date()) {
  let markers = {}
  try { markers = JSON.parse(localStorage.getItem(NOTICE_KEY) || '{}') || {} } catch {}
  let changed = false
  getCoupons().forEach(coupon => {
    if (!coupon.active || !coupon.id) return
    const start = coupon.start ? new Date(coupon.start) : null
    const end = coupon.expire ? new Date(coupon.expire) : null
    if (start && now >= start && !markers[`start:${coupon.id}`]) {
      addNotification({ type:'promo', icon:'fa-tag', title:`โปรโมชั่น ${coupon.code} เริ่มแล้ว 🎉`, detail:coupon.title || `ใช้โค้ด ${coupon.code} เพื่อรับสิทธิ์ส่วนลด` })
      markers[`start:${coupon.id}`] = now.toISOString(); changed = true
    }
    if (end) {
      const hours = (end.getTime() - now.getTime()) / 3600000
      if (hours > 0 && hours <= 24 && !markers[`ending:${coupon.id}`]) {
        addNotification({ type:'promo', icon:'fa-clock', title:`โปรโมชั่น ${coupon.code} ใกล้หมดอายุ ⏰`, detail:`เหลือเวลาไม่ถึง 24 ชั่วโมง · ${coupon.title || 'รีบใช้สิทธิ์ก่อนหมดอายุ'}` })
        markers[`ending:${coupon.id}`] = now.toISOString(); changed = true
      }
    }
  })
  if (changed) localStorage.setItem(NOTICE_KEY, JSON.stringify(markers))
}

export { KEY as COUPONS_STORAGE_KEY }
