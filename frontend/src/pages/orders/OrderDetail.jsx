import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrder } from '../../api/orders.js'
import { addToCart } from '../../api/cart.js'
import { getStoreProfile } from '../../lib/store.js'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import CartBadge from '../../components/cart/CartBadge.jsx'
import OrderReceipt from '../../components/orders/OrderReceipt.jsx'

const statusMap = {
  pending: { label: 'รอดำเนินการ', className: 'bg-orange-50 text-orange-600' },
  confirmed: { label: 'ยืนยันออเดอร์แล้ว', className: 'bg-indigo-50 text-indigo-600' },
  shipped: { label: 'กำลังจัดส่ง', className: 'bg-blue-50 text-blue-600' },
  delivered: { label: 'จัดส่งสำเร็จ', className: 'bg-green-50 text-green-600' },
  cancelled: { label: 'ยกเลิก', className: 'bg-red-50 text-red-500' },
}

const parsePrice = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  return Number(String(value ?? '').replace(/[฿,\s]/g, '')) || 0
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const parseAddressSnapshot = (value) => {
  if (!value) return {}
  if (typeof value === 'object') return value
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const getPaymentLabel = (value) => {
  if (!value) return 'ไม่ระบุ'
  const paymentMap = {
    cod: 'เก็บเงินปลายทาง',
    promptpay: 'พร้อมเพย์',
    card: 'บัตรเครดิต / เดบิต',
  }
  return paymentMap[String(value).toLowerCase()] || value
}

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [reordering, setReordering] = useState(false)
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)

  useEffect(() => {
    let active = true

    const loadOrder = async () => {
      if (!orderId) {
        setErrorMessage('ไม่พบรหัสคำสั่งซื้อ')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage('')
        const data = await getOrder(decodeURIComponent(orderId))
        console.log('CUSTOMER ORDER DATA:', data)
        if (active) setOrder(data)
      } catch (error) {
        console.error('Load order detail error:', error)
        if (active) {
          setOrder(null)
          setErrorMessage(error.message || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOrder()
    return () => {
      active = false
    }
  }, [orderId])

  if (loading) {
    return (
      <main className="mx-auto flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
          <p className="text-sm text-gray-400">กำลังโหลดรายละเอียดคำสั่งซื้อ...</p>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] items-center justify-center bg-gray-50 px-5 text-center">
        <div>
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500">
            <i className="fa-solid fa-box-open text-2xl" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-gray-900">ไม่พบคำสั่งซื้อ</h1>
          <p className="mt-1 text-sm text-gray-400">{errorMessage || 'คำสั่งซื้ออาจถูกลบหรือไม่มีอยู่แล้ว'}</p>
          <Link to="/orders" className="mt-5 inline-flex h-11 items-center rounded-full bg-orange-500 px-6 text-sm font-bold text-white">
            กลับประวัติการสั่งซื้อ
          </Link>
        </div>
      </main>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []
  const address = parseAddressSnapshot(order.address_snapshot || order.order_address)
  const rawStatus = String(order.order_status || '').toLowerCase()
  const status = rawStatus === 'cancelled' && order.payment_status === 'unpaid' ? {
    label: 'หมดเวลาชำระเงิน',
    className: 'bg-red-50 text-red-500',
  } : statusMap[rawStatus] || {
    label: rawStatus || 'ไม่ทราบสถานะ',
    className: 'bg-gray-100 text-gray-500',
  }
  const subtotal = items.reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.order_quantity) || 1)
    return sum + parsePrice(item.order_price) * quantity
  }, 0)
  const totalQuantity = items.reduce((sum, item) => sum + Math.max(0, Number(item.order_quantity) || 0), 0)
  const store = getStoreProfile()

  const addressText = [
    address.recipient_name,
    address.phone,
    address.address_line,
    address.subdistrict && `ต.${address.subdistrict}`,
    address.district && `อ.${address.district}`,
    address.province && `จ.${address.province}`,
    address.postal_code,
  ].filter(Boolean).join(' • ')

  const handleReorder = async () => {
    if (!items.length || reordering) return

    try {
      setReordering(true)
      setErrorMessage('')
      for (const item of items) {
        await addToCart({
          productId: item.product_id,
          cartQuantity: Math.max(1, Number(item.order_quantity) || 1),
        })
      }
      window.dispatchEvent(new Event('petshop-cart-updated'))
      navigate('/cart')
    } catch (error) {
      console.error('Reorder error:', error)
      setErrorMessage(error.message || 'ไม่สามารถเพิ่มสินค้าเดิมลงตะกร้าได้')
    } finally {
      setReordering(false)
    }
  }

  return (
    <>
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
        <header className="no-print shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-4 pt-3 shadow-md">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="กลับ"
              className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-600 active:scale-95"
            >
              <i className="fa-solid fa-arrow-left" />
            </button>

            <h1 className="text-xl font-bold text-gray-900">
              รายละเอียดคำสั่งซื้อ
            </h1>

            <Link
              to="/cart"
              aria-label="ตะกร้าสินค้า"
              className="relative grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500"
            >
              <CartBadge>
                <i className="fa-solid fa-cart-shopping" />
              </CartBadge>
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400">หมายเลขคำสั่งซื้อ</p>
                <p className="mt-1 text-base font-bold text-gray-900">
                  {order.order_id}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDate(order.created_at)}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                <i className="fa-solid fa-receipt" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800">
                  คำสั่งซื้อ #{order.order_id}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  รวม {totalQuantity} ชิ้น
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">รายการสินค้า</h2>
              <span className="text-xs text-gray-400">
                {items.length} รายการ
              </span>
            </div>

            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                ไม่พบรายการสินค้า
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const quantity = Math.max(
                    1,
                    Number(item.order_quantity) || 1
                  )
                  const unitPrice = parsePrice(item.order_price)
                  const itemTotal = unitPrice * quantity

                  return (
                    <div
                      key={item.order_item_id}
                      className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={
                              item.product_name ||
                              `สินค้า #${item.product_id}`
                            }
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-xl text-gray-400">
                            <i className="fa-solid fa-box" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800">
                          {item.product_name ||
                            `สินค้า #${item.product_id}`}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {quantity} ชิ้น × ฿{unitPrice.toLocaleString()}
                        </p>
                      </div>

                      <strong className="shrink-0 text-sm text-orange-500">
                        ฿{itemTotal.toLocaleString()}
                      </strong>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold">สรุปการชำระเงิน</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>ค่าสินค้า</span>
                <span>฿{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>ค่าจัดส่ง</span>
                <span>รวมอยู่ในยอดคำสั่งซื้อ</span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3" />

              <div className="flex justify-between">
                <span className="font-bold">ยอดสุทธิ</span>
                <strong className="text-xl text-orange-500">
                  ฿{Number(order.total_amount || 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold">ที่อยู่จัดส่ง</h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {addressText || 'ไม่ได้ระบุที่อยู่จัดส่ง'}
            </p>

            <div className="mt-5 border-t border-dashed border-gray-200 pt-5">
              <h2 className="text-base font-bold">วิธีชำระเงิน</h2>

              <p className="mt-3 text-sm text-gray-500">
                {getPaymentLabel(order.payment_method)}
              </p>

            </div>
          </section>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          {/* เปิดใบเสร็จ */}
          <button
            type="button"
            onClick={() => setShowReceiptPreview(true)}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gray-900 text-sm font-bold text-white shadow-lg shadow-gray-900/15 transition hover:-translate-y-0.5 hover:bg-gray-800 active:scale-[0.99]"
          >
            <i className="fa-solid fa-receipt" />
            ดูใบเสร็จ
          </button>

          {items.length > 0 && rawStatus === 'delivered' ? (
            <button
              type="button"
              onClick={handleReorder}
              disabled={reordering}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i
                className={`fa-solid ${reordering ? 'fa-spinner fa-spin' : 'fa-cart-plus'
                  }`}
              />
              {reordering
                ? 'กำลังเพิ่มลงตะกร้า...'
                : 'ซื้อรายการนี้อีกครั้ง'}
            </button>
          ) : null}

          <div className="h-5" />
        </main>

        <BottomNavigation />
      </div>

      {/* ใบเสร็จใช้ component เดียวกับ Admin */}
      <OrderReceipt
        open={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        order={order}
        store={store}
      />
    </>
  )
}
