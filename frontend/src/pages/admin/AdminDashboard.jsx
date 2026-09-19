import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAdminOrders } from '../../api/orders.js'
import { getAdminUsers } from '../../api/users.js'
import { getProducts } from '../../api/products.js'

function unwrapData(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatMoney(value) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getOrderCustomer(order) {
  return (
    order?.user?.username ||
    order?.user?.name ||
    `User #${order?.user_id ?? '-'}`
  )
}

function getStatusLabel(status) {
  const map = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันออเดอร์แล้ว',
    shipped: 'กำลังจัดส่ง',
    deliveried: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
  }

  return map[status] || status || '-'
}

function getStatusClass(status) {
  const map = {
    pending: 'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    shipped: 'bg-purple-50 text-purple-700',
    deliveried: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  }

  return map[status] || 'bg-gray-100 text-gray-600'
}

function Card({ title, value, icon, description }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-extrabold text-gray-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f1edff] text-[#6d3df5]">
          <i className={`fa-solid ${icon}`} />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setErrorMessage('')

        const [ordersResponse, usersResponse, productsResponse] =
          await Promise.all([
            getAdminOrders(),
            getAdminUsers(),
            getProducts(),
          ])

        if (!mounted) return

        setOrders(unwrapData(ordersResponse))
        setUsers(unwrapData(usersResponse))
        setProducts(unwrapData(productsResponse))
      } catch (error) {
        console.error('Load admin dashboard error:', error)

        if (!mounted) return

        setErrorMessage(
          error?.message || 'ไม่สามารถโหลดข้อมูล Dashboard ได้',
        )
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  // =========================================================
  // KPI
  // =========================================================

  const totalRevenue = useMemo(() => {
    return orders
      .filter((order) => order?.order_status !== 'cancelled')
      .reduce(
        (sum, order) => sum + toNumber(order?.total_amount),
        0,
      )
  }, [orders])

  const totalOrders = orders.length

  const totalCustomers = useMemo(() => {
    return users.filter(
      (user) => (user?.user_role || user?.role) === 'user',
    ).length
  }, [users])

  const totalProducts = products.length

  // =========================================================
  // ยอดขาย 7 วันล่าสุด
  // =========================================================

  const sales7Days = useMemo(() => {
    const result = []

    const today = new Date()

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today)

      date.setHours(0, 0, 0, 0)
      date.setDate(today.getDate() - index)

      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')

      const total = orders
        .filter((order) => {
          if (order?.order_status === 'cancelled') {
            return false
          }

          if (!order?.created_at) {
            return false
          }

          const orderDate = new Date(order.created_at)

          if (Number.isNaN(orderDate.getTime())) {
            return false
          }

          const orderKey = [
            orderDate.getFullYear(),
            String(orderDate.getMonth() + 1).padStart(2, '0'),
            String(orderDate.getDate()).padStart(2, '0'),
          ].join('-')

          return orderKey === dateKey
        })
        .reduce(
          (sum, order) => sum + toNumber(order?.total_amount),
          0,
        )

      result.push({
        dateKey,
        label: date.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
        }),
        total,
      })
    }

    return result
  }, [orders])

  const maxSales = useMemo(() => {
    return Math.max(
      ...sales7Days.map((item) => item.total),
      1,
    )
  }, [sales7Days])

  // =========================================================
  // สั่งซื้อล่าสุด
  // =========================================================

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b?.created_at || 0).getTime() -
          new Date(a?.created_at || 0).getTime(),
      )
      .slice(0, 5)
  }, [orders])

  // =========================================================
  // สินค้าขายดี
  // =========================================================

  const topProducts = useMemo(() => {
    const productMap = new Map()

    for (const order of orders) {
      if (order?.order_status === 'cancelled') {
        continue
      }

      const items = Array.isArray(order?.items)
        ? order.items
        : []

      for (const item of items) {
        const productId = item?.product_id

        if (productId == null) {
          continue
        }

        const quantity = toNumber(item?.order_quantity)

        const previous = productMap.get(productId)

        if (previous) {
          previous.quantity += quantity
        } else {
          productMap.set(productId, {
            productId,
            name:
              item?.product_name ||
              `สินค้า #${productId}`,
            image: item?.product_image || '',
            quantity,
          })
        }
      }
    }

    return [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [orders])

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="p-5">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-[#6d3df5]" />
            <p className="mt-3 text-sm text-gray-500">
              กำลังโหลด Dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================
  // Error
  // =========================================================

  if (errorMessage) {
    return (
      <div className="p-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
          <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500" />

          <p className="mt-3 text-sm font-bold text-red-700">
            โหลด Dashboard ไม่สำเร็จ
          </p>

          <p className="mt-1 text-xs text-red-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5">

      {/* =====================================================
          Header
      ====================================================== */}
      <div className="mb-6">
        <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
          ภาพรวมร้านค้า
        </h1> 
      </div>

      {/* =====================================================
          KPI
      ====================================================== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <Card
          title="ยอดขายรวม"
          value={formatMoney(totalRevenue)}
          icon="fa-baht-sign"
          description="ไม่นับออเดอร์ที่ถูกยกเลิก"
        />

        <Card
          title="คำสั่งซื้อ"
          value={totalOrders.toLocaleString('th-TH')}
          icon="fa-receipt"
          description="รวมออเดอร์ที่ยกเลิก"
        />

        <Card
          title="ลูกค้า"
          value={totalCustomers.toLocaleString('th-TH')}
          icon="fa-users"
          description="เฉพาะบัญชี User"
        />

        <Card
          title="สินค้า"
          value={totalProducts.toLocaleString('th-TH')}
          icon="fa-box"
          description="สินค้าที่อยู่ในระบบ"
        />

      </section>

      {/* =====================================================
          Sales Chart
      ====================================================== */}
      <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              ยอดขาย 7 วันล่าสุด
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              คำนวณจากคำสั่งซื้อที่ไม่ถูกยกเลิก
            </p>
          </div>

          <i className="fa-solid fa-chart-column text-[#6d3df5]" />
        </div>

        <div className="mt-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max h-56 items-end gap-4 px-1 sm:gap-5">

          {sales7Days.map((item) => {
            const height =
              item.total > 0
                ? Math.max(
                    (item.total / maxSales) * 100,
                    8,
                  )
                : 3

            return (
              <div
                key={item.dateKey}
                className="flex w-[72px] shrink-0 flex-col items-center justify-end"
              >
                <div className="mb-2 whitespace-nowrap text-[10px] font-bold text-gray-500">
                  {item.total > 0
                    ? formatMoney(item.total)
                    : '฿0'}
                </div>

                <div className="flex h-36 w-full items-end justify-center">
                  <div
                    className="w-full max-w-10 rounded-t-xl bg-[#6d3df5] transition-all"
                    style={{
                      height: `${height}%`,
                    }}
                    title={`${item.label}: ${formatMoney(item.total)}`}
                  />
                </div>

                <div className="mt-2 text-[10px] text-gray-400">
                  {item.label}
                </div>
              </div>
            )
          })}

          </div>
        </div>
      </section>

      {/* =====================================================
          Recent Orders + Top Products
      ====================================================== */}
      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Recent Orders */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                คำสั่งซื้อล่าสุด
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                5 รายการล่าสุด
              </p>
            </div>

            <Link
              to="/home/admin/orders"
              className="text-xs font-bold text-[#6d3df5] hover:text-violet-700"
            >
              ดูทั้งหมด
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <i className="fa-solid fa-receipt text-2xl text-gray-300" />

              <p className="mt-2 text-sm text-gray-400">
                ยังไม่มีคำสั่งซื้อ
              </p>
            </div>
          ) : (
            <div>
              {recentOrders.map((order) => (
                <Link
                  key={order.order_id}
                  to={`/home/admin/orders/${order.order_id}`}
                  className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 transition hover:bg-gray-50 last:border-b-0"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1edff] text-[#6d3df5]">
                    <i className="fa-solid fa-receipt text-sm" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-gray-900">
                        #{order.order_id}
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusClass(
                          order.order_status,
                        )}`}
                      >
                        {getStatusLabel(order.order_status)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {getOrderCustomer(order)}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold text-gray-900">
                      {formatMoney(order.total_amount)}
                    </p>

                    <i className="fa-solid fa-chevron-right mt-1 text-[10px] text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>

        {/* Top Products */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                สินค้าขายดี
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                เรียงตามจำนวนที่ขายได้
              </p>
            </div>

            <Link
              to="/home/admin/products"
              className="text-xs font-bold text-[#6d3df5] hover:text-violet-700"
            >
              ดูสินค้า
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <i className="fa-solid fa-box-open text-2xl text-gray-300" />

              <p className="mt-2 text-sm text-gray-400">
                ยังไม่มีข้อมูลการขายสินค้า
              </p>
            </div>
          ) : (
            <div>
              {topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0"
                >
                  <div className="w-5 text-center text-xs font-extrabold text-gray-400">
                    {index + 1}
                  </div>

                  <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-gray-300">
                        <i className="fa-solid fa-box" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {product.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      สินค้า #{product.productId}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold text-[#6d3df5]">
                      {product.quantity.toLocaleString('th-TH')}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      ชิ้น
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </section>

    </div>
  )
}