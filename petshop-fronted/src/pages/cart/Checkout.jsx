import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrder, getOrders, saveOrders } from '../../data/orders.js'
import { reserveOrderStock, notifyOrderCreated } from '../../admin/commerce.js'
import { getCoupon, consumeCoupon } from '../../admin/coupons.js'
import { logActivity } from '../../admin/activity.js'
import { calculateOrderPricing } from '../../lib/orderPricing.js'

const CART_KEY = 'petshop_cart'
const CHECKOUT_DISCOUNT_KEY = 'petshop_checkout_discount'
const ADDRESS_STORAGE_KEY = 'petshop_addresses'
const SEED_ADDRESS = { id: 1, recipient: 'อูนิ', phone: '081-234-5678', detail: '99/9 หมู่ 1', subdistrictId: '130201', districtId: '1302', provinceId: '13', subdistrict: 'คลองหนึ่ง', district: 'คลองหลวง', province: 'ปทุมธานี', postalCode: '12120', default: true }

const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    return Array.isArray(cart) ? cart : []
  } catch {
    return []
  }
}

const readDiscount = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKOUT_DISCOUNT_KEY) || 'null')
    return saved && typeof saved === 'object' ? saved : { code: '', amount: 0, freeShipping: false }
  } catch {
    return { code: '', amount: 0, freeShipping: false }
  }
}

const readAddresses = () => {
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY)
    // ถ้ายังไม่เคยเปิดหน้าจัดการที่อยู่ ให้ใช้ที่อยู่เริ่มต้นของระบบก่อน
    if (raw === null) return [SEED_ADDRESS]
    const saved = JSON.parse(raw)
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

const PAYMENT_STORAGE_KEY = 'petshop_payment_methods'

const readPaymentMethods = () => {
  const seed = [
    { id: 'cod', type: 'cod', title: 'เก็บเงินปลายทาง', name: 'เก็บเงินปลายทาง', detail: 'ชำระเงินเมื่อได้รับสินค้า', icon: 'fa-money-bill-wave', default: true },
    { id: 'promptpay', type: 'promptpay', title: 'พร้อมเพย์', name: 'พร้อมเพย์', detail: '081-234-5678', icon: 'fa-qrcode', default: false },
    { id: 'card', type: 'card', title: 'บัตรเครดิต / เดบิต', name: 'บัตรเครดิต / เดบิต', detail: '•••• •••• •••• 4242', icon: 'fa-credit-card', default: false },
  ]
  try {
    const saved = JSON.parse(localStorage.getItem(PAYMENT_STORAGE_KEY) || 'null')
    return Array.isArray(saved) && saved.length ? saved : seed
  } catch {
    return seed
  }
}

const parsePrice = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  return Number(String(value ?? '').replace(/[฿,\s]/g, '')) || 0
}

