import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminOrders } from '../../api/orders.js'

const tabs = [
  'ทั้งหมด',
  'รอดำเนินการ',
  'ยืนยันออเดอร์แล้ว',
  'กำลังจัดส่ง',
  'จัดส่งสำเร็จ',
  'ยกเลิก',
]

const tone = {
  'รอดำเนินการ': 'bg-violet-50 text-violet-600',
  'ยืนยันออเดอร์แล้ว': 'bg-indigo-50 text-indigo-600',
  'กำลังจัดส่ง': 'bg-blue-50 text-blue-600',
  'จัดส่งสำเร็จ': 'bg-green-50 text-green-700',
  'ยกเลิก': 'bg-red-50 text-red-500',
}

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

function normalizeOrder(order) {
  const createdAt = order.created_at
    ? new Date(order.created_at)
    : null

  const status =
    statusMap[order.order_status] ||
    order.order_status ||
    'รอดำเนินการ'

  const payment =
    paymentMap[order.payment_status] ||
    order.payment_status ||
    'รอตรวจสอบ'

  return {
    ...order,

    id: `#PP-${String(order.order_id).padStart(4, '0')}`,

    customer:
      order.user?.username ||
      order.user?.name ||
      `User #${order.user_id}`,

    total: Number(order.total_amount || 0),

    status,

    payment,

    shipping:
      order.order_status === 'deliveried'
        ? 'จัดส่งแล้ว'
        : order.order_status === 'shipped'
          ? 'กำลังจัดส่ง'
          : 'ยังไม่จัดส่ง',

    date: createdAt
      ? createdAt.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
      : '—',

    time: createdAt
      ? createdAt.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.'
      : '—',

    phone: '—',
  }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [tab, setTab] = useState('ทั้งหมด')
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('ทั้งหมด')
  const [toast, setToast] = useState('')

  const navigate = useNavigate()

  // =========================
  // Load Orders
  // =========================
  const loadOrders = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getAdminOrders()

      setOrders(
        Array.isArray(data)
          ? data.map(normalizeOrder)
          : []
      )
    } catch (err) {
      console.error('load admin orders error:', err)

      setError(
        err.message ||
        'ไม่สามารถโหลดคำสั่งซื้อได้'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // =========================
  // Filter
  // =========================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return orders.filter((order) => {
      const matchStatus =
        tab === 'ทั้งหมด' ||
        order.status === tab

      const matchPayment =
        paymentFilter === 'ทั้งหมด' ||
        order.payment === paymentFilter

      const searchableText = `
        ${order.id}
        ${order.customer}
        ${order.phone || ''}
        ${order.shipping || ''}
        ${order.status || ''}
      `.toLowerCase()

      const matchSearch =
        !q || searchableText.includes(q)

      return (
        matchStatus &&
        matchPayment &&
        matchSearch
      )
    })
  }, [
    orders,
    tab,
    search,
    paymentFilter,
  ])

  // =========================
  // Count each status
  // =========================
  const activeOrders = orders.filter(
    (order) =>
      order.order_status !== 'cancelled'
  )

  const counts = Object.fromEntries(
    tabs.map((item) => {
      if (item === 'ทั้งหมด') {
        return [
          item,
          orders.length,
        ]
      }

      return [
        item,
        orders.filter(
          (order) =>
            order.status === item
        ).length,
      ]
    })
  )

  // =========================
  // Total Amount
  // =========================
  const totalAmount = useMemo(() => {
    return orders
      .filter(
        (order) =>
          order.order_status !== 'cancelled'
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(order.total || 0),
        0
      )
  }, [orders])

  // =========================
  // Export CSV
  // =========================
  const exportData = () => {
    const csv = [
      'Order ID,Customer,Total,Status,Payment,Shipping',
      ...orders.map(
        (order) =>
          `"${order.id}","${order.customer}",${order.total},"${order.status}","${order.payment}","${order.shipping}"`
      ),
    ].join('\n')

    const blob = new Blob(
      [`\uFEFF${csv}`],
      {
        type: 'text/csv;charset=utf-8',
      }
    )

    const url =
      URL.createObjectURL(blob)

    const a =
      document.createElement('a')

    a.href = url
    a.download = 'petshop-orders.csv'

    a.click()

    URL.revokeObjectURL(url)

    setToast(
      'ส่งออกข้อมูลคำสั่งซื้อแล้ว'
    )

    setTimeout(
      () => setToast(''),
      2200
    )
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">

      {/* =========================
          Header
      ========================= */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
            <span>หน้าหลัก</span>

            <i className="fa-solid fa-chevron-right text-[9px]" />

            <span>คำสั่งซื้อ</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            จัดการคำสั่งซื้อ
          </h1>

          <p className="mt-1 text-xs text-gray-400">
            ตรวจสอบคำสั่งซื้อ การชำระเงิน และข้อมูลจัดส่ง
          </p>
        </div>

        <button
          type="button"
          onClick={exportData}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 md:self-auto"
        >
          <i className="fa-solid fa-download" />
          ส่งออกข้อมูล
        </button>
      </div>

      {/* =========================
          Summary Cards
      ========================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total */}
        <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <i className="fa-solid fa-receipt" />
            </div>

            <div>
              <p className="text-[11px] text-gray-400">
                คำสั่งซื้อทั้งหมด
              </p>

              <p className="text-lg font-bold text-gray-900">
                {orders.length}
              </p>
            </div>

          </div>
        </div>

        {/* Pending */}
        <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <i className="fa-solid fa-clock" />
            </div>

            <div>
              <p className="text-[11px] text-gray-400">
                รอดำเนินการ
              </p>

              <p className="text-lg font-bold text-gray-900">
                {counts['รอดำเนินการ']}
              </p>
            </div>

          </div>
        </div>

        {/* Shipping */}
        <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <i className="fa-solid fa-truck" />
            </div>

            <div>
              <p className="text-[11px] text-gray-400">
                กำลังจัดส่ง
              </p>

              <p className="text-lg font-bold text-gray-900">
                {counts['กำลังจัดส่ง']}
              </p>
            </div>

          </div>
        </div>

        {/* Total Amount */}
        <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <i className="fa-solid fa-baht-sign" />
            </div>

            <div>
              <p className="text-[11px] text-gray-400">
                ยอดขายรวม
              </p>

              <p className="text-lg font-bold text-gray-900">
                ฿
                {totalAmount.toLocaleString(
                  'th-TH'
                )}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* =========================
          Search / Filter
      ========================= */}
      <div className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-sm">

        <div className="flex flex-col gap-2 md:flex-row">

          {/* Search */}
          <div className="relative flex-1">

            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="ค้นหาเลขคำสั่งซื้อ ชื่อลูกค้า เบอร์โทร หรือเลขพัสดุ..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-violet-300"
            />

          </div>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(
                e.target.value
              )
            }
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 outline-none focus:border-violet-300"
          >
            <option value="ทั้งหมด">
              ทั้งหมด
            </option>

            <option value="รอตรวจสอบ">
              รอตรวจสอบ
            </option>

            <option value="ชำระแล้ว">
              ชำระแล้ว
            </option>

            <option value="ยกเลิก">
              ยกเลิก
            </option>
          </select>

        </div>

      </div>

      {/* =========================
          Status Tabs
      ========================= */}
      <div className="overflow-x-auto rounded-xl border border-[#ececf2] bg-white shadow-sm">

        <div className="flex min-w-max items-center gap-1 p-1.5">

          {tabs.map((item) => {
            const active =
              tab === item

            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setTab(item)
                }
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
              >
                {item}

                <span
                  className={`ml-1 ${active
                    ? 'text-white/80'
                    : 'text-gray-400'
                    }`}
                >
                  {counts[item] || 0}
                </span>
              </button>
            )
          })}

        </div>

      </div>

      {/* =========================
          Loading
      ========================= */}
      {loading && (
        <div className="rounded-xl border border-[#ececf2] bg-white p-12 text-center text-xs text-gray-400">
          <i className="fa-solid fa-spinner fa-spin mr-2" />
          กำลังโหลดคำสั่งซื้อ...
        </div>
      )}

      {/* =========================
          Error
      ========================= */}
      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-xs font-bold text-red-500">
          {error}

          <button
            type="button"
            onClick={loadOrders}
            className="ml-3 underline"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* =========================
          Table
      ========================= */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px] text-left">

              <thead>
                <tr className="border-b border-[#f0f0f3] bg-gray-50/60">

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">
                    เลขที่คำสั่งซื้อ
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">
                    ลูกค้า
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">
                    วันที่
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">
                    ยอดชำระ
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">
                    การชำระเงิน
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">
                    จัดส่ง
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">
                    สถานะ
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400">
                    จัดการ
                  </th>

                </tr>
              </thead>

              <tbody>

                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-14 text-center"
                    >
                      <div className="text-gray-300">
                        <i className="fa-solid fa-box-open text-3xl" />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-gray-500">
                        ไม่พบคำสั่งซื้อ
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        ลองเปลี่ยนตัวกรองหรือคำค้นหา
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr
                      key={order.order_id}
                      className="border-b border-[#f0f0f3] last:border-b-0 hover:bg-gray-50/50"
                    >

                      {/* Order ID */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-violet-600">
                          {order.id}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {order.customer}
                          </p>

                          {order.phone !== '—' && (
                            <p className="mt-0.5 text-[10px] text-gray-400">
                              {order.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-800">
                          {order.date}
                        </p>

                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {order.time}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-gray-900">
                          ฿
                          {order.total.toLocaleString(
                            'th-TH',
                            {
                              minimumFractionDigits: 0,
                            }
                          )}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${order.payment ===
                            'ชำระแล้ว'
                            ? 'bg-green-50 text-green-600'
                            : order.payment ===
                              'ยกเลิก'
                              ? 'bg-red-50 text-red-500'
                              : 'bg-orange-50 text-orange-600'
                            }`}
                        >
                          {order.payment}
                        </span>
                      </td>

                      {/* Shipping */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {order.shipping}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${tone[order.status] ||
                            'bg-gray-50 text-gray-500'
                            }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/home/admin/orders/${order.order_id}`
                            )
                          }
                          title="ดูรายละเอียด"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                        >
                          <i className="fa-regular fa-eye text-xs" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

          {/* Footer */}
          <div className="border-t border-[#f0f0f3] px-4 py-3 text-center text-[10px] text-gray-400">
            แสดง {filtered.length} จาก {orders.length} คำสั่งซื้อ
          </div>

        </div>
      )}

      {/* =========================
          Toast
      ========================= */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-xs font-bold text-white shadow-lg">
          <i className="fa-solid fa-circle-check mr-2" />
          {toast}
        </div>
      )}

    </div>
  )
}