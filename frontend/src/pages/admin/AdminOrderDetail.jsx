import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_BASE, apiFetch } from '../../api/api.js'
import { getAdminOrder, updateAdminOrderStatus, updateAdminOrderPaymentStatus, } from '../../api/orders.js'
import { getStoreProfile } from '../../lib/store.js'

const statuses = [
  'รอดำเนินการ',
  'ยืนยันออเดอร์แล้ว',
  'กำลังจัดส่ง',
  'จัดส่งสำเร็จ',
]

const statusMap = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันออเดอร์แล้ว',
  shipped: 'กำลังจัดส่ง',
  delivered: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิก',
}

const paymentMap = {
  unpaid: 'รอชำระเงิน',
  reviewing: 'กำลังตรวจสอบ',
  paid: 'ชำระเงินแล้ว',
  rejected: 'สลิปถูกปฏิเสธ',
  cancelled: 'ยกเลิก',
}

const statusTone = {
  'รอดำเนินการ': 'bg-violet-50 text-violet-600',
  'ยืนยันออเดอร์แล้ว': 'bg-indigo-50 text-indigo-600',
  'กำลังจัดส่ง': 'bg-blue-50 text-blue-600',
  'จัดส่งสำเร็จ': 'bg-green-50 text-green-700',
  'ยกเลิก': 'bg-red-50 text-red-500',
}

function getStatusValue(status) {
  const map = {
    'รอดำเนินการ': 'pending',
    'ยืนยันออเดอร์แล้ว': 'confirmed',
    'กำลังจัดส่ง': 'shipped',
    'จัดส่งสำเร็จ': 'delivered',
    'ยกเลิก': 'cancelled',
  }

  return map[status]
}

