// =========================
// Checkout Page: ตรวจสอบตะกร้า ที่อยู่ คูปอง และสร้างคำสั่งซื้อ
// =========================
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getCart } from '../../api/cart.js'
import { getAddresses } from '../../api/address.js'
import { createOrder } from '../../api/orders.js'

import { applyCoupon } from '../../api/coupons.js'
import { calculateOrderPricing, VAT_RATE, } from '../../lib/orderPricing.js'

const parsePrice = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  return Number(
    String(value ?? '').replace(/[฿,\s]/g, ''),
  ) || 0
}

const getAddressId = (item) => {
  return item?.address_id ?? item?.id ?? null
}

const mapAddressToDisplay = (savedAddress) => {
  return {
    name:
      savedAddress?.recipient_name ||
      savedAddress?.name ||
      '',
    phone:
      savedAddress?.phone ||
      savedAddress?.recipient_phone ||
      '',
    detail: [
      savedAddress?.address_line ||
      savedAddress?.address ||
      savedAddress?.detail,
      savedAddress?.subdistrict &&
      `ต.${savedAddress.subdistrict}`,
      savedAddress?.district &&
      `อ.${savedAddress.district}`,
      savedAddress?.province &&
      `จ.${savedAddress.province}`,
      savedAddress?.postal_code,
    ]
      .filter(Boolean)
      .join(' '),
  }
}

