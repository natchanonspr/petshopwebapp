import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import { getNotifications, markAllNotificationsRead, markNotificationRead, } from '../../api/notifications.js'

const tone = {
  order: 'bg-blue-50 text-blue-500',
  promo: 'bg-orange-50 text-orange-500',
  pet: 'bg-pink-50 text-pink-500',
  system: 'bg-purple-50 text-purple-500',
}

function formatNotificationTime(dateString) {
  if (!dateString) {
    return '-'
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const now = new Date()
  const diffMs =
    now.getTime() - date.getTime()

  const diffMinutes = Math.floor(
    diffMs / 60000
  )

  if (diffMinutes < 1) {
    return 'เมื่อสักครู่นี้'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} นาทีที่แล้ว`
  }

  const diffHours = Math.floor(
    diffMinutes / 60
  )

  if (diffHours < 24) {
    return `${diffHours} ชั่วโมงที่แล้ว`
  }

  const diffDays = Math.floor(
    diffHours / 24
  )

  if (diffDays === 1) {
    return 'เมื่อวาน'
  }

  if (diffDays < 7) {
    return `${diffDays} วันที่แล้ว`
  }

  return date.toLocaleDateString(
    'th-TH',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  )
}

function normalizeNotification(item) {
  return {
    id: item.notification_id,

    type:
      item.type ||
      'system',

    icon:
      item.icon ||
      'fa-bell',

    title:
      item.title ||
      'การแจ้งเตือน',

    detail:
      item.detail ||
      '',

    time:
      formatNotificationTime(
        item.created_at
      ),

    unread:
      !item.is_read,

    orderId:
      item.order_id || null,
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [filter, setFilter] = useState('ทั้งหมด')
  const [selectedNotification, setSelectedNotification] = useState(null)

  const navigate = useNavigate()

  const filters = [
    ['ทั้งหมด', null],
    ['ยังไม่ได้อ่าน', 'unread'],
    ['คำสั่งซื้อ', 'order'],
    ['โปรโมชั่น', 'promo'],
    ['ระบบ', 'system'],
  ]

  useEffect(() => {
    let active = true

    const loadNotifications = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const data = await getNotifications()

        const normalized = (
          Array.isArray(data) ? data : []
        ).map(normalizeNotification)

        if (active) {
          setNotifications(normalized)
        }
      } catch (error) {
        console.error(
          'Load notifications error:',
          error
        )

        if (active) {
          setNotifications([])
          setErrorMessage(
            error.message ||
            'ไม่สามารถโหลดการแจ้งเตือนได้'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadNotifications()

    return () => {
      active = false
    }
  }, [])

  const unreadCount = notifications.filter((item) => item.unread).length
  const visible = useMemo(() => {
    const selectedType = filters.find(([label]) => label === filter)?.[1]
    if (selectedType === 'unread') return notifications.filter((item) => item.unread)
    if (selectedType) return notifications.filter((item) => item.type === selectedType)
    return notifications
  }, [filter, notifications])

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead()

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          unread: false,
        }))
      )
    } catch (error) {
      console.error(
        'Mark all notifications read error:',
        error
      )

      setErrorMessage(
        error.message ||
        'ไม่สามารถอ่านการแจ้งเตือนทั้งหมดได้'
      )
    }
  }
  const markRead = async (id) => {
    try {
      await markNotificationRead(id)

      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? {
              ...item,
              unread: false,
            }
            : item
        )
      )
    } catch (error) {
      console.error(
        'Mark notification read error:',
        error
      )

      setErrorMessage(
        error.message ||
        'ไม่สามารถอ่านการแจ้งเตือนได้'
      )
    }
  }
  const openNotification = async (item) => {
    await markRead(item.id)
    setSelectedNotification({
      ...item,
      unread: false,
    })
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

  if (loading) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />

          <p className="text-sm text-slate-400">
            กำลังโหลดการแจ้งเตือน...
          </p>
        </div>
      </div>
    )
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
        {errorMessage && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <i className="fa-solid fa-circle-exclamation mr-2" />
            {errorMessage}
          </div>
        )}
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
