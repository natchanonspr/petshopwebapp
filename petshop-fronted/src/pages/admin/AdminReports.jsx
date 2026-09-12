import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAdminData } from '../../admin/data.js'

const AI_KEY = 'petshop_ai_management_v1'

const readAI = () => {
  try { return JSON.parse(localStorage.getItem(AI_KEY) || 'null') || {} } catch { return {} }
}

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
const isCancelled = (order) => ['ยกเลิก', 'ยกเลิกแล้ว', 'cancelled'].includes(String(order?.status || '').toLowerCase())
const orderDate = (order) => dateKey(order?.createdAt || order?.createdDate || order?.orderedAt || order?.created_at || order?.date) || todayKey()

export default function AdminReports() {
  const [data, setData] = useState(() => loadAdminData())
  const [range, setRange] = useState('ทั้งหมด')
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [fromDate, setFromDate] = useState(todayKey())
  const [toDate, setToDate] = useState(todayKey())
  const [ai, setAI] = useState(() => readAI())

  useEffect(() => {
    const refresh = () => { setData(loadAdminData()); setAI(readAI()) }
    window.addEventListener('petshop-admin-data-updated', refresh)
    window.addEventListener('petshop-orders-updated', refresh)
    return () => {
      window.removeEventListener('petshop-admin-data-updated', refresh)
      window.removeEventListener('petshop-orders-updated', refresh)
    }
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

  const completedOrders = filteredOrders.filter((order) => !isCancelled(order))
  const cancelledCount = filteredOrders.filter(isCancelled).length
  const revenue = completedOrders.reduce((sum, order) => sum + Number(order?.total || order?.grandTotal || 0), 0)
  const totalSold = products.reduce((sum, product) => sum + Number(product?.sold || 0), 0)

  const dailyRows = useMemo(() => {
    const map = new Map()
    filteredOrders.forEach((order) => {
      const key = orderDate(order)
      const row = map.get(key) || { date: key, orders: 0, revenue: 0 }
      row.orders += 1
      if (!isCancelled(order)) row.revenue += Number(order?.total || order?.grandTotal || 0)
      map.set(key, row)
    })
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
  }, [filteredOrders])

  const topProducts = [...products].sort((a, b) => Number(b?.sold || 0) - Number(a?.sold || 0)).slice(0, 5)
  const topCustomers = users.map((user) => {
    const id = Number(user?.customerId || user?.id || 0)
    const matched = completedOrders.filter((order) => Number(order?.userId || order?.customerId || 0) === id)
    return { ...user, orderCount: matched.length, spend: matched.reduce((sum, order) => sum + Number(order?.total || 0), 0) }
  }).sort((a, b) => b.spend - a.spend).slice(0, 5)

  const aiRecommendations = Array.isArray(ai.recommendations) ? ai.recommendations : []
  const reviewedAI = aiRecommendations.filter((item) => typeof item.correct === 'boolean')
  const correctAI = reviewedAI.filter((item) => item.correct === true).length
  const aiAccuracy = reviewedAI.length ? Math.round((correctAI / reviewedAI.length) * 100) : 0
  const aiProducts = new Map()
  aiRecommendations.forEach((item) => (item.productIds || []).forEach((id) => aiProducts.set(id, (aiProducts.get(id) || 0) + 1)))
  const topAIProducts = [...aiProducts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-medium text-gray-400">Admin / Reports</div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">รายงานและสถิติ</h1>
          <p className="mt-1 text-xs text-gray-500">สรุปยอดขาย คำสั่งซื้อ ลูกค้า และข้อมูลสำคัญของร้าน</p>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon="fa-sack-dollar" label="ยอดขาย" value={money(revenue)} note={`${completedOrders.length} ออเดอร์ที่ไม่ถูกยกเลิก`} />
        <Metric icon="fa-cart-shopping" label="คำสั่งซื้อ" value={filteredOrders.length.toLocaleString('th-TH')} note={`ยกเลิก ${cancelledCount} รายการ`} />
        <Metric icon="fa-users" label="ลูกค้า" value={users.length.toLocaleString('th-TH')} note="บัญชีในระบบ" />
        <Metric icon="fa-brain" label="AI Recommendation" value={data?.ai?.enabled === false ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} note={`${data?.ai?.nutrition?.length || 0} รายการโภชนาการ`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <Card title="ยอดขายตามช่วงเวลา" subtitle={range === 'ทั้งหมด' ? 'ภาพรวมคำสั่งซื้อทั้งหมด' : `ตัวกรอง: ${range}`}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-5">
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
            <Summary icon="fa-ticket" label="โปรโมชั่นที่เปิดใช้" value={(data?.coupons || []).filter((coupon) => coupon.active).length} />
            <Summary icon="fa-bell" label="การแจ้งเตือน" value={(data?.notifications || []).length} />
          </div>
          <Link to="/home/admin/products" className="mt-5 block rounded-xl bg-violet-600 py-2.5 text-center text-xs font-bold text-white hover:bg-violet-700">จัดการสินค้า</Link>
        </Card>
      </section>

      <Card title="สรุปรายวัน" subtitle="แยกยอดขายและจำนวนคำสั่งซื้อ">
        {dailyRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b border-gray-100 text-[10px] text-gray-400"><th className="pb-3">วันที่</th><th>คำสั่งซื้อ</th><th>ยอดขาย</th><th>เฉลี่ย / ออเดอร์</th><th /></tr></thead><tbody>{dailyRows.map((row) => <tr key={row.date} className="border-b border-gray-50 last:border-0"><td className="py-4 font-bold text-gray-700">{thaiDate(row.date)}</td><td className="py-4">{row.orders} รายการ</td><td className="py-4 font-bold text-violet-600">{money(row.revenue)}</td><td className="py-4 text-gray-500">{money(row.orders ? row.revenue / row.orders : 0)}</td><td className="text-right"><button onClick={() => { setRange('รายวัน'); setSelectedDate(row.date) }} className="rounded-lg bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-600">ดูวันนี้</button></td></tr>)}</tbody></table></div> : <Empty text="ยังไม่มีข้อมูลคำสั่งซื้อในช่วงเวลานี้" />}
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card title="สินค้าขายดี" subtitle="เรียงตามจำนวนที่ขาย">
          <div className="space-y-2">{topProducts.length ? topProducts.map((product, index) => <div key={product.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50"><span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-gray-700">{product.name}</p><p className="mt-1 text-[10px] text-gray-400">{product.category || 'ไม่ระบุหมวดหมู่'} · คงเหลือ {product.stock || 0}</p></div><b className="text-xs">{Number(product.sold || 0).toLocaleString('th-TH')} ชิ้น</b></div>) : <Empty text="ยังไม่มีข้อมูลสินค้า" />}</div>
        </Card>
        <Card title="ลูกค้าที่มียอดซื้อสูงสุด" subtitle="จากคำสั่งซื้อที่เชื่อมกับบัญชี">
          <div className="space-y-2">{topCustomers.filter((customer) => customer.spend > 0).length ? topCustomers.filter((customer) => customer.spend > 0).map((customer, index) => <div key={customer.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50"><span className="grid size-8 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-gray-700">{customer.name}</p><p className="mt-1 text-[10px] text-gray-400">{customer.orderCount} ออเดอร์</p></div><b className="text-xs text-violet-600">{money(customer.spend)}</b></div>) : <Empty text="ยังไม่มีออเดอร์ที่เชื่อมกับลูกค้า" />}</div>
        </Card>
      </section>

      <Card title="วิเคราะห์พฤติกรรมลูกค้า" subtitle="สรุปจากบัญชีและคำสั่งซื้อในช่วงเวลาที่เลือก">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary icon="fa-user-check" label="ลูกค้าที่ซื้อในช่วงนี้" value={new Set(completedOrders.map((order) => Number(order?.userId || order?.customerId || 0)).filter(Boolean)).size} />
          <Summary icon="fa-user-clock" label="ลูกค้าที่ไม่มีออเดอร์" value={users.filter((user) => !completedOrders.some((order) => Number(order?.userId || order?.customerId || 0) === Number(user?.customerId || user?.id || 0))).length} />
          <Summary icon="fa-repeat" label="ลูกค้าซื้อซ้ำ" value={topCustomers.filter((customer) => customer.orderCount > 1).length} />
          <Summary icon="fa-chart-line" label="อัตรายกเลิก" value={`${filteredOrders.length ? Math.round((cancelledCount / filteredOrders.length) * 100) : 0}%`} />
        </div>
        <div className="mt-4 rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-gray-700">พฤติกรรมการซื้อ</p><p className="mt-1 text-[10px] text-gray-400">ใช้สำหรับดูแนวโน้ม Customer และวางแผนโปรโมชั่น</p></div><i className="fa-solid fa-user-chart text-violet-500" /></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-white p-3"><p className="text-[10px] text-gray-400">ค่าใช้จ่ายเฉลี่ย / ลูกค้าที่ซื้อ</p><b className="mt-1 block text-base">{money(new Set(completedOrders.map((order) => Number(order?.userId || order?.customerId || 0)).filter(Boolean)).size ? revenue / new Set(completedOrders.map((order) => Number(order?.userId || order?.customerId || 0)).filter(Boolean)).size : 0)}</b></div><div className="rounded-xl bg-white p-3"><p className="text-[10px] text-gray-400">ออเดอร์เฉลี่ย / ลูกค้า</p><b className="mt-1 block text-base">{new Set(completedOrders.map((order) => Number(order?.userId || order?.customerId || 0)).filter(Boolean)).size ? (completedOrders.length / new Set(completedOrders.map((order) => Number(order?.userId || order?.customerId || 0)).filter(Boolean)).size).toFixed(1) : '0.0'}</b></div><div className="rounded-xl bg-white p-3"><p className="text-[10px] text-gray-400">สถานะสมาชิกที่ใช้งาน</p><b className="mt-1 block text-base">{users.filter((user) => user.status === 'active').length} คน</b></div></div>
        </div>
      </Card>

      <Card title="รายงานการใช้งาน AI" subtitle={`ข้อมูล Recommendation จาก ${ai.provider === 'luna' ? 'Luna' : 'Gemini'}`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Summary icon="fa-toggle-on" label="สถานะ" value={ai.enabled === false ? 'ปิด' : 'เปิด'} /><Summary icon="fa-robot" label="Provider" value={ai.provider === 'luna' ? 'Luna' : 'Gemini'} /><Summary icon="fa-wand-magic-sparkles" label="Recommendation" value={aiRecommendations.length} /><Summary icon="fa-bullseye" label="Accuracy" value={`${aiAccuracy}%`} /></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-gray-50 p-4"><div className="text-xs font-bold text-gray-700">ผลการตรวจสอบ AI</div><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-3"><div className="text-[10px] text-gray-400">ตรวจแล้ว</div><b className="text-lg">{reviewedAI.length}</b></div><div className="rounded-xl bg-white p-3"><div className="text-[10px] text-gray-400">ถูกต้อง</div><b className="text-lg text-emerald-600">{correctAI}</b></div></div></div><div className="rounded-2xl bg-gray-50 p-4"><div className="text-xs font-bold text-gray-700">สินค้าที่ AI แนะนำบ่อย</div><div className="mt-3 space-y-2">{topAIProducts.length ? topAIProducts.map(([id, count]) => <div key={id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs"><span>สินค้า #{id}</span><b className="text-violet-600">{count} ครั้ง</b></div>) : <span className="text-xs text-gray-400">ยังไม่มีข้อมูล</span>}</div></div></div>
        <Link to="/home/admin/settings" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-violet-600">ไปจัดการ AI Management <i className="fa-solid fa-arrow-right" /></Link>
      </Card>
    </div>
  )
}

function RangeBanner({ text, onReset }) {
  return <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4"><b className="text-sm text-violet-800">{text}</b><button onClick={onReset} className="rounded-lg bg-white px-3 py-2 text-[10px] font-bold text-violet-600 shadow-sm">วันนี้</button></div>
}
function Metric({ icon, label, value, note }) { return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{value}</p></div><span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-600"><i className={`fa-solid ${icon}`} /></span></div><p className="mt-4 text-[10px] text-gray-400">{note}</p></div> }
function Card({ title, subtitle, children }) { return <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="px-5 py-5 md:px-6"><h2 className="text-sm font-bold text-gray-900">{title}</h2><p className="mt-1 text-[11px] text-gray-400">{subtitle}</p></div><div className="border-t border-gray-100 px-5 pb-5 md:px-6 md:pb-6">{children}</div></div> }
function Bar({ label, value, total }) { const percent = Math.round((value / total) * 100); return <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-500">{label}</span><b>{value}</b></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} /></div></div> }
function Summary({ icon, label, value }) { return <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"><span className="grid size-9 place-items-center rounded-lg bg-white text-violet-600 shadow-sm"><i className={`fa-solid ${icon} text-xs`} /></span><div><p className="text-[10px] text-gray-400">{label}</p><b className="text-sm text-gray-800">{value}</b></div></div> }
function Empty({ text }) { return <div className="py-8 text-center text-xs text-gray-400">{text}</div> }
