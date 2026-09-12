import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { loadAdminData } from '../../admin/data.js'

const statusStyle = {
  'รอดำเนินการ': 'bg-purple-50 text-purple-600', 'กำลังจัดส่ง': 'bg-blue-50 text-blue-600',
  'จัดส่งแล้ว': 'bg-green-50 text-green-600', 'สำเร็จ': 'bg-green-50 text-green-600', 'ยกเลิก': 'bg-red-50 text-red-500',
}
const money = value => `฿${Number(value || 0).toLocaleString('th-TH')}`

export default function AdminDashboard() {
  const [data, setData] = useState(loadAdminData)
  useEffect(() => {
    const refresh = () => setData(loadAdminData())
    window.addEventListener('petshop-admin-data-updated', refresh)
    window.addEventListener('petshop-orders-updated', refresh)
    window.addEventListener('petshop-coupons-updated', refresh)
    return () => {
      window.removeEventListener('petshop-admin-data-updated', refresh)
      window.removeEventListener('petshop-orders-updated', refresh)
      window.removeEventListener('petshop-coupons-updated', refresh)
    }
  }, [])

  const orders = data.orders || []
  const users = data.users || []
  const products = data.products || []
  const realOrders = orders.filter(o => o.status !== 'ยกเลิก')
  const revenue = realOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const lowStock = products.filter(p => Number(p.stock || 0) <= 10)
  const recent = [...orders].slice(0, 6)
  const topProducts = [...products].sort((a,b) => Number(b.sold || 0) - Number(a.sold || 0)).slice(0, 5)
  const completed = orders.filter(o => o.status === 'สำเร็จ' || o.status === 'จัดส่งแล้ว').length
  const completionRate = orders.length ? Math.round(completed / orders.length * 100) : 0

  const dailySales = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0,10)
      const value = realOrders.filter(o => {
        const raw = o.createdAt || o.date
        const date = raw ? new Date(raw) : null
        return date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === key
      }).reduce((sum,o) => sum + Number(o.total || 0), 0)
      days.push({ label: d.toLocaleDateString('th-TH',{day:'numeric',month:'short'}), value })
    }
    return days
  }, [orders])
  const maxSale = Math.max(...dailySales.map(x => x.value), 1)

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-1 text-[11px] font-medium text-gray-400">Admin / Dashboard</div><h1 className="text-2xl font-bold tracking-tight text-gray-900">ภาพรวมร้านค้า</h1><p className="mt-1 text-xs text-gray-500">ข้อมูลทั้งหมดดึงจากระบบร้านค้าปัจจุบัน</p></div><span className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-500">อัปเดต {new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</span></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="ยอดขายรวม" value={money(revenue)} note={`${realOrders.length} ออเดอร์ที่ไม่ยกเลิก`} icon="fa-sack-dollar" />
      <Metric label="คำสั่งซื้อ" value={orders.length.toLocaleString()} note={`สำเร็จ/จัดส่งแล้ว ${completed} รายการ`} icon="fa-cart-shopping" />
      <Metric label="ลูกค้า" value={users.length.toLocaleString()} note={`${users.filter(u=>u.status==='active').length} บัญชีใช้งานได้`} icon="fa-users" />
      <Metric label="สินค้า" value={products.length.toLocaleString()} note={lowStock.length ? `⚠️ Stock ต่ำ ${lowStock.length} รายการ` : 'Stock อยู่ในเกณฑ์ปกติ'} icon="fa-box-open" />
    </section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
      <Card title="ยอดขาย 7 วันล่าสุด" subtitle="คำนวณจากคำสั่งซื้อจริง"><div className="mt-5 overflow-x-auto rounded-xl bg-gray-50/70 p-3 sm:p-5"><div className="flex h-[250px] min-w-[330px] items-end gap-1.5 sm:gap-2">{dailySales.map(day => <div key={day.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="h-4 max-w-full truncate px-0.5 text-[8px] font-bold text-gray-500 sm:text-[9px]">{day.value ? money(day.value) : ''}</span><div className="w-full max-w-12 rounded-t-lg bg-[#6d3df5] transition-all" style={{height:`${Math.max(day.value/maxSale*82, day.value ? 8 : 2)}%`}}/><span className="whitespace-nowrap text-[8px] text-gray-400 sm:text-[9px]">{day.label}</span></div>)}</div></div></Card>
      <Card title="สุขภาพร้านค้า" subtitle="สถานะจากข้อมูลปัจจุบัน"><div className="space-y-4 pt-4"><Health label="อัตราสำเร็จ/จัดส่ง" value={`${completionRate}%`} /><Health label="สินค้า Stock ต่ำ" value={`${lowStock.length} รายการ`} warn={lowStock.length > 0} /><Health label="ลูกค้าที่ถูกระงับ" value={`${users.filter(u=>u.status==='suspended').length} คน`} warn={users.some(u=>u.status==='suspended')} /><Health label="โปรโมชั่นใช้งาน" value={`${(data.coupons||[]).filter(c=>c.active).length} รายการ`} /></div></Card>
    </section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
      <Card title="คำสั่งซื้อล่าสุด" subtitle={`${orders.length} รายการในระบบ`} link="/home/admin/orders"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400"><th className="pb-3">เลขที่</th><th>ลูกค้า</th><th>ยอด</th><th>สถานะ</th><th/></tr></thead><tbody>{recent.length ? recent.map(o=><tr key={o.id} className="border-b border-gray-50 last:border-0"><td className="py-4 font-bold text-[#6d3df5]">{o.id}</td><td className="py-4 font-medium text-gray-700">{o.customer || o.name || 'ไม่ระบุลูกค้า'}</td><td className="py-4 font-bold">{money(o.total)}</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[o.status] || 'bg-gray-100 text-gray-500'}`}>{o.status || 'ไม่ระบุ'}</span></td><td><Link to={`/home/admin/orders/${encodeURIComponent(o.id)}`} className="text-gray-400 hover:text-[#6d3df5]"><i className="fa-regular fa-eye"/></Link></td></tr>) : <tr><td colSpan="5" className="py-12 text-center text-gray-400">ยังไม่มีคำสั่งซื้อ</td></tr>}</tbody></table></div></Card>
      <Card title="สินค้าขายดี" subtitle="เรียงตามจำนวนขาย" link="/home/admin/products"><div className="space-y-1">{topProducts.length ? topProducts.map((p,i)=><div key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-gray-50"><span className="grid size-7 place-items-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500">{i+1}</span><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f6f3ff] text-[#6d3df5]"><i className={`fa-solid ${p.icon || 'fa-box'} text-xs`}/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-gray-700">{p.name}</p><p className="mt-0.5 text-[10px] text-gray-400">ขายแล้ว {Number(p.sold||0)} ชิ้น · Stock {Number(p.stock||0)}</p></div><b className="text-xs">{money(p.price)}</b></div>) : <p className="py-10 text-center text-xs text-gray-400">ยังไม่มีสินค้า</p>}</div></Card>
    </section>
  </div>
}
function Metric({label,value,note,icon}){return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{value}</p></div><span className="grid size-11 place-items-center rounded-xl bg-[#f1edff] text-[#6d3df5]"><i className={`fa-solid ${icon}`} /></span></div><p className="mt-4 text-[11px] text-gray-400">{note}</p></div>}
function Health({label,value,warn}){return <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"><span className="text-xs text-gray-500">{label}</span><b className={`text-sm ${warn?'text-orange-500':'text-gray-800'}`}>{value}</b></div>}
function Card({title,subtitle,link,children}){return <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between px-5 py-5 md:px-6"><div><h2 className="text-sm font-bold text-gray-900">{title}</h2>{subtitle&&<p className="mt-1 text-[11px] text-gray-400">{subtitle}</p>}</div>{link&&<Link to={link} className="text-[11px] font-bold text-[#6d3df5]">ดูทั้งหมด <i className="fa-solid fa-arrow-right ml-1"/></Link>}</div><div className="border-t border-gray-100 px-5 pb-5 md:px-6 md:pb-6">{children}</div></div>}
