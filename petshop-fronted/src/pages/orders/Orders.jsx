import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import CartBadge from '../../components/cart/CartBadge.jsx'
import { ORDERS_UPDATED_EVENT, defaultOrders, getOrders } from '../../data/orders.js'
import EmptyState from '../../components/EmptyState.jsx'
import NotificationBadge from '../../components/profile/NotificationBadge.jsx'

const tabs = ['ทั้งหมด', 'รอดำเนินการ', 'กำลังจัดส่ง', 'สำเร็จ']

const statusClass = {
  pending: 'bg-orange-50 text-orange-600',
  shipping: 'bg-orange-50 text-orange-600',
  success: 'bg-gray-100 text-gray-500',
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState('ทั้งหมด')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState(defaultOrders)
  const navigate = useNavigate()

  useEffect(() => {
    const syncOrders = () => setOrders(getOrders())
    syncOrders()
    window.addEventListener(ORDERS_UPDATED_EVENT, syncOrders)
    window.addEventListener('storage', syncOrders)
    return () => {
      window.removeEventListener(ORDERS_UPDATED_EVENT, syncOrders)
      window.removeEventListener('storage', syncOrders)
    }
  }, [])

  const visibleOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesTab = activeTab === 'ทั้งหมด' || order.status === activeTab
      const matchesSearch = !keyword || `${order.id} ${order.name} ${order.status} ${order.date}`.toLowerCase().includes(keyword)
      return matchesTab && matchesSearch
    })
  }, [activeTab, search, orders])

  const handleReorder = (order) => {
    const products = Array.isArray(order.products) && order.products.length ? order.products : []
    if (!products.length) {
      navigate(`/orders/${encodeURIComponent(order.id)}`)
      return
    }

    const cart = JSON.parse(window.localStorage.getItem('petshop_cart') || '[]')
    const merged = [...cart]
    products.forEach((product) => {
      const index = merged.findIndex((item) => item.id === product.id)
      const qty = Math.max(1, Number(product.qty) || 1)
      if (index >= 0) merged[index] = { ...merged[index], qty: (Number(merged[index].qty) || 1) + qty }
      else merged.push({ ...product, qty })
    })
    window.localStorage.setItem('petshop_cart', JSON.stringify(merged))
    window.dispatchEvent(new Event('petshop-cart-updated'))
    navigate('/cart')
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="z-10 min-w-0 shrink-0 overflow-hidden rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-3 pt-3 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home" aria-label="กลับหน้าหลัก" className="grid size-12 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95"><i className="fa-solid fa-arrow-left" /></Link>
            <h1 className="m-0 text-xl font-bold leading-tight text-gray-900">ประวัติ</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/notifications" aria-label="การแจ้งเตือน" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95"><NotificationBadge><i className="fa-solid fa-bell" /></NotificationBadge></Link>
            <Link to="/cart" aria-label="ตะกร้าสินค้า" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95"><CartBadge><i className="fa-solid fa-cart-shopping" /></CartBadge></Link>
          </div>
        </div>
        <label className="relative block">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="ค้นหาเลขออเดอร์ หรือสินค้า..." aria-label="ค้นหาประวัติการสั่งซื้อ" className="block h-[46px] w-full rounded-2xl border-0 bg-gray-100 pl-10 pr-10 text-sm text-gray-700 outline-none placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-orange-200" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="ล้างการค้นหา" className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-gray-200 text-gray-500 transition hover:bg-gray-300 active:scale-95"><i className="fa-solid fa-xmark text-xs" /></button>}
        </label>
        <div className="mt-4 flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-full border-0 px-5 py-2 text-sm font-medium whitespace-nowrap transition active:scale-95 ${activeTab === tab ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'bg-gray-100 text-gray-500'}`}>{tab}</button>)}
        </div>
      </header>

      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-3 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 className="m-0 text-lg font-bold leading-tight text-gray-900">คำสั่งซื้อของฉัน</h2><span className="print-only mt-1 block text-xs text-gray-400">{activeTab === 'ทั้งหมด' ? 'ประวัติการสั่งซื้อทั้งหมด' : `ประวัติการสั่งซื้อ: ${activeTab}`}</span></div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm text-gray-400">{visibleOrders.length} รายการ</span>
          </div>
        </div>
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="min-w-0"><p className="m-0 text-xs font-medium text-gray-500">Order ID: <span className="text-gray-700">{order.id}</span></p><p className="m-0 mt-1 text-[10px] text-gray-400">{order.date}</p></div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass[order.tone] || 'bg-gray-100 text-gray-500'}`}>{order.status}</span>
              </div>
              <div className="flex gap-3 py-4">
                <div className="grid size-[62px] shrink-0 place-items-center rounded-2xl bg-gray-100 text-xl text-gray-400"><i className={`fa-solid ${order.icon || 'fa-box'}`} /></div>
                <div className="min-w-0 flex-1"><h3 className="m-0 text-sm font-bold leading-5 text-gray-800">{order.name}</h3><p className="m-0 mt-1 text-xs text-gray-400">จำนวน: {order.qty} ชิ้น</p>{order.items && <p className="m-0 text-xs text-gray-400">{order.items}</p>}</div>
              </div>
              <div className="flex items-end justify-between border-t border-gray-100 pt-3">
                <div><p className="m-0 text-[10px] text-gray-400">ยอดสุทธิ</p><p className="m-0 mt-0.5 text-lg font-bold text-orange-500">฿{Number(order.total).toLocaleString()}</p></div>
                <div className="flex items-center gap-2">
                  <Link to={`/orders/${encodeURIComponent(order.id)}`} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-95">ดูรายละเอียด</Link>
                  {order.tone === 'success' && <button type="button" onClick={() => handleReorder(order)} className="rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95">ซื้อซ้ำ</button>}
                </div>
              </div>
            </article>
          ))}
          {visibleOrders.length === 0 && (
            <EmptyState
              icon="fa-receipt"
              title={search ? `ไม่พบออเดอร์ “${search}”` : 'ยังไม่มีรายการในหมวดนี้'}
              description={search ? 'ลองค้นหาด้วยเลขออเดอร์ ชื่อสินค้า หรือวันที่' : 'เมื่อสั่งซื้อสินค้า รายการของคุณจะแสดงที่นี่'}
              actionLabel={search ? 'ล้างการค้นหา' : undefined}
              onAction={search ? () => setSearch('') : undefined}
            />
          )}
        </div>
        <div className="h-5" />
      </main>
      <BottomNavigation />
    </div>
  )
}
