import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminNotifications,
  createAdminNotification,
  deleteAdminNotifications,
} from '../../api/notifications.js'

const templates = [
  {
    type: 'promo',
    icon: 'fa-tag',
    title: 'โปรโมชั่นพิเศษสำหรับคุณ',
    detail: 'ใช้คูปองวันนี้ รับส่วนลดสำหรับอาหารและอุปกรณ์สัตว์เลี้ยง',
  },
  {
    type: 'promo',
    icon: 'fa-ticket',
    title: 'คูปองใหม่มาแล้ว',
    detail: 'มีคูปองใหม่พร้อมส่วนลดพิเศษสำหรับคุณ',
  },
  {
    type: 'promo',
    icon: 'fa-percent',
    title: 'ลดราคาพิเศษ',
    detail: 'สินค้าสุดคุ้ม ลดพิเศษในช่วงเวลาจำกัด',
  },
  
]

function unwrapData(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getIcon(type, icon) {
  if (icon) return icon

  if (type === 'promo') return 'fa-tag'
  if (type === 'order') return 'fa-truck-fast'

  return 'fa-bullhorn'
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])

  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [type, setType] = useState('system')
  const [orderId, setOrderId] = useState('')

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const response = await getAdminNotifications()

      setNotifications(unwrapData(response))
    } catch (error) {
      console.error('Load admin notifications error:', error)

      setErrorMessage(
        error?.message ||
        'ไม่สามารถโหลดประวัติการแจ้งเตือนได้'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const showToast = (message) => {
    setToast(message)

    window.setTimeout(() => {
      setToast('')
    }, 2200)
  }

  const send = async () => {
    const cleanTitle = title.trim()
    const cleanDetail = detail.trim()
    const cleanOrderId = orderId.trim()

    if (!cleanTitle || !cleanDetail) {
      return
    }

    try {
      setSending(true)
      setErrorMessage('')

      let parsedOrderId = null

      if (type === 'order' && cleanOrderId) {
        const value = Number(
          cleanOrderId.replace('#', '')
        )

        if (Number.isInteger(value) && value > 0) {
          parsedOrderId = value
        }
      }

      await createAdminNotification({
        audience: 'all',
        type,
        title: cleanTitle,
        detail: cleanDetail,
        icon: getIcon(type),
        orderId: parsedOrderId,
      })

      setTitle('')
      setDetail('')
      setOrderId('')

      await loadNotifications()

      showToast('ส่งการแจ้งเตือนเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Send notification error:', error)

      setErrorMessage(
        error?.message ||
        'ไม่สามารถส่งการแจ้งเตือนได้'
      )
    } finally {
      setSending(false)
    }
  }

  const useTemplate = (item) => {
    setType(item.type)
    setTitle(item.title)
    setDetail(item.detail)

    if (item.type !== 'order') {
      setOrderId('')
    }
  }

  const clearHistory = async () => {
    try {
      setErrorMessage('')

      await deleteAdminNotifications()

      setConfirmClear(false)
      setNotifications([])

      showToast('ล้างประวัติการแจ้งเตือนแล้ว')
    } catch (error) {
      console.error(
        'Delete admin notifications error:',
        error
      )

      setErrorMessage(
        error?.message ||
        'ไม่สามารถล้างประวัติการแจ้งเตือนได้'
      )
    }
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] text-gray-400">
            <Link
              to="/home/admin"
              className="hover:text-violet-600"
            >
              หน้าหลัก
            </Link>

            <i className="fa-solid fa-chevron-right mx-2 text-[8px]" />

            การแจ้งเตือน
          </div>

          <h1 className="mt-1 text-[22px] font-extrabold">
            จัดการการแจ้งเตือน
          </h1>

        
        </div>

        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          disabled={!notifications.length}
          className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i className="fa-solid fa-trash mr-1.5" />
          ล้างประวัติ
        </button>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
          <i className="fa-solid fa-circle-exclamation mr-2" />
          {errorMessage}
        </div>
      )}

      <div className="grid items-stretch gap-4 xl:grid-cols-2">

        {/* Send */}
        <section className="h-full rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold">
            ส่งการแจ้งเตือน
          </h2>

          <p className="mt-1 text-[10px] text-gray-400">
            ระบบจะบันทึกการแจ้งเตือนลง PostgreSQL
            และส่งให้ Customer ทุกคน
          </p>

          <div className="mt-4 space-y-3">

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-gray-500">
                ประเภท
              </span>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-400"
              >
                <option value="system">ระบบ</option>
                <option value="promo">โปรโมชั่น</option>
                <option value="order">คำสั่งซื้อ</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-gray-500">
                หัวข้อ
              </span>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="หัวข้อการแจ้งเตือน"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-400"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-gray-500">
                รายละเอียด
              </span>

              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={4}
                placeholder="รายละเอียดข้อความ..."
                className="w-full rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-violet-400"
              />
            </label>

            {type === 'order' && (
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-gray-500">
                  เลขคำสั่งซื้อ (ถ้ามี)
                </span>

                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="เช่น #15"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-400"
                />
              </label>
            )}

            <button
              type="button"
              onClick={send}
              disabled={
                sending ||
                !title.trim() ||
                !detail.trim()
              }
              className="h-10 w-full rounded-lg bg-[#6d3df5] text-xs font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i
                className={`fa - solid ${sending
                  ? 'fa-spinner fa-spin'
                  : 'fa-paper-plane'
                  } mr - 2`}
              />

              {sending
                ? 'กำลังส่ง...'
                : 'ส่งแจ้งเตือน'}
            </button>
          </div>
        </section>

        {/* Templates */}
        <section className="h-full rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold">
                ข้อความสำเร็จรูป
              </h2>

              <p className="mt-1 text-[10px] text-gray-400">
                เลือกข้อความแล้วปรับแก้ก่อนส่งได้
              </p>
            </div>

          </div>

          <div className="mt-4 space-y-2">
            {templates.map((item) => (
              <button
                type="button"
                key={`${item.type} -${item.title} `}
                onClick={() => useTemplate(item)}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/40"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-white text-violet-600 shadow-sm">
                    <i
                      className={`fa - solid ${item.icon} `}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <b className="block text-xs">
                      {item.title}
                    </b>

                    <span className="mt-1 block text-[10px] text-gray-400">
                      {item.detail}
                    </span>
                  </div>

                  <i className="fa-solid fa-chevron-right text-[9px] text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* History */}
      <section className="rounded-xl border border-[#ececf2] bg-white shadow-sm">

        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-extrabold">
            ประวัติการแจ้งเตือน
          </h2>

          <p className="text-[10px] text-gray-400">
            ส่งแล้วทั้งหมด {notifications.length} รายการ
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <i className="fa-solid fa-spinner fa-spin text-xl text-violet-500" />
          </div>
        ) : notifications.length ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((item) => (
              <div
                key={item.notification_id}
                className="flex gap-3 p-4 transition hover:bg-gray-50"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
                  <i
                    className={`fa - solid ${getIcon(
                      item.type,
                      item.icon
                    )
                      } text - [10px]`}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-xs font-extrabold text-gray-800">
                      {item.title}
                    </b>

                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[8px] font-bold text-violet-600">
                      {item.type === 'promo'
                        ? 'โปรโมชั่น'
                        : item.type === 'order'
                          ? 'คำสั่งซื้อ'
                          : 'ระบบ'}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-gray-500">
                    {item.detail}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-gray-400">
                    <span>
                      <i className="fa-solid fa-users mr-1" />
                      ผู้รับ {item.recipient_count ?? 0} คน
                    </span>

                    {item.order_id && (
                      <span>
                        <i className="fa-solid fa-receipt mr-1" />
                        Order #{item.order_id}
                      </span>
                    )}

                    <span>
                      <i className="fa-regular fa-clock mr-1" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-400">
            <i className="fa-regular fa-bell mb-2 text-2xl text-gray-200" />
            <p>ยังไม่มีประวัติการแจ้งเตือน</p>
          </div>
        )}
      </section>

      {/* Confirm delete */}
      {confirmClear && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-gray-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white shadow-2xl">

            <div className="h-1.5 bg-red-500" />

            <div className="p-6 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500">
                <i className="fa-solid fa-bell-slash text-xl" />
              </span>

              <h2 className="mt-4 text-lg font-extrabold">
                ล้างประวัติการแจ้งเตือน?
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                ประวัติการส่งทั้งหมด {notifications.length} รายการ
                จะถูกลบออกจากระบบ
              </p>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="h-11 flex-1 rounded-xl border border-gray-200 text-xs font-bold text-gray-500"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={clearHistory}
                  className="h-11 flex-1 rounded-xl bg-red-500 text-xs font-bold text-white hover:bg-red-600"
                >
                  ยืนยันล้าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[120] rounded-xl bg-gray-900 px-4 py-3 text-xs font-bold text-white shadow-xl">
          <i className="fa-solid fa-circle-check mr-2 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}