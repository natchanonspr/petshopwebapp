import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import { getNotifications, markAllNotificationsRead, markNotificationRead, subscribeNotifications } from '../../lib/notifications.js'

const initialNotifications = [
  { id: 1, type: 'order', icon: 'fa-box-open', title: 'คำสั่งซื้อของคุณกำลังจัดส่ง', detail: 'Royal Canin Adult 3kg กำลังเดินทางมาหาคุณ', time: '10 นาทีที่แล้ว', unread: true },
  { id: 2, type: 'promo', icon: 'fa-tag', title: 'คูปองส่วนลด 10% รอคุณอยู่', detail: 'ใช้โค้ด PAWPAL10 ลดสูงสุด 100 บาท', time: '1 ชั่วโมงที่แล้ว', unread: true },
  { id: 3, type: 'pet', icon: 'fa-heart', title: 'ถึงเวลาดูแลน้องแล้ว 🐾', detail: 'อย่าลืมเตรียมอาหารมื้อถัดไปให้น้องนะ', time: '3 ชั่วโมงที่แล้ว', unread: true },
  { id: 4, type: 'order', icon: 'fa-circle-check', title: 'คำสั่งซื้อสำเร็จแล้ว', detail: 'ขอบคุณที่ใช้บริการ Pet Shop ของเรา', time: 'เมื่อวาน', unread: false },
  { id: 5, type: 'system', icon: 'fa-wand-magic-sparkles', title: 'ลองใช้ AI แนะนำอาหาร', detail: 'ให้ AI ช่วยเลือกอาหารที่เหมาะกับสัตว์เลี้ยงของคุณ', time: '2 วันที่แล้ว', unread: false },
]

const tone = {
  order: 'bg-blue-50 text-blue-500',
  promo: 'bg-orange-50 text-orange-500',
  pet: 'bg-pink-50 text-pink-500',
  system: 'bg-purple-50 text-purple-500',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(() => getNotifications(initialNotifications, 'customer'))
  const [filter, setFilter] = useState('ทั้งหมด')
  const [selectedNotification, setSelectedNotification] = useState(null)
  const navigate = useNavigate()

  useEffect(() => subscribeNotifications(setNotifications, 'customer'), [])
  const filters = [
    ['ทั้งหมด', null],
    ['ยังไม่ได้อ่าน', 'unread'],
    ['คำสั่งซื้อ', 'order'],
    ['โปรโมชั่น', 'promo'],
    ['ระบบ', 'system'],
  ]

  const unreadCount = notifications.filter((item) => item.unread).length
  const visible = useMemo(() => {
    const selectedType = filters.find(([label]) => label === filter)?.[1]
    if (selectedType === 'unread') return notifications.filter((item) => item.unread)
    if (selectedType) return notifications.filter((item) => item.type === selectedType)
    return notifications
  }, [filter, notifications])

  const markAllRead = () => markAllNotificationsRead('customer')
  const markRead = (id) => {
    markNotificationRead(id)
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item))
  }
  const openNotification = (item) => {
    markRead(item.id)
    setSelectedNotification(item)
  }
  const goToNotificationTarget = () => {
    if (!selectedNotification) return
    if (selectedNotification.orderId) {
      const orderId = encodeURIComponent(selectedNotification.orderId)
      setSelectedNotification(null)
      navigate(`/orders/${orderId}`)
      return
    }
    setSelectedNotification(null)
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="shrink-0 rounded-b-[28px] border-b border-slate-100 bg-white px-5 pb-4 pt-3 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between">
          <Link to="/home" aria-label="กลับไปหน้าหลัก" className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-700 active:scale-95">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="text-center">
            <h1 className="m-0 text-xl font-bold text-slate-800">การแจ้งเตือน</h1>
            {unreadCount > 0 && <p className="m-0 mt-0.5 text-xs text-slate-400  ">มี {unreadCount} รายการที่ยังไม่ได้อ่าน</p>}
          </div>
          <button type="button" onClick={markAllRead} disabled={!unreadCount} className="text-sm font-semibold text-orange-500 disabled:text-slate-300">
            อ่านทั้งหมด
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {filters.map(([item]) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition active:scale-95 ${filter === item ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'bg-slate-100 text-slate-500'}`}>
              {item}
            </button>
          ))}
        </div>
      </header>

      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-5 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.length > 0 ? (
          <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.05)]">
            {visible.map((item, index) => (
              <button key={item.id} type="button" onClick={() => openNotification(item)} className={`relative flex w-full gap-3 px-4 py-4 text-left transition active:bg-slate-50 ${index ? 'border-t border-slate-100' : ''} ${item.unread ? 'bg-orange-50/30' : 'bg-white'}`}>
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tone[item.type] || 'bg-slate-100 text-slate-500'}`}>
                  <i className={`fa-solid ${item.icon} text-[16px]`} />
                </span>
                <span className="min-w-0 flex-1 pr-2">
                  <span className="flex items-start gap-2">
                    <span className={`text-sm leading-5 ${item.unread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'}`}>{item.title}</span>
                    {item.unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-orange-500" />}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{item.detail}</span>
                  <span className="mt-1.5 block text-[10px] text-slate-300">{item.time}</span>
                </span>
                <i className="fa-solid fa-chevron-right mt-3 shrink-0 text-xs text-slate-300" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-[24px] bg-white px-5 text-center shadow-sm">
            <div className="grid size-16 place-items-center rounded-full bg-orange-50 text-orange-300">
              <i className="fa-regular fa-bell text-2xl" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-600">ไม่มีการแจ้งเตือนใหม่</p>
            <p className="mt-1 text-xs text-slate-400">ตอนนี้คุณอ่านครบทุกข้อความแล้ว</p>
          </div>
        )}
      </main>

      <BottomNavigation />

      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-3 backdrop-blur-[2px]" onClick={() => setSelectedNotification(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="รายละเอียดการแจ้งเตือน"
            className="w-full max-w-[430px] overflow-hidden rounded-[28px] bg-white shadow-2xl animate-[notification-sheet-in_0.22s_ease-out]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="text-sm font-bold text-slate-700">รายละเอียดการแจ้งเตือน</span>
              <button type="button" onClick={() => setSelectedNotification(null)} className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500 active:scale-95" aria-label="ปิด">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="px-5 pb-6 pt-5">
              <div className="flex items-start gap-3">
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tone[selectedNotification.type] || 'bg-slate-100 text-slate-500'}`}>
                  <i className={`fa-solid ${selectedNotification.icon} text-lg`} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="m-0 text-base font-bold leading-6 text-slate-800">{selectedNotification.title}</h2>
                  <p className="m-0 mt-1 text-[10px] text-slate-300">{selectedNotification.time}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
                <p className="m-0 text-sm leading-6 text-slate-600">{selectedNotification.detail}</p>
              </div>

              {selectedNotification.orderId && (
                <button type="button" onClick={goToNotificationTarget} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white shadow-sm shadow-orange-500/20 active:scale-[0.98]">
                  ดูรายละเอียดคำสั่งซื้อ
                  <i className="fa-solid fa-arrow-right text-xs" />
                </button>
              )}

              <button type="button" onClick={() => setSelectedNotification(null)} className="mt-3 h-11 w-full rounded-xl bg-slate-100 text-sm font-semibold text-slate-600 active:scale-[0.98]">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
