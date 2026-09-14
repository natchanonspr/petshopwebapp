import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  getAdminUser,
} from '../../api/users.js'

import {
  getAdminOrders,
} from '../../api/orders.js'

const statusMap = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันออเดอร์แล้ว',
  shipped: 'กำลังจัดส่ง',
  deliveried: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิก',
}

const statusTone = {
  pending: 'bg-violet-50 text-violet-600',
  confirmed: 'bg-indigo-50 text-indigo-600',
  shipped: 'bg-blue-50 text-blue-600',
  deliveried: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-500',
}

const paymentMap = {
  unpaid: 'รอตรวจสอบ',
  paid: 'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

function money(value) {
  return `฿${Number(value || 0).toLocaleString(
    'th-TH',
    {
      minimumFractionDigits: 2,
    },
  )}`
}

function formatDate(value) {
  if (!value) {
    return 'ไม่ระบุ'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString(
    'th-TH',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  )
}

function formatDateTime(value) {
  if (!value) {
    return 'ไม่ระบุ'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return `${date.toLocaleDateString(
    'th-TH',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )} ${date.toLocaleTimeString(
    'th-TH',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )} น.`
}

function normalizeResponse(data) {
  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    data.data !== undefined
  ) {
    return data.data
  }

  return data
}

function getUserName(user) {
  return (
    user?.username ||
    user?.name ||
    `User #${user?.user_id ?? '—'}`
  )
}

function getUserEmail(user) {
  return user?.email || 'ไม่มีอีเมล'
}

function getUserPhone(user) {
  return user?.phone || 'ไม่มีเบอร์โทร'
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) {
    return order.items
  }

  return []
}

function getOrderQuantity(order) {
  return getOrderItems(order).reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,
        Number(item?.order_quantity) || 0,
      ),
    0,
  )
}

function getOrderProductName(order) {
  const item = getOrderItems(order)[0]

  return (
    item?.product_name ||
    'ไม่มีรายการสินค้า'
  )
}

function getOrderProductImage(order) {
  const item = getOrderItems(order)[0]

  return item?.product_image || ''
}

function Stat({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <i
            className={`fa-solid ${icon}`}
          />
        </div>

        <div>
          <p className="text-[11px] text-gray-400">
            {label}
          </p>

          <p className="text-xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function Info({
  label,
  value,
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-[10px] text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-bold text-gray-800">
        {value || '—'}
      </p>
    </div>
  )
}

function Empty({
  icon,
  text,
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-8 text-center">
      <i
        className={`fa-solid ${icon} text-2xl text-gray-200`}
      />

      <p className="mt-2 text-xs text-gray-400">
        {text}
      </p>
    </div>
  )
}

