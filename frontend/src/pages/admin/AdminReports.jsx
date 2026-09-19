import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAdminOrders } from '../../api/orders.js'
import { getAdminUsers } from '../../api/users.js'
import { getProducts } from '../../api/products.js'

const money = (value) => `฿${Number(value || 0).toLocaleString('th-TH')}`
const pad = (value) => String(value).padStart(2, '0')
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const dateKey = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const thaiDate = (value) => {
  if (!value) return '-'
  const parts = String(value).split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return value
  const [year, month, day] = parts
  const names = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return `${day} ${names[month - 1] || ''} ${year + 543}`
}
const isCancelled = (order) => (String(order?.order_status || '').toLowerCase() === 'cancelled')
const orderDate = (order) => dateKey(order?.createdAt || order?.createdDate || order?.orderedAt || order?.created_at || order?.date) || todayKey()

export default function AdminReports() {
  const [data, setData] = useState({
    orders: [],
    users: [],
    products: [],
  })
  const [range, setRange] = useState('ทั้งหมด')
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [fromDate, setFromDate] = useState(todayKey())
  const [toDate, setToDate] = useState(todayKey())

  useEffect(() => {
    let active = true

    const loadReports = async () => {
      try {
        const [ordersResponse, usersResponse, productsResponse,] = await Promise.all([
          getAdminOrders(), getAdminUsers(), getProducts(),
        ])

        const orders = Array.isArray(ordersResponse) ? ordersResponse : []

        const users = Array.isArray(usersResponse) ? usersResponse : []

        const products = Array.isArray(productsResponse) ? productsResponse : []

        if (active) {
          setData({ orders, users, products, })
        }
      } catch (error) {
        console.error('Load admin reports error:', error,
        )
      }
    }

    loadReports()

    return () => { active = false }
  }, [])

  const orders = Array.isArray(data?.orders) ? data.orders : []
  const users = Array.isArray(data?.users) ? data.users : []
  const products = Array.isArray(data?.products) ? data.products : []

  const filteredOrders = useMemo(() => {
    if (range === 'รายวัน') return orders.filter((order) => orderDate(order) === selectedDate)
    if (range === 'เดือนนี้') {
      const month = todayKey().slice(0, 7)
      return orders.filter((order) => orderDate(order).slice(0, 7) === month)
    }
    if (range === '7 วันล่าสุด') {
      const end = new Date(`${todayKey()}T23:59:59`)
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      return orders.filter((order) => {
        const d = new Date(`${orderDate(order)}T12:00:00`)
        return d >= start && d <= end
      })
    }
    if (range === 'กำหนดช่วง') {
      const start = fromDate <= toDate ? fromDate : toDate
      const end = fromDate <= toDate ? toDate : fromDate
      return orders.filter((order) => {
        const d = orderDate(order)
        return d >= start && d <= end
      })
    }
    return orders
  }, [orders, range, selectedDate, fromDate, toDate])

  const completedOrders = filteredOrders.filter((order) => order?.payment_status === 'paid')
  const cancelledCount = filteredOrders.filter(isCancelled).length
  const revenue = completedOrders.reduce((sum, order) => sum + Number(order?.total_amount || 0), 0)
  const totalSold = completedOrders.reduce((sum, order) => {
    const items = Array.isArray(order?.items) ? order.items : []
    return (sum + items.reduce((itemSum, item) => itemSum + Math.max(0, Number(item?.order_quantity) || 0,), 0,))
  }, 0,)
  const dailyRows = useMemo(() => {
    const map = new Map()
    filteredOrders.forEach((order) => {
      const key = orderDate(order)
      const row = map.get(key) || { date: key, orders: 0, revenue: 0 }
      row.orders += 1
      if (order?.payment_status === 'paid') row.revenue += Number(order?.total_amount || 0)
      map.set(key, row)
    })
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
  }, [filteredOrders])

  const topProducts = useMemo(() => {
    const productMap = new Map()

    for (const order of completedOrders) {
      const items = Array.isArray(order?.items)
        ? order.items
        : []

      for (const item of items) {
        const productId = item?.product_id

        if (productId == null) {
          continue
        }

        const quantity = Math.max(
          0,
          Number(item?.order_quantity) || 0,
        )

        const unitPrice = Number(
          item?.order_price || 0,
        )

        const itemRevenue =
          unitPrice * quantity

        const existing =
          productMap.get(productId)

        if (existing) {
          existing.quantity += quantity
          existing.revenue += itemRevenue
        } else {
          const product = products.find(
            (itemProduct) =>
              Number(itemProduct?.id) ===
              Number(productId),
          )

          productMap.set(productId, {
            id: productId,
            name:
              item?.product_name ||
              product?.name ||
              `สินค้า #${productId}`,
            category:
              product?.category ||
              'ไม่ระบุหมวดหมู่',
            stock:
              product?.stock || 0,
            image:
              item?.product_image ||
              product?.image ||
              '',
            quantity,
            revenue: itemRevenue,
          })
        }
      }
    }

    return [...productMap.values()]
      .sort(
        (a, b) =>
          b.quantity - a.quantity,
      )
      .slice(0, 5)
  }, [completedOrders, products])

  const topCustomers = useMemo(() => {
    return users
      .map((user) => {
        const userId = Number(user?.user_id || 0,)
        const matched = completedOrders.filter((order) => Number(order?.user_id || 0) === userId,)

        return {
          ...user,
          id: userId,
          name: user?.username || `User #${userId}`,
          orderCount: matched.length,
          spend: matched.reduce(
            (sum, order) => sum + Number(order?.total_amount || 0,), 0,),
        }
      }).filter((customer) => customer.orderCount > 0,
      ).sort((a, b) => b.spend - a.spend,).slice(0, 5)
  }, [users, completedOrders])

  const buyingCustomerIds = useMemo(() => {
    return new Set(completedOrders.map((order) => Number(order?.user_id || 0),).filter(Boolean),)
  }, [completedOrders])

  const repeatCustomers = useMemo(() => {
    const orderCountMap = new Map()
    for (const order of completedOrders) {
      const userId = Number(order?.user_id || 0,)
      if (!userId) { continue }
      orderCountMap.set(userId, (orderCountMap.get(userId) || 0) + 1,)
    }

    return [...orderCountMap.values()].filter((count) => count > 1,).length
  }, [completedOrders])

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-medium text-gray-400">Admin / Reports</div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">รายงานและสถิติ</h1>

        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {['ทั้งหมด', 'เดือนนี้', '7 วันล่าสุด', 'รายวัน', 'กำหนดช่วง'].map((item) => (
              <button key={item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${range === item ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                {item}
              </button>
            ))}
          </div>
          {range === 'รายวัน' && (
            <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 shadow-sm">
              <i className="fa-regular fa-calendar text-violet-600" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-xs font-semibold text-gray-600 outline-none" />
            </label>
          )}
          {range === 'กำหนดช่วง' && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <label className="flex items-center gap-2 px-2"><span className="text-[9px] font-bold text-gray-400">จาก</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-xs font-semibold text-gray-600 outline-none" /></label>
              <span className="text-gray-300">→</span>
              <label className="flex items-center gap-2 px-2"><span className="text-[9px] font-bold text-gray-400">ถึง</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-xs font-semibold text-gray-600 outline-none" /></label>
            </div>
          )}
        </div>
      </div>

      {range === 'รายวัน' && <RangeBanner text={`กำลังดูข้อมูลของวันที่ ${thaiDate(selectedDate)}`} onReset={() => setSelectedDate(todayKey())} />}
      {range === 'กำหนดช่วง' && <RangeBanner text={`กำลังดูข้อมูล ${thaiDate(fromDate)} — ${thaiDate(toDate)}`} onReset={() => { setFromDate(todayKey()); setToDate(todayKey()) }} />}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric icon="fa-sack-dollar" label="ยอดขาย" value={money(revenue)} note={`${completedOrders.length} ออเดอร์ที่ไม่ถูกยกเลิก`} />
        <Metric icon="fa-cart-shopping" label="คำสั่งซื้อ" value={filteredOrders.length.toLocaleString('th-TH')} note={`ยกเลิก ${cancelledCount} รายการ`} />
        <Metric icon="fa-users" label="ลูกค้า" value={users.length.toLocaleString('th-TH')} note="บัญชีในระบบ" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <Card title="ยอดขายตามช่วงเวลา" subtitle={range === 'ทั้งหมด' ? 'ภาพรวมคำสั่งซื้อทั้งหมด' : `ตัวกรอง: ${range}`}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">รายได้จากออเดอร์</p>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">{money(revenue)}</p>
              <div className="mt-5 flex h-24 items-end gap-2">
                {dailyRows.length ? dailyRows.slice(0, 7).reverse().map((row) => {
                  const max = Math.max(...dailyRows.map((item) => item.revenue), 1)
                  const height = Math.max(8, Math.round((row.revenue / max) * 100))
                  return <div key={row.date} title={`${thaiDate(row.date)} ${money(row.revenue)}`} className="flex-1 rounded-t-lg bg-violet-500/80" style={{ height: `${height}%` }} />
                }) : [20, 20, 20, 20, 20, 20, 20].map((height, index) => <div key={index} className="flex-1 rounded-t-lg bg-gray-200" style={{ height: `${height}%` }} />)}
              </div>
              <p className="mt-2 text-[9px] text-gray-400">แท่งกราฟอ้างอิงจากยอดขายจริงของวันที่มีคำสั่งซื้อ</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-xs font-semibold text-gray-500">สถานะคำสั่งซื้อ</p>
              <div className="mt-5 space-y-3">
                <Bar label="สำเร็จ/ดำเนินการ" value={completedOrders.length} total={Math.max(filteredOrders.length, 1)} />
                <Bar label="ยกเลิก" value={cancelledCount} total={Math.max(filteredOrders.length, 1)} />
              </div>
              <div className="mt-5 border-t border-gray-200 pt-4"><span className="text-[10px] text-gray-400">ยอดเฉลี่ยต่อออเดอร์</span><b className="ml-2 text-sm">{money(completedOrders.length ? revenue / completedOrders.length : 0)}</b></div>
            </div>
          </div>
        </Card>
        <Card title="สรุปธุรกิจ" subtitle="ตัวชี้วัดสำคัญ">
          <div className="space-y-3">
            <Summary icon="fa-box" label="สินค้าทั้งหมด" value={products.length} />
            <Summary icon="fa-layer-group" label="จำนวนชิ้นที่ขาย" value={totalSold.toLocaleString('th-TH')} />
          </div>
          <Link to="/home/admin/products" className="mt-5 block rounded-xl bg-violet-600 py-2.5 text-center text-xs font-bold text-white hover:bg-violet-700">จัดการสินค้า</Link>
        </Card>
      </section>

      <Card title="สรุปรายวัน" subtitle="แยกยอดขายและจำนวนคำสั่งซื้อ">
        {dailyRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b border-gray-100 text-[10px] text-gray-400"><th className="pb-3">วันที่</th><th>คำสั่งซื้อ</th><th>ยอดขาย</th><th>เฉลี่ย / ออเดอร์</th><th /></tr></thead><tbody>{dailyRows.map((row) => <tr key={row.date} className="border-b border-gray-50 last:border-0"><td className="py-4 font-bold text-gray-700">{thaiDate(row.date)}</td><td className="py-4">{row.orders} รายการ</td><td className="py-4 font-bold text-violet-600">{money(row.revenue)}</td><td className="py-4 text-gray-500">{money(row.orders ? row.revenue / row.orders : 0)}</td><td className="text-right"><button onClick={() => { setRange('รายวัน'); setSelectedDate(row.date) }} className="rounded-lg bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-600">ดูวันนี้</button></td></tr>)}</tbody></table></div> : <Empty text="ยังไม่มีข้อมูลคำสั่งซื้อในช่วงเวลานี้" />}
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card title="สินค้ายอดนิยม" subtitle="เรียงตามจำนวนที่ขาย">
          <div className="space-y-2">
            {topProducts.length ? (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-gray-50">
                  {/* อันดับ */}
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600">
                    {index + 1}
                  </span>

                  {/* รูป */}
                  <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-gray-300">
                        <i className="fa-solid fa-box" />
                      </div>
                    )}
                  </div>

                  {/* ข้อมูลสินค้า */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-gray-700">
                      {product.name}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400">
                      {product.category}{' · '} คงเหลือ {product.stock}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-[10px] text-gray-500">
                        ขายได้{' '}
                        <b className="text-gray-700">
                          {Number(product.quantity || 0,).toLocaleString('th-TH')}
                        </b>{' '}
                        ชิ้น
                      </span>

                      <span className="text-[10px] text-violet-600">
                        รวมทั้งหมด{' '}
                        <b>
                          {Number(product.revenue || 0).toLocaleString('th-TH')}฿
                        </b>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty text="ยังไม่มีข้อมูลสินค้าที่ขาย" />
            )}
          </div>
        </Card>
        <Card title="ลูกค้าที่มียอดซื้อสูงสุด" subtitle="จากคำสั่งซื้อที่เชื่อมกับบัญชี">
          <div className="space-y-2">{topCustomers.filter((customer) => customer.spend > 0).length ? topCustomers.filter((customer) => customer.spend > 0).map((customer, index) => <div key={customer.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50"><span className="grid size-8 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-gray-700">{customer.name}</p><p className="mt-1 text-[10px] text-gray-400">{customer.orderCount} ออเดอร์</p></div><b className="text-xs text-violet-600">{money(customer.spend)}</b></div>) : <Empty text="ยังไม่มีออเดอร์ที่เชื่อมกับลูกค้า" />}</div>
        </Card>
      </section>

      <Card title="วิเคราะห์พฤติกรรมลูกค้า" subtitle="สรุปจากบัญชีและคำสั่งซื้อในช่วงเวลาที่เลือก">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary icon="fa-user-check" label="ลูกค้าที่ซื้อในช่วงนี้" value={buyingCustomerIds.size} />
          <Summary icon="fa-user-clock" label="ลูกค้าที่ไม่มีออเดอร์" value={users.filter((user) => !buyingCustomerIds.has(Number(user?.user_id || 0))).length} />
          <Summary icon="fa-repeat" label="ลูกค้าซื้อซ้ำ" value={repeatCustomers} />
          <Summary icon="fa-chart-line" label="อัตรายกเลิก" value={`${filteredOrders.length ? Math.round((cancelledCount / filteredOrders.length) * 100) : 0}%`} />
        </div>
        <div className="mt-4 rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-gray-700">พฤติกรรมการซื้อ</p><p className="mt-1 text-[10px] text-gray-400">ใช้สำหรับดูแนวโน้ม Customer และวางแผนโปรโมชั่น</p></div><i className="fa-solid fa-user-chart text-violet-500" /></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-white p-3"><p className="text-[10px] text-gray-400">ค่าใช้จ่ายเฉลี่ย /  ลูกค้าที่ซื้อ</p><b className="mt-1 block text-base">{money(buyingCustomerIds.size ? revenue / buyingCustomerIds.size : 0)}</b></div>
            <div className="rounded-xl bg-white p-3"><p className="text-[10px] text-gray-400">ออเดอร์เฉลี่ย / ลูกค้า</p><b className="mt-1 block text-base">{buyingCustomerIds.size ? (completedOrders.length / buyingCustomerIds.size).toFixed(1) : '0.0'}</b></div>
            <div className="rounded-xl bg-white p-3"> <p className="text-[10px] text-gray-400">อัตราซื้อซ้ำ</p> <b className="mt-1 block text-base">{buyingCustomerIds.size ? `${Math.round((repeatCustomers / buyingCustomerIds.size) * 100,)}%` : '0%'}</b></div>
          </div>
        </div>
      </Card>

    </div>
  )
}

function RangeBanner({ text, onReset }) {
  return <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4"><b className="text-sm text-violet-800">{text}</b><button onClick={onReset} className="rounded-lg bg-white px-3 py-2 text-[10px] font-bold text-violet-600 shadow-sm">วันนี้</button></div>
}
function Metric({ icon, label, value, note }) { return <div className="h-full rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{value}</p></div><span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-600"><i className={`fa-solid ${icon}`} /></span></div><p className="mt-4 text-[10px] text-gray-400">{note}</p></div> }
function Card({ title, subtitle, children }) { return <div className="h-full rounded-xl border border-[#ececf2] bg-white shadow-sm"><div className="px-5 py-5 md:px-6"><h2 className="text-sm font-bold text-gray-900">{title}</h2><p className="mt-1 text-[11px] text-gray-400">{subtitle}</p></div><div className="border-t border-gray-100 px-5 pb-5 md:px-6 md:pb-6">{children}</div></div> }
function Bar({ label, value, total }) { const percent = Math.round((value / total) * 100); return <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-500">{label}</span><b>{value}</b></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} /></div></div> }
function Summary({ icon, label, value }) { return <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"><span className="grid size-9 place-items-center rounded-lg bg-white text-violet-600 shadow-sm"><i className={`fa-solid ${icon} text-xs`} /></span><div><p className="text-[10px] text-gray-400">{label}</p><b className="text-sm text-gray-800">{value}</b></div></div> }
function Empty({ text }) { return <div className="py-8 text-center text-xs text-gray-400">{text}</div> }
