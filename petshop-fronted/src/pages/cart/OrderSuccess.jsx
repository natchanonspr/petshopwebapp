import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { getOrder } from '../../api/orders.js'
import { formatBaht } from '../../lib/orderPricing.js'
import { getStoreProfile } from '../../lib/store.js'

import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import CartBadge from '../../components/cart/CartBadge.jsx'
import NotificationBadge from '../../components/profile/NotificationBadge.jsx'

export default function OrderSuccess() {
  const [params] = useSearchParams()
  const orderId = params.get('id')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showContent, setShowContent] = useState(false)

  const store = getStoreProfile()

  const handlePrintReceipt = () => {
    window.print()
  }

  // =========================
  // โหลด Order จาก Backend
  // =========================
  useEffect(() => {
    let active = true

    const loadOrder = async () => {
      if (!orderId) {
        setErrorMessage('ไม่พบหมายเลขคำสั่งซื้อ')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage('')

        const data = await getOrder(orderId)

        if (active) {
          setOrder(data)
        }
      } catch (error) {
        console.error('Load order error:', error)

        if (active) {
          setErrorMessage(
            error.message || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadOrder()

    return () => {
      active = false
    }
  }, [orderId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowContent(true)
    }, 80)

    return () => window.clearTimeout(timer)
  }, [])

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <main className="mx-auto flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
          <p className="text-sm text-gray-400">
            กำลังโหลดคำสั่งซื้อ...
          </p>
        </div>
      </main>
    )
  }

  return (
    <div className="order-success-page mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @page receipt-80mm {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          html,
          body {
            background: #fff !important;
            height: auto !important;
            min-height: 0 !important;
          }

          body * {
            visibility: hidden;
          }

          .order-success-page,
          .order-success-page * {
            visibility: visible;
          }

          .order-success-page {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            margin: 0 !important;
            background: #fff !important;
            box-shadow: none !important;
          }

          .order-success-page header,
          .order-success-page .print-hide,
          .order-success-page nav {
            display: none !important;
          }

          .order-success-content {
            display: block !important;
            width: 100% !important;
            max-width: 760px !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }

          .print-receipt {
            page: receipt-80mm;
          }

          .order-success-content section {
            break-inside: avoid;
            box-shadow: none !important;
          }

          .order-success-content .print-receipt {
            display: block !important;
            width: 80mm !important;
            max-width: 80mm !important;
            min-width: 80mm !important;
            border: 0 !important;
            border-radius: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            font-size: 12px !important;
            color: #111827 !important;
          }

          .order-success-content .print-receipt > div:first-child {
            padding-bottom: 14px !important;
          }

          html,
          body {
            width: 80mm !important;
            min-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .order-success-content .print-receipt .print-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .order-success-content .print-receipt .print-total {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .order-success-content .print-receipt .text-orange-500 {
            color: #111827 !important;
          }

          .order-success-content .print-receipt .border-gray-100,
          .order-success-content .print-receipt .border-gray-200 {
            border-color: #d1d5db !important;
          }

          .order-success-content .print-success {
            display: none !important;
          }

          .order-success-content .print-order-info {
            background: #fff !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 0 !important;
          }

          .order-success-content .print-actions {
            display: none !important;
          }

          .order-success-content .print-receipt-heading {
            display: block !important;
          }

          .order-success-page img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* ================= HEADER ================= */}
      <header className="z-10 shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-4 pt-3 shadow-md">
        <div className="flex items-center justify-between">

          <Link
            to="/orders"
            aria-label="กลับคำสั่งซื้อ"
            className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left" />
          </Link>

          <h1 className="text-xl font-bold text-gray-900">
            สั่งซื้อสำเร็จ
          </h1>

          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              aria-label="การแจ้งเตือน"
              className="relative grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95"
            >
              <NotificationBadge>
                <i className="fa-solid fa-bell" />
              </NotificationBadge>
            </Link>

            <Link
              to="/cart"
              aria-label="ตะกร้าสินค้า"
              className="relative grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95"
            >
              <CartBadge>
                <i className="fa-solid fa-cart-shopping" />
              </CartBadge>
            </Link>
          </div>
        </div>
      </header>

      <main className="order-success-content min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {/* ================= SUCCESS ================= */}
        <section
          className={`print-success rounded-3xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all duration-500 ease-out ${
            showContent
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-orange-100 shadow-[0_14px_36px_rgba(249,115,22,0.18)]">
            <div className="relative grid size-16 place-items-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/25">
              <i className="fa-solid fa-check text-2xl" />

              <span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-white text-orange-500 shadow-md">
                <i className="fa-solid fa-paw text-xs" />
              </span>
            </div>
          </div>

          <span className="mt-5 inline-flex rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600">
            ORDER CONFIRMED
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
            สั่งซื้อสำเร็จแล้ว!
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            ขอบคุณสำหรับการสั่งซื้อ
            <br />
            เราจะเตรียมสินค้าและจัดส่งให้คุณโดยเร็วที่สุด
          </p>

          <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-400">
                  หมายเลขคำสั่งซื้อ
                </p>

                <p className="mt-1 truncate text-base font-bold text-gray-900">
                  {order?.order_id || orderId}
                </p>
              </div>

              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                <i className="fa-solid fa-receipt" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-dashed border-gray-200 pt-3 text-xs text-gray-400">
              <i className="fa-solid fa-circle-check text-green-500" />
              <span>
                คำสั่งซื้อถูกบันทึกเรียบร้อยแล้ว
              </span>
            </div>
          </div>
        </section>

        {/* ================= ORDER DETAIL ================= */}
        {order && (
          <section
            className={`print-receipt mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-500 delay-100 ease-out ${
              showContent
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            {/* STORE */}
            <div className="flex items-start justify-between gap-5 border-b border-dashed border-gray-200 pb-4">
              <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-orange-50 text-orange-500">
                {store.image ? (
                  <img
                    src={store.image}
                    alt="โลโก้ร้าน"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <i className="fa-solid fa-paw" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-extrabold text-gray-900">
                  {store.name || 'PetShop'}
                </p>

                <p className="mt-0.5 whitespace-pre-line text-[10px] leading-4 text-gray-400">
                  {store.address || '-'}
                </p>

                <p className="mt-0.5 text-[10px] text-gray-400">
                  โทร {store.phone || '-'}
                </p>

                <p className="mt-0.5 text-[9px] text-gray-400">
                  เลขประจำตัวผู้เสียภาษี: {store.taxId || '-'}
                </p>
              </div>
              <div className="print-receipt-heading hidden shrink-0 text-right">
                <p className="text-lg font-black tracking-wide text-gray-900">ใบเสร็จรับเงิน</p>
                <p className="mt-1 text-[9px] text-gray-400">RECEIPT / PAYMENT CONFIRMATION</p>
                <p className="mt-2 text-[10px] font-bold text-gray-700">เลขที่ #{order?.order_id || orderId}</p>
                <p className="mt-1 text-[9px] text-gray-400">วันที่ออกใบเสร็จ {new Date().toLocaleString('th-TH')}</p>
              </div>
            </div>
            </div>

            {/* ITEMS */}
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                รายการสินค้า
              </h2>

              <span className="text-xs text-gray-400">
                {(
                  order.items || []
                ).reduce(
                  (sum, item) =>
                    sum +
                    (Number(item.order_quantity) || 0),
                  0,
                )}{' '}
                ชิ้น
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {(order.items || []).map((item) => {
                const qty =
                  Number(item.order_quantity) || 0

                const unitPrice =
                  Number(item.order_price) || 0

                return (
                  <div
                    key={item.order_item_id}
                    className="print-item flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
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
                        className={`size-full place-items-center text-xl text-gray-400 ${
                          item.product_image
                            ? 'hidden'
                            : 'grid'
                        }`}
                      >
                        <i className="fa-solid fa-box" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-5 text-gray-800">
                        {item.product_name ||
                          `สินค้า #${item.product_id}`}
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {formatBaht(unitPrice)} × {qty}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-orange-500">
                      {formatBaht(unitPrice * qty)}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* TOTAL */}
            <div className="print-total mt-4 space-y-2 border-t border-dashed border-gray-200 pt-4 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>ค่าสินค้า</span>
                <span>
                  {formatBaht(
                    order.items?.reduce(
                      (sum, item) =>
                        sum +
                        Number(item.order_price || 0) *
                          Number(item.order_quantity || 0),
                      0,
                    ) || 0,
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>ค่าส่ง</span>
                <span>คำนวณในคำสั่งซื้อ</span>
              </div>

              <div className="my-2 border-t border-dashed border-gray-200" />

              <div className="flex justify-between border-t border-dashed border-gray-200 pt-3 text-sm font-extrabold text-gray-900">
                <span>ยอดสุทธิ</span>

                <span className="text-lg text-orange-500">
                  {formatBaht(
                    Number(order.total_amount) || 0,
                  )}
                </span>
              </div>
            </div>

            {/* ORDER INFO */}
            <div className="print-order-info mt-4 rounded-2xl bg-gray-50 p-3 text-[10px] leading-5 text-gray-400">
              <p>
                สถานะคำสั่งซื้อ:{' '}
                {order.order_status || 'pending'}
              </p>

              <p>
                สถานะการชำระเงิน:{' '}
                {order.payment_status || 'unpaid'}
              </p>

              <p>
                วิธีชำระเงิน:{' '}
                {order.payment_method || 'ไม่ระบุ'}
              </p>
              <p className="mt-1">
                วันที่สั่งซื้อ: {order.created_at ? new Date(order.created_at).toLocaleString('th-TH') : '-'}
              </p>
            </div>
          </section>
        )}

        {/* ERROR */}
        {errorMessage && (
          <section className="mt-4 rounded-3xl bg-red-50 p-5 text-center">
            <i className="fa-solid fa-circle-exclamation text-2xl text-red-400" />

            <p className="mt-3 text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          </section>
        )}

        {/* BUTTONS */}
        <section
          className={`print-actions mt-4 space-y-3 transition-all duration-500 delay-200 ease-out ${
            showContent
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={handlePrintReceipt}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gray-900 text-sm font-bold text-white shadow-lg shadow-gray-900/15 transition hover:-translate-y-0.5 hover:bg-gray-800 active:scale-[0.99]"
          >
            <i className="fa-solid fa-print" />
            พิมพ์ใบเสร็จ
          </button>

          <Link
            to="/orders"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 active:scale-[0.99]"
          >
            <i className="fa-solid fa-receipt" />
            ดูคำสั่งซื้อของฉัน
          </Link>

          <Link
            to="/home"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.99]"
          >
            <i className="fa-solid fa-house" />
            กลับหน้าหลัก
          </Link>
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}