export default function Checkout() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [savedAddresses, setSavedAddresses] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [discountInfo, setDiscountInfo] = useState({
    code: '',
    amount: 0,
    min: 0,
    freeShipping: false,
  })

  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('promptpay')

  const [address, setAddress] = useState({
    name: '',
    phone: '',
    detail: '',
  })

  // =========================
  // โหลด Cart + Address
  // =========================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const [cartData, addressData] = await Promise.all([
          getCart(),
          getAddresses(),
        ])

        const cart = Array.isArray(cartData)
          ? cartData
          : Array.isArray(cartData?.data)
            ? cartData.data
            : []

        const addresses = Array.isArray(addressData)
          ? addressData
          : Array.isArray(addressData?.data)
            ? addressData.data
            : []

        setItems(cart)
        setSavedAddresses(addresses)

        // เลือก Default Address ก่อน ถ้าไม่มีให้เลือกตัวแรก
        const defaultAddress =
          addresses.find((item) => item?.is_default) ||
          addresses[0]

        if (defaultAddress) {
          const addressId = getAddressId(defaultAddress)
          const mappedAddress =
            mapAddressToDisplay(defaultAddress)

          setSelectedAddressId(addressId)
          setAddress(mappedAddress)
        } else {
          setSelectedAddressId(null)
          setAddress({
            name: '',
            phone: '',
            detail: '',
          })
        }
      } catch (error) {
        console.error(
          'Load checkout data error:',
          error,
        )

        setErrorMessage(
          error?.message ||
          'ไม่สามารถโหลดข้อมูล Checkout ได้',
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (!loading && items.length === 0) {
      navigate('/cart', { replace: true })
    }
  }, [loading, items.length, navigate])

  // =========================
  // Normalize Cart
  // Backend Cart → Product
  // =========================
  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const product = item?.product || {}

      return {
        ...item,

        qty: Math.max(
          1,
          Number(item?.cart_quantity) || 1,
        ),

        name:
          product?.product_name ||
          `สินค้า #${item?.product_id}`,

        price: Math.max(
          0,
          parsePrice(product?.product_price),
        ),

        image: product?.product_image || '',
      }
    })
  }, [items])

  const subtotal = useMemo(() => {
    return normalizedItems.reduce(
      (sum, item) =>
        sum + item.price * item.qty,
      0,
    )
  }, [normalizedItems])

  // =========================
  // Coupon
  // ตรวจสอบซ้ำกับ backend ทุกครั้งที่ subtotal หรือโค้ดเปลี่ยน
  // เริ่มด้วย ok:true ไปก่อน (ตอนบันทึกจาก Cart ก็ผ่านการเช็คมาแล้ว)
  // เพื่อไม่ให้ส่วนลดกระพริบหายระหว่างรอผล แล้วค่อยแก้ไขถ้าผลจริงไม่ผ่าน
  // =========================
  const [activePromoResult, setActivePromoResult] = useState(
    () =>
      discountInfo.code
        ? {
          ok: true,
          code: discountInfo.code,
          amount: Number(discountInfo.amount) || 0,
          freeShipping: Boolean(discountInfo.freeShipping),
        }
        : null,
  )

  useEffect(() => {
    if (!discountInfo.code) {
      setActivePromoResult(null)
      return
    }

    let cancelled = false

    const checkCoupon = async () => {
      try {
        const result = await applyCoupon(
          discountInfo.code,
          subtotal,
        )

        if (cancelled) return

        if (!result?.ok) {
          setActivePromoResult({
            ok: false,
            amount: 0,
            freeShipping: false,
          })
          return
        }

        setActivePromoResult(result)
      } catch (error) {
        console.error('Check coupon error:', error)

        if (!cancelled) {
          // ถ้า backend ตรวจซ้ำไม่ได้
          // ให้ใช้ค่าที่บันทึกไว้ก่อน
          setActivePromoResult({
            ok: true,
            code: discountInfo.code,
            amount: Number(discountInfo.amount) || 0,
            freeShipping: Boolean(
              discountInfo.freeShipping,
            ),
          })
        }
      }
    }

    checkCoupon()

    return () => {
      cancelled = true
    }
  }, [discountInfo.code, subtotal])

  const promoEligible =
    !discountInfo.code ||
    activePromoResult?.ok

  const discount = promoEligible
    ? Math.min(
      Math.max(
        Number(activePromoResult?.amount ?? discountInfo.amount) || 0,
        0,
      ),
      subtotal,
    )
    : 0

  const afterDiscount = subtotal - discount

  const freeShipping =
    promoEligible &&
    Boolean(
      activePromoResult?.freeShipping ??
      discountInfo.freeShipping,
    )

  const delivery =
    freeShipping || afterDiscount >= 500
      ? 0
      : 40

  const { vat: taxAmount, total, } = calculateOrderPricing({
    subtotal,
    discount,
    delivery,
  })

  // =========================
  // Coupon
  // =========================
  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase()

    if (!code) {
      setPromoError('กรุณากรอกโค้ดส่วนลด')
      return
    }

    const result = await applyCoupon(
      code,
      subtotal,
    )

    if (!result.ok) {
      setPromoError(result.reason)
      return
    }

    const nextDiscount = {
      code: result.code,
      amount: result.amount,
      min: Number(result.min || 0),
      freeShipping: result.freeShipping,
    }

    setDiscountInfo(nextDiscount)
    setActivePromoResult(result)
    setPromoCode(code)
    setPromoError('')

    localStorage.setItem(
      CHECKOUT_DISCOUNT_KEY,
      JSON.stringify(nextDiscount),
    )
  }

  const handleRemovePromo = () => {
    const cleared = {
      code: '',
      amount: 0,
      freeShipping: false,
    }

    setDiscountInfo(cleared)
    setActivePromoResult(null)
    setPromoCode('')
    setPromoError('')

    localStorage.removeItem(CHECKOUT_DISCOUNT_KEY)
  }

  // =========================
  // เลือก Address
  // =========================
  const handleSelectAddress = (savedAddress) => {
    const addressId = getAddressId(savedAddress)
    const mappedAddress =
      mapAddressToDisplay(savedAddress)

    setSelectedAddressId(addressId)
    setAddress(mappedAddress)
    setErrorMessage('')
  }

  // =========================
  // สร้าง Order
  // =========================
  const handleSubmit = async (event) => {
    event.preventDefault()

    if (submitting) return

    if (!normalizedItems.length) {
      setErrorMessage('ไม่มีสินค้าในตะกร้า')
      return
    }

    if (!selectedAddressId) {
      setErrorMessage('กรุณาเลือกที่อยู่จัดส่ง')
      return
    }

    if (!address.name.trim()) {
      setErrorMessage('กรุณาเลือกที่อยู่จัดส่ง')
      return
    }

    if (!/^0\d{8,9}$/.test(address.phone.trim())) {
      setErrorMessage(
        'ข้อมูลเบอร์โทรศัพท์ไม่ถูกต้อง',
      )
      return
    }

    if (!address.detail.trim()) {
      setErrorMessage(
        'ข้อมูลที่อยู่จัดส่งไม่ครบ',
      )
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage('')

      // Backend ตอนนี้รับ address_id
      const order = await createOrder({
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: discountInfo.code || '',
      })

      console.log('Create order successful:', order,)

      window.dispatchEvent(new Event('petshop-cart-updated'),)

      navigate(`/orders`, {
        replace: true,
      })

      navigate(`/payment/${order.order_id}`)

    } catch (error) {
      console.error(
        'Create order error:',
        error,
      )

      setErrorMessage(
        error?.message ||
        'ไม่สามารถสร้างคำสั่งซื้อได้',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <main className="mx-auto flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="text-sm text-gray-400">
            กำลังโหลดข้อมูล Checkout...
          </p>
        </div>
      </main>
    )
  }

  // =========================
  // Empty Cart
  // =========================
  if (!items.length) {
    return (
      <main className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col bg-gray-50 text-gray-900">
        <header className="flex items-center gap-3 rounded-b-[28px] bg-white px-5 py-4 shadow-md">
          <Link
            to="/cart"
            className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500"
          >
            <i className="fa-solid fa-arrow-left" />
          </Link>

          <h1 className="text-xl font-bold">
            ชำระเงิน
          </h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500">
            <i className="fa-solid fa-cart-shopping text-2xl" />
          </div>

          <h2 className="mt-4 font-bold">
            ไม่มีสินค้าให้ชำระเงิน
          </h2>

          <Link
            to="/products"
            className="mt-5 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white"
          >
            ไปเลือกสินค้า
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 text-gray-900 shadow-[0_0_40px_rgba(17,24,39,0.10)]">

      {/* HEADER */}
      <header className="shrink-0 rounded-b-[28px] bg-white px-5 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            aria-label="กลับตะกร้า"
            className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500"
          >
            <i className="fa-solid fa-arrow-left" />
          </Link>

          <h1 className="text-xl font-bold">
            ชำระเงิน
          </h1>
        </div>
      </header>

      {errorMessage && (
        <div className="mx-5 mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <form
        id="checkout-form"
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >

        {/* ADDRESS */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500">
              <i className="fa-solid fa-location-dot" />
            </div>

            <div>
              <h2 className="font-bold">
                ที่อยู่จัดส่ง
              </h2>

              <p className="text-xs text-gray-400">
                ข้อมูลสำหรับจัดส่งสินค้า
              </p>
            </div>
          </div>

          {savedAddresses.length === 0 ? (
            <Link
              to="/profile/addresses"
              className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-4 text-left"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-orange-500">
                <i className="fa-solid fa-plus" />
              </span>

              <span className="min-w-0 flex-1">
                <strong className="block text-sm text-gray-800">
                  เพิ่มที่อยู่จัดส่ง
                </strong>

                <small className="mt-1 block text-xs text-gray-400">
                  กดที่นี่เพื่อจัดการที่อยู่ของคุณ
                </small>
              </span>

              <i className="fa-solid fa-chevron-right text-xs text-orange-400" />
            </Link>
          ) : (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  เลือกที่อยู่
                </p>

                <Link
                  to="/profile/addresses"
                  className="text-xs font-semibold text-orange-500"
                >
                  จัดการที่อยู่
                </Link>
              </div>

              <div className="space-y-2">
                {savedAddresses.map(
                  (savedAddress) => {
                    const addressId =
                      getAddressId(savedAddress)

                    return (
                      <button
                        key={addressId}
                        type="button"
                        onClick={() =>
                          handleSelectAddress(
                            savedAddress,
                          )
                        }
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left ${selectedAddressId ===
                          addressId
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-100 bg-white'
                          }`}
                      >
                        <span
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${selectedAddressId ===
                            addressId
                            ? 'border-orange-500'
                            : 'border-gray-300'
                            }`}
                        >
                          {selectedAddressId ===
                            addressId && (
                              <span className="size-2.5 rounded-full bg-orange-500" />
                            )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <strong className="block text-sm">
                            {savedAddress?.recipient_name ||
                              savedAddress?.name ||
                              'ไม่ระบุชื่อ'}

                            {savedAddress?.is_default && (
                              <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                                หลัก
                              </span>
                            )}
                          </strong>

                          <small className="mt-1 block text-xs leading-5 text-gray-500">
                            {savedAddress?.phone ||
                              savedAddress?.recipient_phone ||
                              ''}
                            {' · '}
                            {savedAddress?.address_line ||
                              savedAddress?.address ||
                              ''}
                            {' '}
                            {savedAddress?.subdistrict &&
                              `ต.${savedAddress.subdistrict} `}
                            {savedAddress?.district &&
                              `อ.${savedAddress.district} `}
                            {savedAddress?.province &&
                              `จ.${savedAddress.province} `}
                            {savedAddress?.postal_code ||
                              ''}
                          </small>
                        </span>
                      </button>
                    )
                  },
                )}
              </div>
            </div>
          )}
        </section>

        {/* PAYMENT */}
        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">
            วิธีการชำระเงิน
          </h2>

          <div className="mt-4 space-y-2">

            {/* พร้อมเพย์ */}
            <button
              type="button"
              onClick={() => setPaymentMethod('promptpay')}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${paymentMethod === 'promptpay'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-100 bg-white'
                }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full ${paymentMethod === 'promptpay'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-400'
                  }`}
              >
                <i className="fa-solid fa-mobile-screen-button" />
              </span>

              <span className="min-w-0 flex-1">
                <strong className="block text-sm">
                  พร้อมเพย์เบอร์โทร
                </strong>

                <small className="text-xs text-gray-400">
                  ชำระเงินผ่านหมายเลขโทรศัพท์พร้อมเพย์
                </small>
              </span>

              <span
                className={`grid size-5 place-items-center rounded-full border-2 ${paymentMethod === 'promptpay'
                  ? 'border-orange-500'
                  : 'border-gray-300'
                  }`}
              >
                {paymentMethod === 'promptpay' && (
                  <span className="size-2.5 rounded-full bg-orange-500" />
                )}
              </span>
            </button>

            {/* QR Code */}
            <button
              type="button"
              onClick={() => setPaymentMethod('qr')}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${paymentMethod === 'qr'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-100 bg-white'
                }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full ${paymentMethod === 'qr'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-400'
                  }`}
              >
                <i className="fa-solid fa-qrcode" />
              </span>

              <span className="min-w-0 flex-1">
                <strong className="block text-sm">
                  พร้อมเพย์ QR
                </strong>

                <small className="text-xs text-gray-400">
                  ชำระเงินผ่านพร้อมเพย์ QR Code
                </small>
              </span>

              <span
                className={`grid size-5 place-items-center rounded-full border-2 ${paymentMethod === 'qr'
                  ? 'border-orange-500'
                  : 'border-gray-300'
                  }`}
              >
                {paymentMethod === 'qr' && (
                  <span className="size-2.5 rounded-full bg-orange-500" />
                )}
              </span>
            </button>

          </div>
        </section>

        {/* COUPON */}
        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500">
              <i className="fa-solid fa-ticket" />
            </div>

            <div>
              <h2 className="font-bold">
                โค้ดส่วนลด
              </h2>

            </div>
          </div>

          {discountInfo.code &&
            promoEligible ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-green-700">
                  ใช้โค้ด {discountInfo.code}
                </p>

                <p className="text-xs text-green-600">
                  ลด ฿{discount.toLocaleString()}
                  {freeShipping
                    ? ' + ส่งฟรี'
                    : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRemovePromo}
                className="text-xs font-bold text-red-500"
              >
                ลบ
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(
                      e.target.value.toUpperCase(),
                    )
                    setPromoError('')
                  }}
                  placeholder="กรอกโค้ด เช่น T100"
                  className="h-11 min-w-0 flex-1 rounded-xl bg-gray-100 px-4 text-sm uppercase outline-none focus:ring-2 focus:ring-orange-200"
                />

                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="h-11 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white"
                >
                  ใช้โค้ด
                </button>
              </div>

              {promoError && (
                <p className="mt-2 text-xs text-red-500">
                  {promoError}
                </p>
              )}
            </div>
          )}
        </section>

        {/* SUMMARY */}
        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">
            สรุปคำสั่งซื้อ
          </h2>

          <div className="mt-3 space-y-2 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>ค่าสินค้า</span>
              <span>
                ฿{subtotal.toLocaleString() - taxAmount.toLocaleString()}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>
                  ส่วนลด
                  {discountInfo.code
                    ? ` (${discountInfo.code})`
                    : ''}
                </span>

                <span>
                  -฿{discount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>ค่าจัดส่ง</span>

              <span>
                {delivery
                  ? `฿${delivery}`
                  : 'ฟรี'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>VAT {(VAT_RATE * 100).toFixed(0)}%</span>

              <span>
                ฿{taxAmount.toLocaleString()}
              </span>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-3" />

            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>
                ยอดชำระทั้งหมด
              </span>

              <span className="text-xl text-orange-500">
                ฿{total.toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      </form>

      {/* SUBMIT */}
      <div className="absolute bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-gray-100 bg-white px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <button
          type="submit"
          form="checkout-form"
          disabled={
            submitting ||
            !selectedAddressId
          }
          className="w-full rounded-full bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting
            ? 'กำลังสร้างคำสั่งซื้อ...'
            : `ยืนยันคำสั่งซื้อ • ฿${total.toLocaleString()}`}
        </button>
      </div>
    </main>
  )
}