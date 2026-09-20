import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import CartBadge from '../../components/cart/CartBadge.jsx'
import NotificationBadge from '../../components/profile/NotificationBadge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { getOrders } from '../../api/orders.js'
import { addToCart } from '../../api/cart.js'

const tabs = [
  'ทั้งหมด',
  'รอดำเนินการ',
  'ยืนยันออเดอร์แล้ว',
  'กำลังจัดส่ง',
  'จัดส่งสำเร็จ',
  'ยกเลิก',
]
const statusMap = {
  pending: {
    label: 'รอดำเนินการ',
    className: 'bg-orange-50 text-orange-600',
  },

  confirmed: {
    label: 'ยืนยันออเดอร์แล้ว',
    className: 'bg-indigo-50 text-indigo-600',
  },

  shipped: {
    label: 'กำลังจัดส่ง',
    className: 'bg-blue-50 text-blue-600',
  },

  delivered: {
    label: 'จัดส่งสำเร็จ',
    className: 'bg-green-50 text-green-600',
  },

  cancelled: {
    label: 'ยกเลิก',
    className: 'bg-red-50 text-red-500',
  },
}


function normalizeOrder(order) {
  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.order_items)
      ? order.order_items
      : []

  const quantity = items.reduce((sum, item) => {
    const qty =
      item.order_quantity ??
      item.quantity ??
      item.qty ??
      0

    return (
      sum +
      Math.max(0, Number(qty) || 0)
    )
  }, 0)

  const firstItem = items[0] || {}
  const firstProduct =
    firstItem.product || {}

  const rawStatus = String(
    order.order_status || order.status || '',
  ).toLowerCase()

  const status = rawStatus === 'cancelled' && order.payment_status === 'unpaid' ? {
    label: 'หมดเวลาชำระเงิน',
    className: 'bg-red-50 text-red-500',
  }
    : statusMap[rawStatus] || {
      label:
        rawStatus || 'ไม่ทราบสถานะ',
      className:
        'bg-gray-100 text-gray-500',
    }

  const date = order.created_at
    ? new Date(
      order.created_at,
    ).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    : '-'

  return {
    ...order,

    id:
      order.order_id ??
      order.id,

    rawStatus,

    statusLabel: status.label,
    statusClass: status.className,

    date,

    quantity,

    name:
      firstProduct.product_name ||
      firstItem.product_name ||
      'ไม่มีรายการสินค้า',

    image:
      firstProduct.product_image ||
      firstItem.product_image ||
      '',

    itemCount: items.length,
  }
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState('ทั้งหมด')
  const [search, setSearch] = useState('')

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [reorderingId, setReorderingId] = useState(null)
  const tabsRef = useRef(null)
  const isDraggingTabs = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)

  useEffect(() => {
    let active = true

    const loadOrders = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true)
        }

        setErrorMessage('')

        const data = await getOrders()

        const normalized = (
          Array.isArray(data) ? data : []
        ).map(normalizeOrder)

        if (active) {
          setOrders(normalized)
        }
      } catch (error) {
        console.error('Load orders error:', error)

        if (active) {
          setErrorMessage(
            error.message ||
            'ไม่สามารถโหลดคำสั่งซื้อได้',
          )
        }
      } finally {
        if (active && showLoading) {
          setLoading(false)
        }
      }
    }

    // โหลดครั้งแรก
    loadOrders(true)

    // Refresh ทุก 3 วินาที
    const interval = window.setInterval(() => {
      loadOrders(false)
    }, 3000)

    // เมื่อกลับมาเปิดหน้า/แท็บ
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOrders(false)
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }
  }, [])

  const visibleOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesTab =
        activeTab === 'ทั้งหมด' ||
        (activeTab === 'ยกเลิก' &&
          order.rawStatus === 'cancelled') ||
        order.statusLabel === activeTab

      const productNames = Array.isArray(order.items)
        ? order.items
          .map((item) =>
            item.product?.product_name ||
            item.product_name ||
            '',
          )
          .join(' ')
        : ''

      const searchText = [
        order.id,
        order.statusLabel,
        order.rawStatus,
        order.date,
        order.name,
        productNames,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !keyword ||
        searchText.includes(keyword)

      return matchesTab && matchesSearch
    })
  }, [activeTab, search, orders])

  const handleReorder = async (order) => {
    const items = Array.isArray(order.items)
      ? order.items
      : []

    if (!items.length) {
      return
    }

    try {
      setReorderingId(order.id)

      for (const item of items) {
        const quantity = Math.max(
          1,
          Number(item.order_quantity) || 1,
        )

        await addToCart({
          productId: item.product_id,
          cartQuantity: quantity,
        })
      }

      window.dispatchEvent(
        new Event('petshop-cart-updated'),
      )

      window.location.href = '/cart'
    } catch (error) {
      console.error('Reorder error:', error)

      setErrorMessage(
        error.message ||
        'ไม่สามารถซื้อรายการเดิมซ้ำได้',
      )
    } finally {
      setReorderingId(null)
    }
  }

  const handleTabsMouseDown = (event) => {
    const element = tabsRef.current

    if (!element) return

    isDraggingTabs.current = true
    startX.current = event.pageX - element.offsetLeft
    startScrollLeft.current = element.scrollLeft

    element.classList.add('cursor-grabbing')
  }

  const handleTabsMouseMove = (event) => {
    if (!isDraggingTabs.current) return

    const element = tabsRef.current

    if (!element) return

    event.preventDefault()

    const x = event.pageX - element.offsetLeft
    const distance = x - startX.current

    element.scrollLeft =
      startScrollLeft.current - distance
  }

  const stopTabsDragging = () => {
    const element = tabsRef.current

    isDraggingTabs.current = false

    if (element) {
      element.classList.remove('cursor-grabbing')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="text-sm text-gray-400">
            กำลังโหลดคำสั่งซื้อ...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">

      {/* ================= HEADER ================= */}
      <header className="z-10 min-w-0 shrink-0 rounded-b-[24px] border-b border-gray-100 bg-white px-4 pb-2.5 pt-2.5 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              aria-label="กลับหน้าหลัก"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95"
            >
              <i className="fa-solid fa-arrow-left" />
            </Link>

            <h1 className="m-0 text-xl font-bold leading-tight text-gray-900">
              ประวัติ
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              aria-label="การแจ้งเตือน"
              className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95"
            >
              <NotificationBadge>
                <i className="fa-solid fa-bell" />
              </NotificationBadge>
            </Link>

            <Link
              to="/cart"
              aria-label="ตะกร้าสินค้า"
              className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95"
            >
              <CartBadge>
                <i className="fa-solid fa-cart-shopping" />
              </CartBadge>
            </Link>
          </div>
        </div>

        {/* SEARCH */}
        <label className="relative block">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            type="text"
            placeholder="ค้นหาเลขออเดอร์ หรือสินค้า..."
            aria-label="ค้นหาประวัติการสั่งซื้อ"
            className="block h-[42px] w-full rounded-2xl border-0 bg-gray-100 pl-10 pr-10 text-sm text-gray-700 outline-none placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-orange-200"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="ล้างการค้นหา"
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-gray-200 text-gray-500 transition hover:bg-gray-300 active:scale-95"
            >
              <i className="fa-solid fa-xmark text-xs" />
            </button>
          )}
        </label>

        {/* TABS */}
        <div className="relative -mx-4 mt-3 min-w-0">
          <div
            ref={tabsRef}
            onMouseDown={handleTabsMouseDown}
            onMouseMove={handleTabsMouseMove}
            onMouseUp={stopTabsDragging}
            onMouseLeave={stopTabsDragging}
            className="cursor-grab overflow-x-auto overflow-y-hidden px-4 pb-1 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max min-w-max flex-nowrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    if (!isDraggingTabs.current) {
                      setActiveTab(tab)
                    }
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium leading-none transition active:scale-95 ${activeTab === tab
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-gray-100 text-gray-500'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-3 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {errorMessage && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold leading-tight text-gray-900">
              คำสั่งซื้อของฉัน
            </h2>

            <span className="print-only mt-1 block text-xs text-gray-400">
              {activeTab === 'ทั้งหมด'
                ? 'ประวัติการสั่งซื้อทั้งหมด'
                : `ประวัติการสั่งซื้อ: ${activeTab}`}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm text-gray-400">
              {visibleOrders.length} รายการ
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              {/* HEADER */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="min-w-0">
                  <p className="m-0 text-xs font-medium text-gray-500">
                    Order ID:{' '}
                    <span className="text-gray-700">
                      {order.id}
                    </span>
                  </p>

                  <p className="m-0 mt-1 text-[10px] text-gray-400">
                    {order.date}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${order.statusClass}`}
                >
                  {order.statusLabel}
                </span>
              </div>

              {/* PRODUCT */}
              <div className="flex gap-3 py-4">
                <div className="size-[62px] shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                  {order.image ? (
                    <img
                      src={order.image}
                      alt={order.name}
                      className="size-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none'

                        event.currentTarget.nextElementSibling?.classList.remove(
                          'hidden',
                        )
                      }}
                    />
                  ) : null}

                  <div
                    className={`size-full place-items-center text-xl text-gray-400 ${order.image ? 'hidden' : 'grid'
                      }`}
                  >
                    <i className="fa-solid fa-box" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="m-0 line-clamp-2 text-sm font-bold leading-5 text-gray-800">
                    {order.name}
                  </h3>

                  <p className="m-0 mt-1 text-xs text-gray-400">
                    จำนวน: {order.quantity} ชิ้น
                  </p>

                  {order.itemCount > 1 && (
                    <p className="m-0 mt-1 text-xs text-gray-400">
                      และอีก {order.itemCount - 1}{' '}
                      รายการ
                    </p>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-end justify-between border-t border-gray-100 pt-3">
                <div>
                  <p className="m-0 text-[10px] text-gray-400">
                    ยอดสุทธิ
                  </p>

                  <p className="m-0 mt-0.5 text-lg font-bold text-orange-500">
                    ฿
                    {Number(
                      order.total_amount || 0,
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/orders/${encodeURIComponent(
                      order.id,
                    )}`}
                    className="flex h-9 w-[100px] items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-bold leading-none text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-95"
                  >
                    ดูรายละเอียด
                  </Link>

                  {order.payment_status === 'unpaid' && order.rawStatus === 'pending' && (
                    <Link
                      to={`/payment/${encodeURIComponent(order.id)}`}
                      className="flex h-9 w-[100px] items-center justify-center rounded-full bg-orange-500 text-xs font-bold leading-none !text-white transition hover:bg-orange-600 active:scale-95"
                    >
                      ชำระเงิน
                    </Link>
                  )}

                  {(
                    order.rawStatus === 'delivered' ||
                    order.rawStatus === 'completed' ||
                    order.rawStatus === 'success'
                  ) && (
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        disabled={reorderingId === order.id}
                        className="flex h-9 w-[100px] items-center justify-center rounded-full bg-orange-500 !text-xs !font-bold !leading-none !font-sans !text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reorderingId === order.id
                          ? 'กำลังเพิ่ม...'
                          : 'ซื้อซ้ำ'}
                      </button>
                    )}
                </div>
              </div>
            </article>
          ))}

          {visibleOrders.length === 0 && (
            <EmptyState
              icon="fa-receipt"
              title={
                search
                  ? `ไม่พบออเดอร์ “${search}”`
                  : 'ยังไม่มีรายการในหมวดนี้'
              }
              description={
                search
                  ? 'ลองค้นหาด้วยเลขออเดอร์ ชื่อสินค้า หรือวันที่'
                  : 'เมื่อสั่งซื้อสินค้า รายการของคุณจะแสดงที่นี่'
              }
              actionLabel={
                search
                  ? 'ล้างการค้นหา'
                  : undefined
              }
              onAction={
                search
                  ? () => setSearch('')
                  : undefined
              }
            />
          )}
        </div>

        <div className="h-5" />
      </main>

      <BottomNavigation />
    </div>
  )
}