export default function Checkout() {
  const navigate = useNavigate()
  const [items] = useState(readCart)
  const [discountInfo, setDiscountInfo] = useState(readDiscount)
  const [promoCode, setPromoCode] = useState(discountInfo.code || '')
  const [promoError, setPromoError] = useState('')
  const [savedAddresses, setSavedAddresses] = useState(readAddresses)
  const defaultAddress = savedAddresses.find((item) => item.default || item.isDefault) || savedAddresses[0]
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id || null)
  const [address, setAddress] = useState(() => defaultAddress ? {
    name: defaultAddress.recipient || '',
    phone: defaultAddress.phone || '',
    detail: [defaultAddress.detail, defaultAddress.subdistrict && `ต.${defaultAddress.subdistrict}`, defaultAddress.district && `อ.${defaultAddress.district}`, defaultAddress.province && `จ.${defaultAddress.province}`, defaultAddress.postalCode].filter(Boolean).join(' '),
  } : { name: '', phone: '', detail: '' })
  const [paymentMethods, setPaymentMethods] = useState(readPaymentMethods)
  const defaultPayment = paymentMethods.find((item) => item.default) || paymentMethods[0]
  const [paymentMethod, setPaymentMethod] = useState(defaultPayment?.id || 'cod')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const syncAddresses = () => {
      const next = readAddresses()
      setSavedAddresses(next)
      setSelectedAddressId((current) => next.some((item) => String(item.id) === String(current)) ? current : (next.find((item) => item.default || item.isDefault)?.id || next[0]?.id || null))
    }
    window.addEventListener('storage', syncAddresses)
    window.addEventListener('petshop-address-updated', syncAddresses)

    return () => {
      window.removeEventListener('storage', syncAddresses)
      window.removeEventListener('petshop-address-updated', syncAddresses)
    }
  }, [])

  useEffect(() => {
    const syncPaymentMethods = () => {
      const next = readPaymentMethods()
      setPaymentMethods(next)
      setPaymentMethod((current) => next.some((item) => String(item.id) === String(current)) ? current : (next.find((item) => item.default)?.id || next[0]?.id || 'cod'))
    }
    window.addEventListener('storage', syncPaymentMethods)
    window.addEventListener('petshop-payment-updated', syncPaymentMethods)
    return () => {
      window.removeEventListener('storage', syncPaymentMethods)
      window.removeEventListener('petshop-payment-updated', syncPaymentMethods)
    }
  }, [])

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + parsePrice(item.price) * Math.max(1, Number(item.qty) || 1), 0), [items])
  const activePromoResult = discountInfo.code ? getCoupon(discountInfo.code, subtotal) : null
  const promoEligible = !discountInfo.code || activePromoResult?.ok
  const discount = promoEligible ? Math.min(Math.max(Number(discountInfo.amount) || 0, 0), subtotal) : 0
  const afterDiscount = subtotal - discount
  const delivery = ((promoEligible && discountInfo.freeShipping) || afterDiscount >= 1000) ? 0 : 40
  const pricing = useMemo(() => calculateOrderPricing({ subtotal, discount, delivery }), [subtotal, discount, delivery])
  const total = pricing.total

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase()
    const result = getCoupon(code, subtotal)
    if (!result.ok) {
      setPromoError(result.reason)
      return
    }

    const nextDiscount = {
      code: result.code,
      amount: result.amount,
      min: Number(result.coupon.min || 0),
      freeShipping: result.freeShipping,
    }
    setDiscountInfo(nextDiscount)
    localStorage.setItem(CHECKOUT_DISCOUNT_KEY, JSON.stringify(nextDiscount))
    setPromoCode(code)
    setPromoError('')
  }

  const handleRemovePromo = () => {
    const cleared = { code: '', amount: 0, freeShipping: false }
    setDiscountInfo(cleared)
    setPromoCode('')
    setPromoError('')
    localStorage.removeItem(CHECKOUT_DISCOUNT_KEY)
  }

  const handleSelectAddress = (savedAddress) => {
    setSelectedAddressId(savedAddress.id)
    setAddress({
      name: savedAddress.recipient || '',
      phone: savedAddress.phone || '',
      detail: [savedAddress.detail, savedAddress.subdistrict && `ต.${savedAddress.subdistrict}`, savedAddress.district && `อ.${savedAddress.district}`, savedAddress.province && `จ.${savedAddress.province}`, savedAddress.postalCode].filter(Boolean).join(' '),
    })
    setErrors({})
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!selectedAddressId || !savedAddresses.length) {
      navigate('/profile/addresses')
      return
    }
    if (!address.name.trim()) nextErrors.name = 'กรุณาเลือกที่อยู่จัดส่ง'
    if (!/^0\d{8,9}$/.test(address.phone.trim())) nextErrors.phone = 'ข้อมูลเบอร์โทรศัพท์ไม่ถูกต้อง'
    if (!address.detail.trim()) nextErrors.detail = 'ข้อมูลที่อยู่จัดส่งไม่ครบ'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const selectedPayment = paymentMethods.find((method) => String(method.id) === String(paymentMethod)) || { id: paymentMethod, name: paymentMethod }
    const order = createOrder({ items, address, paymentMethod: selectedPayment, subtotal, discount, discountCode: discountInfo.code || '', delivery, total })
    const stockResult = reserveOrderStock(order)
    if (!stockResult.ok) {
      saveOrders(getOrders().filter((item) => item.id !== order.id))
      setErrors({ stock: `ไม่สามารถสั่งซื้อได้: ${stockResult.errors.join(', ')}` })
      return
    }
    notifyOrderCreated(order)
    if (discountInfo.code) consumeCoupon(discountInfo.code)
    logActivity('purchase', `สั่งซื้อ ${order.id}`, { orderId: order.id, total: order.total, discountCode: discountInfo.code || '' })
    localStorage.removeItem(CART_KEY)
    localStorage.removeItem(CHECKOUT_DISCOUNT_KEY)
    window.dispatchEvent(new Event('petshop-cart-updated'))
    navigate(`/orders/success?id=${encodeURIComponent(order.id)}`)
  }

  if (!items.length) {
    return (
      <main className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col bg-gray-50 text-gray-900 shadow-[0_0_40px_rgba(17,24,39,0.10)]">
        <header className="flex items-center gap-3 rounded-b-[28px] bg-white px-5 py-4 shadow-md">
          <Link to="/cart" className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500"><i className="fa-solid fa-arrow-left" /></Link>
          <h1 className="text-xl font-bold">ชำระเงิน</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-cart-shopping text-2xl" /></div>
          <h2 className="mt-4 font-bold">ไม่มีสินค้าให้ชำระเงิน</h2>
          <Link to="/products" className="mt-5 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white">ไปเลือกสินค้า</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 text-gray-900 shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="shrink-0 rounded-b-[28px] bg-white px-5 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <Link to="/cart" aria-label="กลับตะกร้า" className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500"><i className="fa-solid fa-arrow-left" /></Link>
          <h1 className="text-xl font-bold">ชำระเงิน</h1>
        </div>
      </header>

      <form id="checkout-form" onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-location-dot" /></div>
            <div><h2 className="font-bold">ที่อยู่จัดส่ง</h2><p className="text-xs text-gray-400">ข้อมูลสำหรับจัดส่งสินค้า</p></div>
          </div>
          {savedAddresses.length === 0 ? (
            <Link to="/profile/addresses" className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-4 text-left transition-all hover:border-orange-400 hover:bg-orange-100 active:scale-[0.99]">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-orange-500 shadow-sm"><i className="fa-solid fa-plus" /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm text-gray-800">เลือกหรือเพิ่มที่อยู่จัดส่ง</strong><small className="mt-1 block text-xs text-gray-400">กดที่นี่เพื่อจัดการที่อยู่ของคุณ</small></span>
              <i className="fa-solid fa-chevron-right text-xs text-orange-400" />
            </Link>
          ) : <div className="mt-4 space-y-2">
            {errors.name && <p className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{errors.name}</p>}
            {errors.phone && <p className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{errors.phone}</p>}
            {errors.detail && <p className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{errors.detail}</p>}
            {errors.stock && <p className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{errors.stock}</p>}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">เลือกที่อยู่ที่บันทึกไว้</p>
              <Link to="/profile/addresses" className="text-xs font-semibold text-orange-500">จัดการที่อยู่</Link>
            </div>
            <div className="space-y-2">
              {savedAddresses.map((savedAddress) => <button key={savedAddress.id} type="button" onClick={() => handleSelectAddress(savedAddress)} className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${selectedAddressId === savedAddress.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'}`}>
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${selectedAddressId === savedAddress.id ? 'border-orange-500' : 'border-gray-300'}`}>{selectedAddressId === savedAddress.id && <span className="size-2.5 rounded-full bg-orange-500" />}</span>
                <span className="min-w-0 flex-1"><strong className="block text-sm">{savedAddress.recipient} {(savedAddress.default || savedAddress.isDefault) && <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">หลัก</span>}</strong><small className="mt-1 block text-xs leading-5 text-gray-500">{savedAddress.phone} · {savedAddress.detail} ต.{savedAddress.subdistrict} อ.{savedAddress.district} จ.{savedAddress.province} {savedAddress.postalCode}</small></span>
              </button>)}
            </div>
            <div className="border-t border-dashed border-gray-200 pt-2" />
          </div>}

        </section>

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">วิธีการชำระเงิน</h2>
          <div className="mt-3 space-y-2">
            {paymentMethods.map((method) => (
              <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${paymentMethod === method.id ? 'border-orange-500 bg-orange-50 shadow-sm shadow-orange-500/10' : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/40 hover:-translate-y-0.5'}`}>
                <span className={`grid size-10 place-items-center rounded-full ${paymentMethod === method.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}><i className={`fa-solid ${method.icon || 'fa-credit-card'}`} /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm">{method.name || method.title}</strong><small className="text-xs text-gray-400">{method.detail}</small></span>
                {method.default && <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-extrabold text-orange-600">หลัก</span>}
                <span className={`grid size-5 place-items-center rounded-full border-2 ${paymentMethod === method.id ? 'border-orange-500' : 'border-gray-300'}`}>{paymentMethod === method.id && <span className="size-2.5 rounded-full bg-orange-500" />}</span>
              </button>
            ))}
            <Link to="/profile/payment" className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-orange-50 py-3 text-xs font-bold text-orange-600"><i className="fa-solid fa-gear" />จัดการวิธีชำระเงิน</Link>
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-ticket" /></div>
            <div><h2 className="font-bold">โค้ดส่วนลด</h2><p className="text-xs text-gray-400">กรอกโค้ดเพื่อรับส่วนลดและสิทธิ์ส่งฟรี</p></div>
          </div>
          {discountInfo.code && promoEligible ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <i className="fa-solid fa-circle-check text-green-500" />
                <div className="min-w-0"><p className="text-sm font-bold text-green-700">ใช้โค้ด {discountInfo.code} แล้ว</p><p className="text-xs text-green-600">ลด ฿{discount.toLocaleString()}{discountInfo.freeShipping ? ' + ส่งฟรี' : ''}</p></div>
              </div>
              <button type="button" onClick={handleRemovePromo} className="shrink-0 text-xs font-bold text-red-500 transition hover:text-red-600">ลบ</button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex gap-2">
                <input value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError('') }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo() } }} placeholder="กรอกโค้ด เช่น T100" className="h-11 min-w-0 flex-1 rounded-xl bg-gray-100 px-4 text-sm uppercase outline-none focus:ring-2 focus:ring-orange-200" />
                <button type="button" onClick={handleApplyPromo} className="h-11 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition-all hover:bg-orange-600 hover:-translate-y-0.5 active:scale-95">ใช้โค้ด</button>
              </div>
              {promoError && <p className="mt-2 text-xs text-red-500"><i className="fa-solid fa-circle-exclamation mr-1" />{promoError}</p>}
              {discountInfo.code && !promoEligible && !promoError && <p className="mt-2 text-xs text-red-500"><i className="fa-solid fa-circle-exclamation mr-1" />{activePromoResult?.reason || 'โปรโมชั่นนี้ไม่สามารถใช้งานได้'}</p>}
              <p className="mt-2 text-xs text-gray-400">ทดลองใช้: T100 หรือ PO50</p>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">สรุปคำสั่งซื้อ</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-500">
            <div className="flex justify-between"><span>ค่าสินค้า</span><span>฿{subtotal.toLocaleString()}</span></div>
            {discount > 0 && (
              <>
                <div className="flex justify-between text-red-500"><span>ส่วนลด {discountInfo.code ? `(${discountInfo.code})` : ''}</span><span>-฿{discount.toLocaleString()}</span></div>
                <div className="flex justify-between font-medium text-gray-800"><span>หลังหักส่วนลด</span><span>฿{afterDiscount.toLocaleString()}</span></div>
              </>
            )}
            <div className="flex justify-between"><span>ค่าจัดส่ง</span><span>{delivery ? `฿${delivery}` : 'ฟรี'}</span></div>
            {discountInfo.freeShipping && delivery === 0 && <div className="flex justify-between text-green-600"><span><i className="fa-solid fa-truck-fast mr-1" />ส่งฟรีจากโค้ด</span><span>-฿40</span></div>}
            <div className="border-t border-dashed border-gray-200 pt-3" />
            <div className="flex justify-between text-base font-bold text-gray-900"><span>ยอดชำระทั้งหมด</span><span className="text-xl text-orange-500">฿{total.toLocaleString()}</span></div>
          </div>
        </section>
      </form>

      <div className="absolute bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-gray-100 bg-white px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <button type="submit" form="checkout-form" className="w-full rounded-full bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-orange-500/30 active:scale-[0.99]">ยืนยันคำสั่งซื้อ • ฿{total.toLocaleString()}</button>
      </div>
    </main>
  )
}
