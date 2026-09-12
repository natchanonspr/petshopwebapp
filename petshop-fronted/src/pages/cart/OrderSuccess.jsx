import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getOrders } from '../../data/orders.js'
import { getProductsWithAdminOverrides } from '../../data/products.js'
import { calculateOrderPricing, formatBaht } from '../../lib/orderPricing.js'
import { getStoreProfile } from '../../lib/store.js'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import CartBadge from '../../components/cart/CartBadge.jsx'
import NotificationBadge from '../../components/profile/NotificationBadge.jsx'

export default function OrderSuccess() {
  const [params] = useSearchParams()
  const orderId = params.get('id') || 'คำสั่งซื้อใหม่'
  const [showContent, setShowContent] = useState(false)
  const order = useMemo(() => getOrders().find((item) => item.id === orderId), [orderId])
  const products = useMemo(() => getProductsWithAdminOverrides(), [])
  const store = useMemo(() => getStoreProfile(), [])
  const pricing = useMemo(
    () => calculateOrderPricing({ subtotal: order?.subtotal || 0, discount: order?.discount || 0, delivery: order?.delivery || 0 }),
    [order],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setShowContent(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="z-10 shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-4 pt-3 shadow-md">
        <div className="flex items-center justify-between">
          <Link to="/orders" aria-label="กลับคำสั่งซื้อ" className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">สั่งซื้อสำเร็จ</h1>
          <div className="flex items-center gap-2">
            <Link to="/notifications" aria-label="การแจ้งเตือน" className="relative grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95">
              <NotificationBadge><i className="fa-solid fa-bell" /></NotificationBadge>
            </Link>
            <Link to="/cart" aria-label="ตะกร้าสินค้า" className="relative grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95">
              <CartBadge><i className="fa-solid fa-cart-shopping" /></CartBadge>
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className={`rounded-3xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all duration-500 ease-out ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-orange-100 shadow-[0_14px_36px_rgba(249,115,22,0.18)]">
            <div className="relative grid size-16 place-items-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/25">
              <i className="fa-solid fa-check text-2xl" />
              <span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-white text-orange-500 shadow-md">
                <i className="fa-solid fa-paw text-xs" />
              </span>
            </div>
          </div>

          <span className="mt-5 inline-flex rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600">ORDER CONFIRMED</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">สั่งซื้อสำเร็จแล้ว!</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">ขอบคุณสำหรับการสั่งซื้อ<br />เราจะเตรียมสินค้าและจัดส่งให้คุณโดยเร็วที่สุด</p>

          <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-400">หมายเลขคำสั่งซื้อ</p>
                <p className="mt-1 truncate text-base font-bold text-gray-900">{orderId}</p>
              </div>
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                <i className="fa-solid fa-receipt" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-dashed border-gray-200 pt-3 text-xs text-gray-400">
              <i className="fa-solid fa-circle-check text-green-500" />
              <span>คำสั่งซื้อถูกบันทึกเรียบร้อยแล้ว</span>
            </div>
          </div>
        </section>

        {order && (
          <section className={`mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-500 delay-100 ease-out ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex items-center gap-3 border-b border-dashed border-gray-200 pb-4">
              <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-orange-50 text-orange-500">
                {store.image ? <img src={store.image} alt="โลโก้ร้าน" className="h-full w-full object-cover" /> : <i className="fa-solid fa-paw" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-gray-900">{store.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-gray-400">{store.address}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">รายการสินค้า</h2>
              <span className="text-xs text-gray-400">
                {(order.products || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || order.qty || 0} ชิ้น
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {(order.products || []).map((product, index) => {
                const qty = Number(product.qty) || 0
                const unitPrice = Number(product.price) || 0
                const catalogProduct = products.find((item) => String(item.id) === String(product.id))
                const image = product.image || product.imageUrl || catalogProduct?.image || catalogProduct?.imageUrl
                return (
                  <div key={`${product.id || product.name}-${index}`} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                      {image ? (
                        <img src={image} alt={product.name} className="size-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling?.classList.remove('hidden') }} />
                      ) : null}
                      <div className={`size-full place-items-center text-xl text-gray-400 ${image ? 'hidden' : 'grid'}`}><i className={`fa-solid ${product.icon || catalogProduct?.icon || 'fa-box'}`} /></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-5 text-gray-800">{product.name}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{formatBaht(unitPrice)} × {qty}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-orange-500">{formatBaht(unitPrice * qty)}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 space-y-2 border-t border-dashed border-gray-200 pt-4 text-xs text-gray-500">
              <div className="flex justify-between"><span>ค่าสินค้า</span><span>{formatBaht(pricing.subtotal)}</span></div>
              {pricing.discount > 0 && <div className="flex justify-between text-red-500"><span>ส่วนลด</span><span>-{formatBaht(pricing.discount)}</span></div>}
              <div className="flex justify-between"><span>ค่าจัดส่ง</span><span>{pricing.delivery ? formatBaht(pricing.delivery) : 'ฟรี'}</span></div>
              <div className="flex justify-between"><span>ราคาก่อน VAT</span><span>{formatBaht(pricing.beforeVat)}</span></div>
              <div className="flex justify-between text-orange-600"><span>VAT 7%</span><span>{formatBaht(pricing.vat)}</span></div>
              <div className="flex justify-between border-t border-dashed border-gray-200 pt-3 text-sm font-extrabold text-gray-900">
                <span>ยอดสุทธิ</span>
                <span className="text-lg text-orange-500">{formatBaht(pricing.total)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 p-3 text-[10px] leading-5 text-gray-400">
              <p>เลขประจำตัวผู้เสียภาษี: {store.taxId}</p>
              <p>ชำระเงิน: {order.paymentMethod?.name || 'ไม่ระบุ'}</p>
            </div>
          </section>
        )}

        <section className={`mt-4 space-y-3 transition-all duration-500 delay-200 ease-out ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {order && (
            <button type="button" onClick={() => window.print()} className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 text-sm font-bold text-orange-600 transition hover:-translate-y-0.5 hover:bg-orange-100 active:scale-[0.99]">
              <i className="fa-solid fa-print" />
              พิมพ์ / บันทึก PDF
            </button>
          )}
          <Link to="/orders" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 active:scale-[0.99]">
            <i className="fa-solid fa-receipt" />
            ดูคำสั่งซื้อของฉัน
          </Link>
          <Link to="/home" className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.99]">
            <i className="fa-solid fa-house" />
            กลับหน้าหลัก
          </Link>
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}
