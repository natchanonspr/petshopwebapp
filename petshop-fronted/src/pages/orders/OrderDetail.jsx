import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrders } from '../../data/orders.js'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import CartBadge from '../../components/cart/CartBadge.jsx'
import { calculateOrderPricing } from '../../lib/orderPricing.js'

const statusStyle = {
  pending: 'bg-orange-50 text-orange-600',
  shipping: 'bg-orange-50 text-orange-600',
  success: 'bg-green-50 text-green-600',
}

const parsePrice = (value) => Number(String(value ?? '').replace(/[฿,\s]/g, '')) || 0

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const order = useMemo(() => getOrders().find((item) => item.id === decodeURIComponent(orderId || '')), [orderId])

  if (!order) return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] items-center justify-center bg-gray-50 px-5 text-center">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-box-open text-2xl" /></div>
        <h1 className="mt-4 text-lg font-bold text-gray-900">ไม่พบคำสั่งซื้อ</h1>
        <p className="mt-1 text-sm text-gray-400">คำสั่งซื้ออาจถูกลบหรือไม่มีอยู่แล้ว</p>
        <Link to="/orders" className="mt-5 inline-flex h-11 items-center rounded-full bg-orange-500 px-6 text-sm font-bold text-white">กลับประวัติการสั่งซื้อ</Link>
      </div>
    </main>
  )

  const products = Array.isArray(order.products) ? order.products : []
  const address = order.address || {}
  const payment = order.paymentMethod || {}
  const addressText = [address.name, address.phone, address.address || address.detail, address.subdistrict || address.district, address.province, address.postalCode].filter(Boolean).join(' • ')
  const paymentText = typeof payment === 'string' ? payment : [payment.name || payment.type || 'ชำระเงินออนไลน์', payment.last4 ? `•••• ${payment.last4}` : ''].filter(Boolean).join(' ')
  const calculatedSubtotal = products.reduce((sum, product) => sum + parsePrice(product.price) * Math.max(1, Number(product.qty) || 1), 0)
  const subtotal = parsePrice(order.subtotal) || calculatedSubtotal
  const discount = parsePrice(order.discount)
  const delivery = parsePrice(order.delivery)
  const pricing = calculateOrderPricing({ subtotal, discount, delivery })

  const reorder = () => {
    if (!products.length) return
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
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-4 pt-3 shadow-md">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} aria-label="กลับ" className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-600 active:scale-95"><i className="fa-solid fa-arrow-left" /></button>
          <h1 className="text-xl font-bold text-gray-900">รายละเอียดคำสั่งซื้อ</h1>
          <Link to="/cart" aria-label="ตะกร้าสินค้า" className="relative grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500"><CartBadge><i className="fa-solid fa-cart-shopping" /></CartBadge></Link>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs text-gray-400">หมายเลขคำสั่งซื้อ</p><p className="mt-1 text-base font-bold text-gray-900">{order.id}</p><p className="mt-1 text-xs text-gray-400">{order.date}</p></div>
            <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${statusStyle[order.tone] || 'bg-gray-100 text-gray-500'}`}>{order.status}</span>
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500"><i className={`fa-solid ${order.icon || 'fa-box'}`} /></div>
            <div><p className="text-sm font-bold">{order.name}</p><p className="mt-1 text-xs text-gray-400">รวม {order.qty} ชิ้น {order.items ? `• ${order.items}` : ''}</p></div>
          </div>
        </section>

        {products.length > 0 && <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold">รายการสินค้า</h2>
          <div className="mt-4 space-y-3">
            {products.map((product, index) => <div key={`${product.id || 'product'}-${index}`} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gray-100 text-xl text-gray-400"><i className={`fa-solid ${product.icon || 'fa-box'}`} /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-gray-400">{product.qty || 1} ชิ้น × ฿{parsePrice(product.price).toLocaleString()}</p></div>
              <strong className="text-sm text-orange-500">฿{(parsePrice(product.price) * Math.max(1, Number(product.qty) || 1)).toLocaleString()}</strong>
            </div>)}
          </div>
        </section>}

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold">สรุปการชำระเงิน</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-gray-500"><span>ค่าสินค้า</span><span>฿{subtotal.toLocaleString()}</span></div>
            {discount > 0 && <div className="flex justify-between text-red-500"><span>ส่วนลด {order.discountCode ? `(${order.discountCode})` : ''}</span><span>-฿{discount.toLocaleString()}</span></div>}
            <div className="flex justify-between text-gray-500"><span>ค่าจัดส่ง</span><span>{delivery === 0 ? 'ฟรี' : `฿${delivery.toLocaleString()}`}</span></div>
            <div className="flex justify-between text-gray-500"><span>ราคาก่อน VAT</span><span>฿{Math.round(pricing.beforeVat).toLocaleString()}</span></div>
            <div className="flex justify-between text-orange-600"><span>VAT 7%</span><span>฿{Math.round(pricing.vat).toLocaleString()}</span></div>
            <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between"><span className="font-bold">ยอดสุทธิ</span><strong className="text-xl text-orange-500">฿{Math.round(pricing.total).toLocaleString()}</strong></div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold">ที่อยู่จัดส่ง</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">{addressText || 'ไม่ได้ระบุที่อยู่จัดส่ง'}</p>
          <h2 className="mt-5 text-base font-bold">วิธีชำระเงิน</h2>
          <p className="mt-3 text-sm text-gray-500">{paymentText}</p>
        </section>

        {products.length > 0 && <button type="button" onClick={reorder} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 active:scale-[0.99]"><i className="fa-solid fa-cart-plus" />ซื้อรายการนี้อีกครั้ง</button>}
        <div className="h-5" />
      </main>
      <BottomNavigation />
    </div>
  )
}
