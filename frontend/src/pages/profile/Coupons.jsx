import { useEffect, useMemo, useState } from 'react'
import { getCoupons } from '../../api/coupons.js'
import { Link, useNavigate } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import { getCart } from '../../api/cart.js'

const CHECKOUT_DISCOUNT_KEY = 'petshop_checkout_discount'

function mapCoupon(coupon) {
  const type = coupon.type || 'ส่วนลดคงที่'

  const value = Number(
    coupon.value ?? 0
  )

  const min = Number(
    coupon.min_purchase ??
    coupon.min ??
    0
  )

  const expireAt =
    coupon.expire_at ||
    coupon.expire ||
    null

  const usageLimit = Number(
    coupon.usage_limit ??
    coupon.limit ??
    0
  )

  const used = Number(
    coupon.used_count ??
    coupon.used ??
    0
  )

  const isExpired =
    expireAt &&
    new Date() > new Date(expireAt)

  const isUsageLimitReached =
    usageLimit > 0 &&
    used >= usageLimit

  return {
    ...coupon,

    id:
      coupon.coupon_id ??
      coupon.id ??
      coupon.code,

    code: String(
      coupon.code || ''
    ).toUpperCase(),

    amount: value,

    title:
      coupon.title ||
      'ส่วนลดพิเศษสำหรับคุณ',

    subtitle:
      type === 'เปอร์เซ็นต์'
        ? `ลด ${value}%`
        : type === 'ค่าส่ง'
          ? 'รับสิทธิ์ส่งฟรี'
          : 'ส่วนลดทันที',

    min,

    expires: expireAt
      ? new Date(expireAt).toLocaleDateString(
        'th-TH',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
      : 'ไม่กำหนด',

    disabled:
      Boolean(coupon.disabled) ||
      coupon.active === false ||
      Boolean(isExpired) ||
      isUsageLimitReached,

    icon:
      type === 'เปอร์เซ็นต์'
        ? 'fa-percent'
        : type === 'ค่าส่ง'
          ? 'fa-truck-fast'
          : coupon.icon || 'fa-ticket',

    type,
  }
}

function saveCoupon(coupon) {
  localStorage.setItem(
    CHECKOUT_DISCOUNT_KEY,
    JSON.stringify({
      code: coupon.code,
      amount: coupon.amount,
      min: coupon.min,
      freeShipping:
        coupon.type === 'ค่าส่ง' ||
        coupon.freeShipping === true,
      type:
        coupon.type ||
        'ส่วนลดคงที่',
    })
  )
}

export default function Coupons() {
  const navigate = useNavigate()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [tab, setTab] = useState('available')
  const [copied, setCopied] = useState('')
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false)
  const [pendingCoupon, setPendingCoupon] = useState(null)
  useEffect(() => {
    let active = true

    const loadCoupons = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const data = await getCoupons()

        const normalized = (
          Array.isArray(data) ? data : []
        ).map(mapCoupon)

        if (active) {
          setCoupons(normalized)
        }
      } catch (error) {
        console.error('Load coupons error:', error)

        if (active) {
          setCoupons([])
          setErrorMessage(
            error.message ||
            'ไม่สามารถโหลดคูปองได้',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadCoupons()

    return () => {
      active = false
    }
  }, [])
  const visibleCoupons = useMemo(() => tab === 'available' ? coupons.filter((coupon) => !coupon.disabled) : coupons.filter((coupon) => coupon.disabled), [tab, coupons])

  const availableCount = coupons.filter((coupon) => !coupon.disabled).length
  const otherCount = coupons.filter((coupon) => coupon.disabled).length

  const useCoupon = (coupon) => {
    let cart = []
    try {
      const savedCart = JSON.parse(getCart() || '[]')
      cart = Array.isArray(savedCart) ? savedCart : []
    } catch {
      cart = []
    }

    saveCoupon(coupon)

    if (!cart.length) {
      setPendingCoupon(coupon)
      setShowEmptyCartModal(true)
      return
    }

    navigate('/checkout')
  }

  const copyCode = async (coupon) => {
    try {
      await navigator.clipboard?.writeText(coupon.code)
    } catch {
      // Clipboard อาจถูกบล็อกบนบางเบราว์เซอร์ แต่ยังแสดง feedback ให้ผู้ใช้ได้
    }
    setCopied(coupon.code)
    window.setTimeout(() => setCopied(''), 1400)
  } 
  if (loading) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="text-sm text-gray-400">
            กำลังโหลดคูปอง...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="relative z-20 shrink-0 rounded-b-[30px] bg-white px-4 pb-4 pt-5 shadow-[0_3px_14px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-[44px_1fr_44px] items-center">
          <Link to="/profile" aria-label="กลับโปรไฟล์" className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-700 transition active:scale-90">
            <i className="fa-solid fa-arrow-left text-[17px]" />
          </Link>
          <div className="text-center">
            <h1 className="m-0 text-[17px] font-extrabold text-gray-900">คูปองของฉัน</h1>

          </div>
          <span className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500">
            <i className="fa-solid fa-ticket text-[17px]" />
          </span>
        </div>

        <div className="mt-4 flex rounded-2xl bg-gray-100 p-1">
          <button type="button" onClick={() => setTab('available')} className={`flex-1 rounded-xl py-2.5 text-s font-extrabold transition-all ${tab === 'available' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}>
            ใช้ได้ตอนนี้ <span className="ml-1">{availableCount}</span>
          </button>
          <button type="button" onClick={() => setTab('used')} className={`flex-1 rounded-xl py-2.5 text-s font-extrabold transition-all ${tab === 'used' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}>
            อื่น ๆ <span className="ml-1">{otherCount}</span>
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {errorMessage && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <i className="fa-solid fa-circle-exclamation mr-2" />
            {errorMessage}
          </div>
        )}
        <div className="mb-4 rounded-3xl bg-gradient-to-r from-orange-500 to-orange-400 p-4 text-white shadow-lg shadow-orange-500/15">
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <i className="fa-solid fa-gift text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[11px] font-bold text-white/80">สิทธิพิเศษสำหรับคุณ</p>
              <h2 className="m-0 mt-0.5 text-base font-extrabold">มีคูปองพร้อมใช้แล้ว 🎉</h2>
              <p className="m-0 mt-0.5 text-[11px] text-white/80">เลือกคูปอง แล้วกด “ใช้คูปอง” ได้เลย</p>
            </div>
            <i className="fa-solid fa-ticket text-2xl opacity-25" />
          </div>
        </div>

        <div className="space-y-3">
          {visibleCoupons.map((coupon) => (
            <article key={coupon.id} className={`relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ${coupon.disabled ? 'opacity-65 ring-gray-100' : 'ring-orange-100'}`}>
              <div className="absolute left-0 top-0 h-full w-1.5 bg-orange-500" />
              <div className="flex min-h-[146px]">
                <div className="relative flex w-[112px] shrink-0 flex-col items-center justify-center border-r border-dashed border-gray-200 bg-orange-50/70 px-2 text-center">
                  <span className="grid size-11 place-items-center rounded-full bg-white text-orange-500 shadow-sm">
                    <i className={`fa-solid ${coupon.icon}`} />
                  </span>
                  <strong className="mt-2 text-[20px] font-black leading-none text-orange-500">฿{coupon.amount}</strong>
                  <span className="mt-1 text-[10px] font-bold text-orange-600">ส่วนลด</span>
                  <span className="absolute -right-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-slate-50" />
                </div>

                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="m-0 text-[14px] font-extrabold text-gray-900">{coupon.title}</h2>
                      <p className="m-0 mt-0.5 text-[11px] font-semibold text-orange-500">{coupon.subtitle}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[8px] font-extrabold text-gray-500">ขั้นต่ำ ฿{coupon.min}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <span className="font-mono text-xs font-extrabold tracking-[0.16em] text-gray-700">{coupon.code}</span>
                    <button type="button" onClick={() => copyCode(coupon)} disabled={coupon.disabled} className="text-[10px] font-extrabold text-orange-500 disabled:text-gray-300">
                      <i className="fa-regular fa-copy mr-1" />{copied === coupon.code ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-400"><i className="fa-regular fa-clock mr-1" />หมดเขต {coupon.expires}</span>
                    <button type="button" disabled={coupon.disabled} onClick={() => useCoupon(coupon)} className="rounded-full bg-orange-500 px-4 py-2 text-[11px] font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none">
                      {coupon.disabled ? 'ใช้ไม่ได้' : 'ใช้คูปอง'} <i className="fa-solid fa-arrow-right ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {visibleCoupons.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-ticket text-xl" /></div>
            <h2 className="mt-3 text-[13px] font-extrabold text-gray-800">ยังไม่มีคูปองในหมวดนี้</h2>
            <p className="mt-1 text-xs text-gray-400">คูปองใหม่จะแสดงที่หน้านี้</p>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/70 p-3 text-[10px] leading-5 text-orange-700">
          <i className="fa-solid fa-circle-info mr-1" /> คูปองแต่ละใบมีเงื่อนไขแตกต่างกัน กรุณาตรวจสอบยอดขั้นต่ำก่อนใช้งาน
        </div>
      </main>
      {showEmptyCartModal && pendingCoupon && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-[2px] animate-[fadeIn_180ms_ease-out]">
          <div className="w-full max-w-[398px] rounded-[28px] bg-white p-5 shadow-2xl animate-[slideUp_220ms_ease-out]">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-orange-50 text-orange-500">
              <i className="fa-solid fa-cart-shopping text-xl" />
            </div>
            <h2 className="mt-4 text-center text-base font-extrabold text-gray-900">ยังไม่มีสินค้าในตะกร้า</h2>
            <p className="mt-1.5 text-center text-xs leading-5 text-gray-500">
              เราเก็บคูปอง <strong className="text-orange-500">{pendingCoupon.code}</strong> ไว้ให้แล้ว<br />
              เพิ่มสินค้าก่อน แล้วคูปองจะพร้อมใช้ในหน้าเช็กเอาต์
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowEmptyCartModal(false)} className="h-11 flex-1 rounded-full bg-gray-100 text-sm font-bold text-gray-600 transition active:scale-95">
                อยู่หน้านี้
              </button>
              <button type="button" onClick={() => navigate('/products')} className="h-11 flex-1 rounded-full bg-orange-500 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95">
                ไปเลือกสินค้า
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes slideUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }`}</style>
      <BottomNavigation />
    </div>
  )
}
