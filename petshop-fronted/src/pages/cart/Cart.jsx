import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applyCoupon } from '../../api/coupons.js'
import { logActivity } from '../../admin/activity.js'
import {
  getCart,
  updateCartItem,
  removeCartItem,
} from '../../api/cart.js'

const CHECKOUT_DISCOUNT_KEY = 'petshop_checkout_discount'

const parsePrice = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  return Number(String(value ?? '').replace(/[฿,\s]/g, '')) || 0
}

export default function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [isOpenSummary, setIsOpenSummary] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [isFreeShipping, setIsFreeShipping] = useState(false)
  const [isError, setIsError] = useState(false)

  // =========================
  // โหลด Cart จาก Backend
  // =========================
  const loadCart = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const data = await getCart()

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : []

      setCartItems(items)
    } catch (error) {
      console.error('Load cart error:', error)
      setErrorMessage(
        error.message || 'ไม่สามารถโหลดตะกร้าสินค้าได้',
      )
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  // =========================
  // เพิ่ม / ลด จำนวน
  // =========================
  const updateQuantity = async (item, change) => {
    const currentQty = Number(item.cart_quantity) || 1
    const nextQty = currentQty + change

    if (nextQty < 1) return

    try {
      setErrorMessage('')

      const data = await updateCartItem(item.cart_item_id, {
        cartQuantity: nextQty,
      })

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : null

      if (items) {
        setCartItems(items)
      } else {
        await loadCart()
      }

      window.dispatchEvent(new Event('petshop-cart-updated'))
    } catch (error) {
      console.error('Update cart error:', error)
      setErrorMessage(
        error.message || 'ไม่สามารถแก้ไขจำนวนสินค้าได้',
      )
    }
  }

  // =========================
  // ลบสินค้า
  // =========================
  const removeItem = async (item) => {
    try {
      setErrorMessage('')

      const data = await removeCartItem(item.cart_item_id)

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : null

      if (items) {
        setCartItems(items)
      } else {
        await loadCart()
      }

      window.dispatchEvent(new Event('petshop-cart-updated'))
    } catch (error) {
      console.error('Remove cart item error:', error)
      setErrorMessage(
        error.message || 'ไม่สามารถลบสินค้าได้',
      )
    }
  }

  // =========================
  // เตรียมข้อมูลสำหรับแสดงผล
  // Backend ส่ง Product มาด้วย
  // =========================
  const normalizedItems = cartItems.map((item) => {
    const product = item.product || {}

    return {
      ...item,

      qty: Math.max(
        1,
        Number(item.cart_quantity) || 1,
      ),

      name:
        product.product_name ||
        `สินค้า #${item.product_id}`,

      detail: product.description || '',

      image: product.product_image || '',

      icon: 'fa-box',

      price: Math.max(
        0,
        parsePrice(product.product_price),
      ),

      stock: Number(product.product_stock) || 0,

      status: Boolean(product.product_status),
    }
  })

  const itemCount = normalizedItems.reduce(
    (sum, item) => sum + item.qty,
    0,
  )

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  )

  const afterDiscount = Math.max(
    0,
    subtotal - discount,
  )

  const delivery =
    subtotal === 0 ||
      isFreeShipping ||
      afterDiscount >= 1000
      ? 0
      : 40

  const total = afterDiscount + delivery

  // =========================
  // Coupon
  // =========================
  const handleApplyCode = async () => {
    const code = promoCode.trim().toUpperCase()
    const result = await applyCoupon(code, subtotal)

    if (!result.ok) {
      setDiscount(0)
      setIsFreeShipping(false)
      localStorage.removeItem(CHECKOUT_DISCOUNT_KEY)
      setIsError(true)
      return
    }

    setPromoCode(code)
    setDiscount(result.amount)
    setIsFreeShipping(result.freeShipping)

    logActivity(
      'coupon',
      `ใช้โค้ด ${code}`,
      {
        couponCode: code,
        amount: result.amount,
      },
    )

    setIsError(false)

    localStorage.setItem(
      CHECKOUT_DISCOUNT_KEY,
      JSON.stringify({
        code,
        amount: result.amount,
        min: Number(result.min || 0),
        freeShipping: result.freeShipping,
      }),
    )
  }

  const handleClearInput = () => {
    setPromoCode('')
    setDiscount(0)
    setIsFreeShipping(false)
    setIsError(false)
    localStorage.removeItem(CHECKOUT_DISCOUNT_KEY)
  }

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <main className="mx-auto flex h-screen w-full max-w-[430px] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="text-sm text-gray-400">
            กำลังโหลดตะกร้าสินค้า...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative mx-auto flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 text-gray-900 shadow-[0_0_40px_rgba(17,24,39,0.10)]">

      {/* ================= HEADER ================= */}
      <header className="z-10 shrink-0 space-y-5 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-5 pt-3 shadow-md">
        <div className="flex items-center justify-between">
          <Link
            to="/products"
            aria-label="กลับ"
            className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-600"
          >
            <i className="fa-solid fa-arrow-left" />
          </Link>

          <div className="text-center">
            <h1 className="mt-0.5 text-xl font-bold">
              ตะกร้าสินค้า
            </h1>
          </div>

          <span className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500">
            <i className="fa-solid fa-cart-shopping" />
          </span>
        </div>

        <div className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-base font-bold text-gray-800">
            สินค้าในตะกร้า
          </h2>

          <span className="text-sm text-gray-400">
            {itemCount} ชิ้น
          </span>
        </div>
      </header>

      {/* ================= ERROR ================= */}
      {errorMessage && (
        <div className="mx-5 mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {/* ================= CART LIST ================= */}
      <section className="flex-1 space-y-4 overflow-y-auto px-5 pb-36 pt-4">
        {normalizedItems.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500">
              <i className="fa-solid fa-cart-shopping text-2xl" />
            </div>

            <h3 className="mt-4 text-base font-bold">
              ยังไม่มีสินค้าในตะกร้า
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              เลือกสินค้าที่ต้องการแล้วกดใส่ตะกร้าได้เลย
            </p>

            <Link
              to="/products"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-orange-500 px-6 text-sm font-bold text-white shadow-sm transition-transform hover:bg-orange-600 active:scale-[0.98]"
            >
              ไปเลือกสินค้า
            </Link>
          </div>
        ) : (
          normalizedItems.map((item) => (
            <article
              key={item.cart_item_id}
              className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex gap-3">

                {/* IMAGE */}
                <div className="size-[82px] shrink-0 overflow-hidden rounded-[20px] bg-gray-100">

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                        event.currentTarget.nextElementSibling?.classList.remove(
                          'hidden',
                        )
                      }}
                    />
                  ) : null}

                  <div
                    className={`size-full place-items-center text-3xl text-gray-400 ${item.image ? 'hidden' : 'grid'
                      }`}
                  >
                    <i
                      className={`fa-solid ${item.icon}`}
                    />
                  </div>
                </div>

                {/* CONTENT */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">

                    <div>
                      <h3 className="text-sm font-bold leading-5">
                        {item.name}
                      </h3>

                      {item.detail && (
                        <p className="mt-1 text-xs text-gray-400">
                          {item.detail}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      aria-label={`ลบ ${item.name}`}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-gray-300 transition hover:bg-red-50 hover:text-red-400 active:scale-95"
                    >
                      <i className="fa-regular fa-trash-can text-sm" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">

                    <div>
                      <strong className="text-lg text-orange-500">
                        ฿{(item.price * item.qty).toLocaleString()}
                      </strong>

                      <span className="ml-1 text-xs text-gray-400">
                        / {item.qty} ชิ้น
                      </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-full bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, -1)}
                        disabled={item.qty <= 1}
                        className="grid size-7 place-items-center rounded-full bg-white text-sm shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>

                      <span className="min-w-4 text-center text-sm font-bold">
                        {item.qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item, 1)}
                        disabled={
                          item.stock > 0 ||
                          item.qty >= item.stock
                        }
                        className="grid size-7 place-items-center rounded-full bg-black text-sm text-white transition hover:bg-gray-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* ================= OVERLAY ================= */}
      {isOpenSummary && (
        <div
          className="absolute inset-0 z-20 bg-black/40 transition-opacity duration-300"
          onClick={() => setIsOpenSummary(false)}
        />
      )}

      {/* ================= SUMMARY ================= */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] rounded-t-[28px] border-t border-gray-100 bg-white px-5 pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out pb-[calc(16px+env(safe-area-inset-bottom))] ${isOpenSummary
            ? 'translate-y-0'
            : 'translate-y-[calc(100%-124px-env(safe-area-inset-bottom))]'
          }`}
      >
        <button
          type="button"
          onClick={() => setIsOpenSummary(!isOpenSummary)}
          className="mx-auto mb-2 block h-1.5 w-12 rounded-full bg-gray-200 transition hover:bg-gray-300"
          aria-label="ดูสรุปคำสั่งซื้อ"
        />

        <div className="rounded-[22px] bg-white px-2">
          <div
            className="flex cursor-pointer items-center justify-between pb-3"
            onClick={() => setIsOpenSummary(!isOpenSummary)}
          >
            <h2 className="text-base font-bold">
              สรุปคำสั่งซื้อ
            </h2>

            <i
              className={`fa-solid fa-chevron-up text-gray-400 transition-transform duration-300 ${isOpenSummary ? 'rotate-180' : ''
                }`}
            />
          </div>

          <div
            className={`space-y-3 text-sm transition-all duration-300 ${isOpenSummary
                ? 'mb-3 max-h-[500px] opacity-100'
                : 'max-h-0 overflow-hidden opacity-0'
              }`}
          >
            {/* COUPON */}
            <div className="rounded-[22px] border border-dashed border-orange-400 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500">
                  <i className="fa-solid fa-ticket" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    มีโค้ดส่วนลดไหม?
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    กรอกโค้ดเพื่อรับส่วนลด
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <input
                    aria-label="โค้ดส่วนลด"
                    placeholder={
                      isError
                        ? 'ไม่พบโค้ดส่วนลดนี้'
                        : 'กรอกโค้ดส่วนลด'
                    }
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value)

                      if (isError) {
                        setIsError(false)
                      }
                    }}
                    className={`h-10 w-full rounded-full pl-4 pr-10 text-sm outline-none transition-all duration-200 ${isError
                        ? 'border-2 border-red-400 bg-red-50 font-medium text-red-600 placeholder:text-red-400'
                        : 'bg-gray-100 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-200'
                      }`}
                  />

                  {(promoCode || discount > 0 || isError) && (
                    <button
                      type="button"
                      onClick={handleClearInput}
                      className="absolute right-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-gray-300 text-[10px] text-white hover:bg-gray-400"
                      aria-label="ล้างข้อความและยกเลิกโค้ด"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleApplyCode}
                  className="h-10 shrink-0 rounded-full bg-black px-5 text-xs font-bold text-white"
                >
                  ใช้โค้ด
                </button>
              </div>

              {isFreeShipping && (
                <p className="mt-2 text-xs font-medium text-green-600">
                  <i className="fa-solid fa-truck-fast mr-1" />
                  โค้ดนี้ได้รับสิทธิ์ส่งฟรี
                </p>
              )}
            </div>

            {/* PRICE */}
            <div className="flex justify-between pt-1 text-gray-500">
              <span>ค่าสินค้า</span>
              <span>
                ฿{subtotal.toLocaleString()}
              </span>
            </div>

            {discount > 0 && (
              <>
                <div className="flex justify-between text-red-500">
                  <span>
                    ส่วนลด {promoCode ? `(${promoCode})` : ''}
                  </span>

                  <span>
                    -฿{discount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between font-medium text-gray-800">
                  <span>
                    ค่าสินค้าหลังหักส่วนลด
                  </span>

                  <span>
                    ฿{afterDiscount.toLocaleString()}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between text-gray-500">
              <span>ค่าจัดส่ง</span>

              <span>
                {delivery === 0
                  ? 'ฟรี'
                  : `฿${delivery}`}
              </span>
            </div>

            <div className="my-2 border-t border-dashed border-gray-200" />

            <div className="flex items-center justify-between pb-2">
              <span className="font-bold">
                ยอดรวมทั้งหมด
              </span>

              <strong className="text-2xl text-orange-500">
                ฿{total.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* CHECKOUT */}
        <Link
          to={cartItems.length ? '/checkout' : '/products'}
          className={`flex min-h-12 w-full items-center justify-center rounded-full text-sm font-bold !text-white shadow-lg transition-all duration-200 active:scale-[0.99] ${cartItems.length
              ? 'bg-orange-500 !text-white shadow-orange-500/30 hover:-translate-y-0.5 hover:bg-orange-600'
              : 'pointer-events-none bg-gray-300'
            }`}
          aria-disabled={!cartItems.length}
        >
          ไปชำระเงิน • ฿{total.toLocaleString()}
        </Link>
      </div>
    </main>
  )
}