export default function AdminCustomerDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [userData, orderData] =
        await Promise.all([
          getAdminUser(userId),
          getAdminOrders(),
        ])

      const userResponse =
        normalizeResponse(userData)

      const orderResponse =
        normalizeResponse(orderData)

      const customer =
        userResponse &&
          !Array.isArray(userResponse)
          ? userResponse
          : null

      const allOrders =
        Array.isArray(orderResponse)
          ? orderResponse
          : []

      const customerOrders =
        allOrders.filter(
          (order) =>
            Number(order?.user_id) ===
            Number(userId),
        )

      setUser(customer)
      setOrders(customerOrders)
    } catch (err) {
      console.error(
        'load admin customer detail error:',
        err,
      )

      setError(
        err?.message ||
        'ไม่สามารถโหลดข้อมูลลูกค้าได้',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) {
      setError(
        'ไม่พบรหัสผู้ใช้งาน',
      )
      setLoading(false)
      return
    }

    loadData()
  }, [userId])

  const totalSpent = useMemo(() => {
    return orders.reduce(
      (sum, order) =>
        sum +
        Number(order?.total_amount || 0),
      0,
    )
  }, [orders])

  const totalItems = useMemo(() => {
    return orders.reduce(
      (sum, order) =>
        sum +
        getOrderQuantity(order),
      0,
    )
  }, [orders])

  const completedOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order?.order_status ===
        'deliveried',
    ).length
  }, [orders])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-gray-400">
          <i className="fa-solid fa-spinner fa-spin mr-2" />
          กำลังโหลดข้อมูลลูกค้า...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate(
              '/home/admin/customers',
            )
          }
          className="text-sm font-semibold text-gray-500 hover:text-gray-800"
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          กลับรายชื่อผู้ใช้งาน
        </button>

        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center text-sm font-bold text-red-500">
          {error}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-[#ececf2] bg-white p-12 text-center">
        <i className="fa-solid fa-user-slash text-3xl text-gray-200" />

        <p className="mt-3 font-bold text-gray-700">
          ไม่พบผู้ใช้งาน
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              '/home/admin/customers',
            )
          }
          className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700"
        >
          กลับรายชื่อผู้ใช้งาน
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">

      {/* =========================
          Header
      ========================= */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] text-gray-400">
          <Link
            to="/home/admin"
            className="hover:text-gray-700"
          >
            หน้าหลัก
          </Link>

          <i className="fa-solid fa-chevron-right text-[8px]" />

          <Link
            to="/home/admin/customers"
            className="hover:text-gray-700"
          >
            ผู้ใช้งาน
          </Link>

          <i className="fa-solid fa-chevron-right text-[8px]" />

          <span>
            รายละเอียด
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-start gap-3">

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/home/admin/customers',
                )
              }
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-violet-200 hover:text-violet-600"
            >
              <i className="fa-solid fa-arrow-left" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold text-gray-900">
                {getUserName(user)}
              </h1>

              <p className="mt-1 text-[10px] text-gray-400 sm:text-[11px]">
                Customer / User #
                {String(
                  user.user_id,
                ).padStart(5, '0')}
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600">
            {user.user_role ||
              user.role ||
              'user'}
          </span>
        </div>
      </div>

      {/* =========================
          Summary
      ========================= */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        <Stat
          label="ออเดอร์ทั้งหมด"
          value={orders.length.toLocaleString(
            'th-TH',
          )}
          icon="fa-receipt"
        />

        <Stat
          label="ยอดซื้อรวม"
          value={money(totalSpent)}
          icon="fa-baht-sign"
        />

        <Stat
          label="สินค้าที่สั่งซื้อ"
          value={totalItems.toLocaleString(
            'th-TH',
          )}
          icon="fa-box"
        />

        <Stat
          label="จัดส่งสำเร็จ"
          value={completedOrders.toLocaleString(
            'th-TH',
          )}
          icon="fa-circle-check"
        />

      </div>

      {/* =========================
          Customer Info
      ========================= */}
      <section className="rounded-xl border border-[#ececf2] bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <i className="fa-solid fa-user" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-900">
              ข้อมูลลูกค้า
            </h2>

            <p className="text-[10px] text-gray-400">
              ข้อมูลสมาชิกจากระบบ
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <Info
            label="User ID"
            value={String(
              user.user_id,
            )}
          />

          <Info
            label="ชื่อผู้ใช้งาน"
            value={getUserName(user)}
          />

          <Info
            label="เบอร์โทร"
            value={getUserPhone(user)}
          />

          <Info
            label="อีเมล"
            value={getUserEmail(user)}
          />

          <Info
            label="LINE ID"
            value={
              user.user_line_id
                ? 'เชื่อมต่อ LINE แล้ว'
                : 'ไม่ได้เชื่อมต่อ'
            }
          />

          <Info
            label="Role"
            value={
              user.user_role ||
              user.role ||
              'user'
            }
          />

          <Info
            label="วันที่สมัคร"
            value={formatDate(
              user.created_at,
            )}
          />

          <Info
            label="เข้าสู่ระบบล่าสุด"
            value="ไม่มีข้อมูล"
          />

        </div>
      </section>

      {/* =========================
          Orders
      ========================= */}
      <section className="rounded-xl border border-[#ececf2] bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-[#ececf2] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              ประวัติการสั่งซื้อ
            </h2>

            <p className="mt-0.5 text-[10px] text-gray-400">
              คำสั่งซื้อของ Customer
            </p>
          </div>

          <Link
            to="/home/admin/orders"
            className="text-[10px] font-bold text-violet-600 hover:underline"
          >
            ดูทั้งหมด
          </Link>
        </div>

        {orders.length === 0 ? (
          <Empty
            icon="fa-receipt"
            text="Customer ยังไม่มีคำสั่งซื้อ"
          />
        ) : (
          <div className="divide-y divide-[#f0f0f3]">

            {orders.map((order) => {
              const items =
                getOrderItems(order)

              const productName =
                getOrderProductName(
                  order,
                )

              const productImage =
                getOrderProductImage(
                  order,
                )

              const quantity =
                getOrderQuantity(order)

              const rawStatus =
                String(
                  order?.order_status ||
                  '',
                ).toLowerCase()

              const statusLabel =
                statusMap[
                rawStatus
                ] ||
                rawStatus ||
                'ไม่ทราบสถานะ'

              const paymentLabel =
                paymentMap[
                order?.payment_status
                ] ||
                order?.payment_status ||
                'รอตรวจสอบ'

              return (
                <div
                  key={
                    order.order_id
                  }
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"
                >

                  {/* Product image */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">

                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">

                      {productImage ? (
                        <img
                          src={
                            productImage
                          }
                          alt={
                            productName
                          }
                          className="h-full w-full object-cover"
                          onError={(
                            event,
                          ) => {
                            event.currentTarget.style.display =
                              'none'

                            event.currentTarget.nextElementSibling?.classList.remove(
                              'hidden',
                            )
                          }}
                        />
                      ) : null}

                      <div
                        className={`h-full w-full items-center justify-center text-gray-300 ${productImage
                            ? 'hidden'
                            : 'flex'
                          }`}
                      >
                        <i className="fa-solid fa-box text-xl" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-violet-600">
                        #PP-
                        {String(
                          order.order_id,
                        ).padStart(
                          4,
                          '0',
                        )}
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-gray-900">
                        {productName}
                      </p>

                      <p className="mt-1 text-[10px] text-gray-400">
                        {items.length}{' '}
                        รายการ ·{' '}
                        {quantity}{' '}
                        ชิ้น
                      </p>
                    </div>

                  </div>

                  {/* Date */}
                  <div className="lg:w-[150px]">
                    <p className="text-[10px] text-gray-400">
                      วันที่สั่งซื้อ
                    </p>

                    <p className="mt-1 text-xs font-semibold text-gray-700">
                      {formatDateTime(
                        order.created_at,
                      )}
                    </p>
                  </div>

                  {/* Payment */}
                  <div className="lg:w-[130px]">
                    <p className="text-[10px] text-gray-400">
                      การชำระเงิน
                    </p>

                    <p className="mt-1 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600">
                      {paymentLabel}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="lg:w-[150px]">
                    <p className="text-[10px] text-gray-400">
                      สถานะ
                    </p>

                    <p
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone[
                        rawStatus
                        ] ||
                        'bg-gray-50 text-gray-500'
                        }`}
                    >
                      {statusLabel}
                    </p>
                  </div>

                  {/* Total + detail */}
                  <div className="flex items-center justify-between gap-4 lg:w-[180px] lg:justify-end">

                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">
                        ยอดรวม
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-gray-900">
                        {money(
                          order.total_amount,
                        )}
                      </p>
                    </div>

                    <Link
                      to={`/home/admin/orders/${encodeURIComponent(
                        order.order_id,
                      )}`}
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                      title="ดูรายละเอียดคำสั่งซื้อ"
                    >
                      <i className="fa-regular fa-eye text-[10px]" />
                    </Link>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </section>

    </div>
  )
}