function normalizeOrder(order) {
  if (!order) return null

  let address = {}

  try {
    if (typeof order.address_snapshot === 'string') {
      address = JSON.parse(order.address_snapshot)
    } else if (order.address_snapshot) {
      address = order.address_snapshot
    }
  } catch (error) {
    console.error('parse address snapshot error:', error)
  }

  const createdAt = order.created_at
    ? new Date(order.created_at)
    : null

  return {
    ...order,

    displayId: `#PP-${String(order.order_id).padStart(4, '0')}`,

    customer:
      order.user?.username ||
      order.user?.name ||
      `User #${order.user_id}`,

    total: Number(order.total_amount || 0),

    status:
      statusMap[order.order_status] ||
      order.order_status ||
      'รอดำเนินการ',

    payment:
      paymentMap[order.payment_status] ||
      order.payment_status ||
      'รอตรวจสอบ',

    address,

    date: createdAt
      ? createdAt.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      : '—',

    time: createdAt
      ? createdAt.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.'
      : '—',

    items: Array.isArray(order.items)
      ? order.items
      : [],
  }
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)

  const [paymentSlipUrl, setPaymentSlipUrl] = useState('')
  const [paymentSlipLoading, setPaymentSlipLoading] = useState(false)
  const [paymentSlipError, setPaymentSlipError] = useState('')

  const loadOrder = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getAdminOrder(id)

      const normalized = normalizeOrder(data)

      setOrder(normalized)
      setSelectedStatus(normalized?.status || '')
    } catch (err) {
      console.error('load admin order error:', err)
      setError(
        err.message ||
        'ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) {
      setError('ไม่พบรหัสคำสั่งซื้อ')
      setLoading(false)
      return
    }

    loadOrder()
  }, [id])

  const subtotal = useMemo(() => {
    if (!order?.items?.length) return 0

    return order.items.reduce((sum, item) => {
      const price = Number(item.order_price || 0)
      const quantity = Number(item.order_quantity || 0)

      return sum + price * quantity
    }, 0)
  }, [order])

  useEffect(() => {
    let objectUrl = ''

    const loadPaymentSlip = async () => {
      if (
        !order?.order_id ||
        order.payment_status !== 'reviewing'
      ) {
        setPaymentSlipUrl('')
        return
      }

      try {
        setPaymentSlipLoading(true)
        setPaymentSlipError('')

        const res = await apiFetch(
          `${API_BASE}/orders/${order.order_id}/payment-slip`,
          {
            method: 'GET',
          }
        )

        if (!res.ok) {
          const text = await res.text()

          throw new Error(
            text || `โหลดสลิปไม่สำเร็จ (${res.status})`
          )
        }

        const blob = await res.blob()

        objectUrl = URL.createObjectURL(blob)

        setPaymentSlipUrl(objectUrl)
      } catch (err) {
        console.error('load payment slip error:', err)

        setPaymentSlipUrl('')
        setPaymentSlipError(
          err.message || 'ไม่สามารถโหลดรูปสลิปได้'
        )
      } finally {
        setPaymentSlipLoading(false)
      }
    }

    loadPaymentSlip()

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [order?.order_id, order?.payment_status])

  const handleSaveStatus = async () => {
    if (!order) return

    const statusValue = getStatusValue(selectedStatus)

    if (!statusValue) {
      setToast('สถานะคำสั่งซื้อไม่ถูกต้อง')
      setTimeout(() => setToast(''), 2200)
      return
    }

    try {
      setSaving(true)

      await updateAdminOrderStatus(
        order.order_id,
        statusValue
      )

      setOrder((prev) => ({
        ...prev,
        order_status: statusValue,
        status: selectedStatus,
      }))

      setToast('อัปเดตสถานะคำสั่งซื้อแล้ว')

      setTimeout(() => {
        setToast('')
      }, 2200)
    } catch (err) {
      console.error(
        'update order status error:',
        err
      )

      setToast(
        err.message ||
        'ไม่สามารถเปลี่ยนสถานะคำสั่งซื้อได้'
      )

      setTimeout(() => {
        setToast('')
      }, 2200)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelOrder = async () => {
    try {
      setSaving(true)

      await updateAdminOrderStatus(
        order.order_id,
        'cancelled'
      )

      setSelectedStatus('ยกเลิก')

      setOrder((prev) => ({
        ...prev,
        order_status: 'cancelled',
        status: 'ยกเลิก',
      }))

      setShowCancelConfirm(false)

      setToast('ยกเลิกคำสั่งซื้อแล้ว')

      setTimeout(() => {
        setToast('')
      }, 2200)
    } catch (err) {
      console.error(
        'cancel order error:',
        err
      )

      setToast(
        err.message ||
        'ไม่สามารถยกเลิกคำสั่งซื้อได้'
      )

      setTimeout(() => {
        setToast('')
      }, 2200)
    } finally {
      setSaving(false)
    }
  }

  const handleApprovePayment = async () => {
    if (!order) return

    try {
      setSaving(true)
      setToast('')

      await updateAdminOrderPaymentStatus(
        order.order_id,
        'paid'
      )

      await updateAdminOrderStatus(
        order.order_id,
        'confirmed'
      )

      setOrder((prev) => ({
        ...prev,
        payment_status: 'paid',
        payment: 'ชำระเงินแล้ว',
      }))

      setToast('อนุมัติการชำระเงินแล้ว')

      setTimeout(() => {
        setToast('')
      }, 2200)
    } catch (err) {
      console.error(
        'approve payment error:',
        err
      )

      setToast(
        err.message ||
        'ไม่สามารถอนุมัติการชำระเงินได้'
      )

      setTimeout(() => {
        setToast('')
      }, 2200)
    } finally {
      setSaving(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!order) return

    try {
      setSaving(true)
      setToast('')

      // 1. เปลี่ยนสถานะการชำระเงิน
      await updateAdminOrderPaymentStatus(
        order.order_id,
        'rejected'
      )

      // 2. ยกเลิกคำสั่งซื้อ
      await updateAdminOrderStatus(
        order.order_id,
        'cancelled'
      )

      setSelectedStatus('ยกเลิก')

      setOrder((prev) => ({
        ...prev,
        payment_status: 'rejected',
        payment: 'สลิปถูกปฏิเสธ',
        order_status: 'cancelled',
        status: 'ยกเลิก',
      }))

      setToast(
        'ปฏิเสธสลิปและยกเลิกคำสั่งซื้อแล้ว'
      )

      setTimeout(() => {
        setToast('')
      }, 2500)
    } catch (err) {
      console.error(
        'reject payment error:',
        err
      )

      setToast(
        err.message ||
        'ไม่สามารถปฏิเสธสลิปได้'
      )

      setTimeout(() => {
        setToast('')
      }, 2500)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-gray-400">
          <i className="fa-solid fa-spinner fa-spin mr-2" />
          กำลังโหลดรายละเอียดคำสั่งซื้อ...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800"
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          กลับ
        </button>

        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm font-bold text-red-500">
          {error}
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const address = order.address || {}
  const store = getStoreProfile()

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="admin-order-detail space-y-4 pb-20 md:pb-6">
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .admin-order-detail .receipt-print-area,
          .admin-order-detail .receipt-print-area * {
            visibility: visible !important;
          }

          .admin-order-detail .receipt-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to="/home/admin/orders"
            className="mb-2 inline-flex items-center text-xs font-semibold text-gray-400 hover:text-gray-700"
          >
            <i className="fa-solid fa-arrow-left mr-2" />
            กลับไปหน้าคำสั่งซื้อ
          </Link>

          <h1 className="text-xl font-bold text-gray-900">
            รายละเอียดคำสั่งซื้อ
          </h1>

          <p className="mt-1 text-xs text-gray-400">
            {order.displayId}
          </p>
        </div>

        <div
          className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusTone[order.status] ||
            'bg-gray-50 text-gray-500'
            }`}
        >
          {order.status}
        </div>
      </div>

      {/* Order Info */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Customer */}
        <div className="h-full rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <i className="fa-solid fa-user" />
            </div>

            <div>
              <p className="text-xs text-gray-400">
                ลูกค้า
              </p>

              <p className="text-sm font-bold text-gray-900">
                {order.customer}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">
                User ID
              </span>

              <span className="font-semibold text-gray-700">
                {order.user_id}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-400">
                วันที่สั่งซื้อ
              </span>

              <span className="font-semibold text-gray-700">
                {order.date}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-400">
                เวลา
              </span>

              <span className="font-semibold text-gray-700">
                {order.time}
              </span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="h-full rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <i className="fa-solid fa-credit-card" />
            </div>

            <div>
              <p className="text-xs text-gray-400">การชำระเงิน</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">
                วิธีชำระเงิน
              </span>

              <span className="font-semibold text-gray-700">
                {order.payment_method || '—'}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-400">
                สถานะการชำระเงิน
              </span>

              <span className="font-semibold text-gray-700">
                {order.payment}
              </span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="h-full rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <p className="mb-4 text-xs text-gray-400">
            ยอดรวมคำสั่งซื้อ
          </p>

          <p className="text-2xl font-bold text-gray-900">
            ฿
            {order.total.toLocaleString(
              'th-TH',
              {
                minimumFractionDigits: 2,
              }
            )}
          </p>

          <p className="mt-2 text-xs text-gray-400">
            {order.items.length} รายการ
          </p>
        </div>
      </div>

      {/* Status + Payment Slip */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Status Management */}
        <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                จัดการสถานะคำสั่งซื้อ
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                เปลี่ยนสถานะของคำสั่งซื้อจากรายการด้านล่าง
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptPreview(true)}
              className="h-10 shrink-0 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            >
              <i className="fa-solid fa-receipt mr-2" />
              Preview ใบเสร็จ
            </button>
          </div>

          <div className="flex flex-col gap-3">

            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value)
              }
              disabled={
                saving ||
                order.order_status === 'cancelled'
              }
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-gray-400"
            >
              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>

            <div className="flex gap-2">

              <button
                type="button"
                onClick={() =>
                  setShowStatusConfirm(true)
                }
                disabled={
                  saving ||
                  order.order_status === 'cancelled' ||
                  selectedStatus === order.status
                }
                className="h-11 flex-1 rounded-lg bg-gray-900 px-4 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk mr-2" />
                    บันทึกสถานะ
                  </>
                )}
              </button>

              {order.order_status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() =>
                    setShowCancelConfirm(true)
                  }
                  disabled={saving}
                  className="h-11 flex-1 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <i className="fa-solid fa-ban mr-2" />
                  ยกเลิกออเดอร์
                </button>
              )}

            </div>

          </div>
        </div>

        {/* Payment Slip */}
        <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                หลักฐานการชำระเงิน
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                ตรวจสอบสลิปก่อนอนุมัติการชำระเงิน
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${order.payment_status === 'reviewing'
                ? 'bg-blue-50 text-blue-600'
                : order.payment_status === 'paid'
                  ? 'bg-emerald-50 text-emerald-600'
                  : order.payment_status === 'rejected'
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-50 text-gray-500'
                }`}
            >
              {order.payment_status === 'reviewing'
                ? 'รอตรวจสอบ'
                : order.payment_status === 'paid'
                  ? 'ชำระเงินแล้ว'
                  : order.payment_status === 'rejected'
                    ? 'ปฏิเสธแล้ว'
                    : 'ไม่มีสลิป'}
            </span>
          </div>

          {/* Slip image */}
          <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-lg bg-gray-50 p-3">

            {order.payment_status === 'reviewing' ? (
              paymentSlipLoading ? (
                <div className="text-center text-xs text-gray-400">
                  <i className="fa-solid fa-spinner fa-spin mr-2" />
                  กำลังโหลดสลิป...
                </div>
              ) : paymentSlipUrl ? (
                <img
                  src={paymentSlipUrl}
                  alt={`Payment slip for order ${order.order_id}`}
                  className="max-h-[360px] max-w-full rounded-lg border border-gray-200 object-contain"
                />
              ) : (
                <div className="text-center text-xs text-gray-400">
                  <i className="fa-solid fa-image-slash mb-2 text-xl" />
                  <p>
                    {paymentSlipError || 'ไม่พบรูปสลิป'}
                  </p>
                </div>
              )
            ) : order.payment_status === 'paid' ? (
              <div className="text-center text-sm text-emerald-500">
                <i className="fa-solid fa-circle-check mb-2 text-2xl" />
                <p className="font-bold">
                  ชำระเงินเรียบร้อยแล้ว
                </p>
              </div>
            ) : order.payment_status === 'rejected' ? (
              <div className="text-center text-sm text-red-400">
                <i className="fa-solid fa-circle-xmark mb-2 text-2xl" />
                <p className="font-bold">
                  สลิปถูกปฏิเสธ
                </p>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-400">
                <i className="fa-solid fa-image mb-2 text-xl" />
                <p>
                  ยังไม่มีหลักฐานการชำระเงิน
                </p>
              </div>
            )}

          </div>

          {/* Payment actions */}
          {order.payment_status === 'reviewing' && (
            <div className="mt-3 flex gap-2">

              <button
                type="button"
                onClick={handleApprovePayment}
                disabled={saving}
                className="h-10 flex-1 rounded-lg bg-emerald-500 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <i className="fa-solid fa-spinner fa-spin" />
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2" />
                    อนุมัติ
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRejectPayment}
                disabled={saving}
                className="h-10 flex-1 rounded-lg border border-red-200 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="fa-solid fa-xmark mr-2" />
                ปฏิเสธสลิป
              </button>

            </div>
          )}

        </div>

      </div>

      {/* Products */}
      <div className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-sm">
        <div className="border-b border-[#ececf2] px-5 py-4">
          <h2 className="text-sm font-bold text-gray-900">
            รายการสินค้า
          </h2>
        </div>

        <div className="divide-y divide-[#f0f0f3]">
          {order.items.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              ไม่พบรายการสินค้า
            </div>
          ) : (
            order.items.map((item) => {
              const price = Number(
                item.order_price || 0
              )

              const quantity = Number(
                item.order_quantity || 0
              )

              const itemTotal =
                price * quantity

              return (
                <div
                  key={item.order_item_id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <i className="fa-solid fa-image text-xl" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {item.product_name}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      รหัสสินค้า: {item.product_id}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-8 sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        ราคา
                      </p>

                      <p className="text-sm font-semibold text-gray-700">
                        ฿
                        {price.toLocaleString(
                          'th-TH',
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        จำนวน
                      </p>

                      <p className="text-sm font-semibold text-gray-700">
                        {quantity}
                      </p>
                    </div>

                    <div className="min-w-[100px] text-right">
                      <p className="text-xs text-gray-400">
                        รวม
                      </p>

                      <p className="text-sm font-bold text-gray-900">
                        ฿
                        {itemTotal.toLocaleString(
                          'th-TH',
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-[#ececf2] px-5 py-5">
          <div className="ml-auto max-w-sm space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">
                ยอดสินค้า
              </span>

              <span className="font-semibold text-gray-700">
                ฿
                {subtotal.toLocaleString(
                  'th-TH',
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                ค่าจัดส่ง
              </span>

              <span className="font-semibold text-gray-700">
                ฿0.00
              </span>
            </div>

            <div className="border-t border-[#ececf2] pt-3">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">
                  ยอดรวมทั้งหมด
                </span>

                <span className="text-lg font-bold text-gray-900">
                  ฿
                  {order.total.toLocaleString(
                    'th-TH',
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Preview */}
      {
        showReceiptPreview && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/50 p-4 print:static print:block print:bg-white print:p-0">
            <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-gray-100 p-5 shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:bg-white print:p-0 print:shadow-none">
              <div className="mb-4 flex items-center justify-between print:hidden">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Preview ใบเสร็จ</h2>
                  <p className="mt-1 text-xs text-gray-400">ตัวอย่างใบเสร็จสำหรับพิมพ์</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReceiptPreview(false)}
                  className="grid size-9 place-items-center rounded-lg text-gray-400 hover:bg-white"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="receipt-print-area relative mx-auto max-w-[330px] bg-white px-5 py-6 text-gray-900 shadow-[0_8px_25px_rgba(30,30,50,0.10)] before:absolute before:inset-x-0 before:-bottom-1 before:h-2 before:bg-[radial-gradient(circle_at_6px_0,transparent_5px,#fff_5.5px)] before:bg-[length:12px_8px] before:bg-repeat-x print:max-w-[330px] print:shadow-none">
                <div className="text-center">
                  <div className="mx-auto grid size-16 place-items-center overflow-hidden rounded-xl text-gray-700">
                    {store.image ? (
                      <img src={store.image} alt="โลโก้ร้าน" className="h-full w-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-paw text-3xl" />
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-black uppercase tracking-tight">
                    {store.name || 'PetShop ร้านเพื่อนสัตว์เลี้ยง'}
                  </h3>
                  <p className="mx-auto mt-1 max-w-[280px] whitespace-pre-line text-[9px] leading-4 text-gray-500">
                    {store.address || '-'}
                  </p>
                  <p className="mt-0.5 text-[9px] text-gray-500">
                    โทร {store.phone || '-'}
                  </p>
                  <p className="mt-0.5 text-[8px] text-gray-400">
                    เลขประจำตัวผู้เสียภาษี: {store.taxId || '-'}
                  </p>
                </div>

                <div className="my-4 border-t border-dashed border-gray-400" />

                <div className="text-center">
                  <p className="text-xs font-black tracking-widest">ใบเสร็จรับเงิน</p>
                  <p className="mt-1 text-[8px] text-gray-400">RECEIPT / TAX INVOICE</p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-1 text-[8px] text-gray-500">
                  <span>
                    เลขที่: <b className="text-gray-700">{order.displayId}</b>
                  </span>
                  <span className="text-right">{order.date} {order.time}</span>
                </div>

                <div className="my-4 border-t border-gray-300" />

                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-[8px] font-bold text-gray-500">
                  <span>รายการ</span>
                  <span>จำนวน</span>
                  <span>รวม</span>
                </div>

                <div className="mt-2 space-y-2.5">
                  {order.items.map((item) => {
                    const price = Number(item.order_price || 0)
                    const quantity = Number(item.order_quantity || 0)
                    const itemTotal = price * quantity

                    return (
                      <div key={item.order_item_id} className="grid grid-cols-[1fr_auto_auto] items-start gap-x-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold leading-3.5 text-gray-800">{item.product_name}</p>
                          <p className="text-[8px] text-gray-400">
                            ฿{price.toLocaleString('th-TH', { minimumFractionDigits: 2 })} / ชิ้น
                          </p>
                        </div>
                        <span className="text-[9px] text-gray-600">{quantity}</span>
                        <span className="text-right text-[9px] font-bold">
                          ฿{itemTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="my-4 border-t border-dashed border-gray-400" />

                <div className="space-y-1.5 text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">รวมค่าสินค้า</span>
                    <span>฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ส่วนลด</span>
                    <span>฿0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ค่าจัดส่ง</span>
                    <span>ฟรี</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ราคาก่อน VAT</span>
                    <span>฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">VAT 7%</span>
                    <span>฿0.00</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between border-t-2 border-gray-900 pt-3">
                    <span className="text-[11px] font-black">ยอดชำระสุทธิ</span>
                    <span className="text-lg font-black">฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-[8px] text-gray-500">
                  <div className="flex justify-between">
                    <span>ชำระโดย</span>
                    <b className="text-gray-700">{order.payment_method || 'ไม่ระบุ'}</b>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>สถานะ</span>
                    <b className={order.payment_status === 'paid' ? 'text-emerald-600' : 'text-gray-700'}>
                      {order.payment_status === 'paid' ? 'ชำระเงินแล้ว' : order.payment}
                    </b>
                  </div>
                </div>

                <div className="mt-5 border-t border-dashed border-gray-400 pt-3 text-center">
                  <p className="text-[9px] font-bold">ขอบคุณที่ใช้บริการ</p>
                  <p className="mt-1 text-[8px] text-gray-400">Thank you for shopping with us</p>
                  <p className="mt-2 text-[7px] tracking-[.2em] text-gray-300">•• •••• ••• •••• ••</p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setShowReceiptPreview(false)}
                  className="h-10 rounded-lg border border-gray-200 px-5 text-sm font-bold text-gray-600 hover:bg-white"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="h-10 rounded-lg bg-gray-900 px-5 text-sm font-bold text-white hover:bg-gray-800"
                >
                  <i className="fa-solid fa-print mr-2" />
                  พิมพ์ใบเสร็จ
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Address */}
      <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
            <i className="fa-solid fa-location-dot" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-900">
              ที่อยู่จัดส่ง
            </h2>

            <p className="text-xs text-gray-400">
              Address Snapshot
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
          {address.name && (
            <div className="font-bold text-gray-900">
              {address.name}
            </div>
          )}

          {address.full_name && (
            <div className="font-bold text-gray-900">
              {address.full_name}
            </div>
          )}

          {address.phone && (
            <div>
              โทร: {address.phone}
            </div>
          )}

          {address.address && (
            <div>
              {address.address}
            </div>
          )}

          {address.address_line && (
            <div>
              {address.address_line}
            </div>
          )}

          {(address.subdistrict ||
            address.district ||
            address.province ||
            address.postcode) && (
              <div>
                {[
                  address.subdistrict,
                  address.district,
                  address.province,
                  address.postcode,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </div>
            )}

          {!address.name &&
            !address.full_name &&
            !address.phone &&
            !address.address &&
            !address.address_line &&
            !address.subdistrict &&
            !address.district &&
            !address.province &&
            !address.postcode && (
              <span className="text-gray-400">
                ไม่พบข้อมูลที่อยู่
              </span>
            )}
        </div>
      </div>

      {/* Status Confirmation */}
      {
        showStatusConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <i className="fa-solid fa-circle-question text-lg" />
              </div>

              <h3 className="text-base font-bold text-gray-900">
                ยืนยันการเปลี่ยนสถานะ
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                คุณต้องการเปลี่ยนสถานะคำสั่งซื้อ{' '}
                <span className="font-bold text-gray-700">
                  {order.displayId}
                </span>{' '}
                เป็น{' '}
                <span className="font-bold text-gray-700">
                  {selectedStatus}
                </span>{' '}
                ใช่หรือไม่?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowStatusConfirm(false)}
                  disabled={saving}
                  className="h-10 flex-1 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  ย้อนกลับ
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setShowStatusConfirm(false)
                    await handleSaveStatus()
                  }}
                  disabled={saving}
                  className="h-10 flex-1 rounded-lg bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    'ยืนยันบันทึก'
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Cancel Confirmation */}
      {
        showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <i className="fa-solid fa-triangle-exclamation text-lg" />
              </div>

              <h3 className="text-base font-bold text-gray-900">
                ยืนยันการยกเลิกออเดอร์
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                คุณต้องการยกเลิกคำสั่งซื้อ{' '}
                <span className="font-bold text-gray-700">
                  {order.displayId}
                </span>{' '}
                ใช่หรือไม่?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowCancelConfirm(false)
                  }
                  disabled={saving}
                  className="h-10 flex-1 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  ย้อนกลับ
                </button>

                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={saving}
                  className="h-10 flex-1 rounded-lg bg-red-500 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      กำลังยกเลิก...
                    </>
                  ) : (
                    'ยืนยันยกเลิก'
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Toast */}
      {
        toast && (
          <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-xs font-bold text-white shadow-lg">
            <i className="fa-solid fa-circle-check mr-2" />
            {toast}
          </div>
        )
      }
    </div >
  )
}