import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getAdminOrder,
  updateAdminOrderStatus,
} from '../../api/orders.js'

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
  deliveried: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิก',
}

const paymentMap = {
  unpaid: 'รอตรวจสอบ',
  paid: 'ชำระแล้ว',
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
    'จัดส่งสำเร็จ': 'deliveried',
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

    customer: `User #${order.user_id}`,

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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

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

  return (
    <div className="space-y-5 pb-20 md:pb-6">

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
          className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
            statusTone[order.status] ||
            'bg-gray-50 text-gray-500'
          }`}
        >
          {order.status}
        </div>
      </div>

      {/* Order Info */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Customer */}
        <div className="rounded-xl border border-[#ececf2] bg-white p-5">
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
        <div className="rounded-xl border border-[#ececf2] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <i className="fa-solid fa-credit-card" />
            </div>

            <div>
              <p className="text-xs text-gray-400">
                การชำระเงิน
              </p>

              <p className="text-sm font-bold text-gray-900">
                {order.payment}
              </p>
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
        <div className="rounded-xl border border-[#ececf2] bg-white p-5">
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

      {/* Status Management */}
      <div className="rounded-xl border border-[#ececf2] bg-white p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900">
            จัดการสถานะคำสั่งซื้อ
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            เปลี่ยนสถานะของคำสั่งซื้อจากรายการด้านล่าง
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value)
            }
            disabled={
              saving ||
              order.order_status === 'cancelled'
            }
            className="h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-gray-400"
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

          <button
            type="button"
            onClick={handleSaveStatus}
            disabled={
              saving ||
              order.order_status === 'cancelled'
            }
            className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="h-11 rounded-lg border border-red-200 px-5 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
            >
              <i className="fa-solid fa-ban mr-2" />
              ยกเลิกออเดอร์
            </button>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="rounded-xl border border-[#ececf2] bg-white">
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

      {/* Address */}
      <div className="rounded-xl border border-[#ececf2] bg-white p-5">
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

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
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
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-xs font-bold text-white shadow-lg">
          <i className="fa-solid fa-circle-check mr-2" />
          {toast}
        </div>
      )}
    </div>
  )
}