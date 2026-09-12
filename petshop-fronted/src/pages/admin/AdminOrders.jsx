import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadAdminData, updateAdminData } from '../../admin/data'

const tabs = ['ทั้งหมด', 'รอดำเนินการ', 'กำลังจัดส่ง', 'จัดส่งแล้ว', 'สำเร็จ', 'ยกเลิก']
const tone = { 'รอดำเนินการ':'bg-violet-50 text-violet-600', 'กำลังจัดส่ง':'bg-blue-50 text-blue-600', 'จัดส่งแล้ว':'bg-emerald-50 text-emerald-600', 'สำเร็จ':'bg-green-50 text-green-700', 'ยกเลิก':'bg-red-50 text-red-500' }

function normalize(o, i) {
  return { ...o, id:o.id || `#PP-2024-${892-i}`, customer:o.customer || 'ไม่ระบุลูกค้า', total:Number(o.total||0), status:o.status || 'รอดำเนินการ', payment:o.payment || 'รอตรวจสอบ', shipping:o.shipping || 'ยังไม่จัดส่ง', date:o.date || '24 พ.ค. 68', time:o.time || '14:30 น.' }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState(() => (loadAdminData().orders || []).map(normalize))
  const [tab, setTab] = useState('ทั้งหมด')
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('ทั้งหมด')
  const [toast, setToast] = useState('')
  const navigate = useNavigate()
  const refresh = () => setOrders((loadAdminData().orders || []).map(normalize))
  useEffect(() => { window.addEventListener('petshop-admin-data-updated', refresh); return () => window.removeEventListener('petshop-admin-data-updated', refresh) }, [])

  const filtered = useMemo(() => {
    const q=search.trim().toLowerCase()
    return orders.filter(o => (tab==='ทั้งหมด'||o.status===tab) && (paymentFilter==='ทั้งหมด'||o.payment===paymentFilter) && (!q||`${o.id} ${o.customer} ${o.phone||''} ${o.shipping||''}`.toLowerCase().includes(q)))
  }, [orders,tab,search,paymentFilter])

  const counts = Object.fromEntries(tabs.map(t => [t, t==='ทั้งหมด' ? orders.length : orders.filter(o=>o.status===t).length]))
  const exportData = () => {
    const csv=['Order ID,Customer,Total,Status,Payment,Shipping',...orders.map(o=>`"${o.id}","${o.customer}",${o.total},"${o.status}","${o.payment}","${o.shipping}"`)].join('\n')
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([`\uFEFF${csv}`],{type:'text/csv;charset=utf-8'})); a.download='petshop-orders.csv'; a.click(); URL.revokeObjectURL(a.href); setToast('ส่งออกข้อมูลคำสั่งซื้อแล้ว'); setTimeout(()=>setToast(''),2200)
  }

  return <div className="space-y-4 pb-20 md:pb-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-[10px] text-gray-400"><Link to="/home/admin">หน้าหลัก</Link><i className="fa-solid fa-chevron-right mx-2 text-[8px]"/>คำสั่งซื้อ</div><h1 className="mt-1 text-[22px] font-extrabold">จัดการคำสั่งซื้อ </h1><p className="mt-0.5 text-[11px] text-gray-400">ตรวจสอบคำสั่งซื้อ การชำระเงิน และข้อมูลจัดส่ง</p></div><button onClick={exportData} className="rounded-xl bg-[#6d3df5] px-4 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-violet-500/20"><i className="fa-solid fa-download mr-2"/>ส่งออกข้อมูล</button></div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="คำสั่งซื้อทั้งหมด" value={orders.length} icon="fa-receipt"/><Stat label="รอดำเนินการ" value={counts['รอดำเนินการ']} icon="fa-clock"/><Stat label="กำลังจัดส่ง" value={counts['กำลังจัดส่ง']} icon="fa-truck"/><Stat label="ยอดขายรวม" value={`฿${orders.reduce((s,o)=>s+o.total,0).toLocaleString()}`} icon="fa-baht-sign"/></div>

    <section className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-[0_2px_10px_rgba(30,30,50,0.03)]"><div className="flex flex-col gap-2 md:flex-row"><label className="relative flex-1"><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเลขคำสั่งซื้อ ชื่อลูกค้า เบอร์โทร หรือเลขพัสดุ..." className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-[11px] outline-none focus:border-violet-300 focus:bg-white"/></label><select value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[11px] text-gray-600"><option>ทั้งหมด</option><option>ชำระแล้ว</option><option>รอตรวจสอบ</option><option>ยกเลิก</option></select></div></section>

    <div className="flex min-w-0 gap-1 overflow-x-auto rounded-xl border border-[#ececf2] bg-white p-1.5 shadow-[0_2px_10px_rgba(30,30,50,0.03)] [scrollbar-width:none]"><div className="flex min-w-max gap-1">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`rounded-lg px-3 py-2 text-[11px] font-bold ${tab===t?'bg-[#6d3df5] text-white':'text-gray-500 hover:bg-gray-50'}`}>{t} <span className="ml-1 opacity-60">{counts[t]}</span></button>)}</div></div>

    <section className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-[0_2px_10px_rgba(30,30,50,0.03)]"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-[11px]"><thead className="bg-[#fafafa] text-[9px] font-bold text-gray-400"><tr><th className="px-4 py-3">เลขที่คำสั่งซื้อ</th><th>ลูกค้า</th><th>วันที่</th><th>ยอดชำระ</th><th>การชำระเงิน</th><th>จัดส่ง</th><th>สถานะ</th><th className="text-center">จัดการ</th></tr></thead><tbody>{filtered.map(o=><tr key={o.id} className="border-t border-gray-50 hover:bg-violet-50/30"><td className="px-4 py-3 font-extrabold text-[#6d3df5]">{o.id}</td><td><div className="font-bold text-gray-800">{o.customer}</div><div className="text-[9px] text-gray-400">{o.phone||'—'}</div></td><td><div className="font-semibold">{o.date}</div><div className="text-[9px] text-gray-400">{o.time}</div></td><td className="font-extrabold">฿{o.total.toLocaleString()}</td><td><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${o.payment==='ชำระแล้ว'?'bg-emerald-50 text-emerald-600':o.payment==='ยกเลิก'?'bg-red-50 text-red-500':'bg-amber-50 text-amber-600'}`}>{o.payment}</span></td><td className="font-semibold text-gray-600">{o.shipping}</td><td><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${tone[o.status]||'bg-gray-50 text-gray-500'}`}>{o.status}</span></td><td><button onClick={()=>navigate(`/home/admin/orders/${encodeURIComponent(o.id)}`)} className="mx-auto grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:border-violet-200 hover:text-violet-600" title="ดูรายละเอียด"><i className="fa-regular fa-eye text-[10px]"/></button></td></tr>)}</tbody></table></div>{!filtered.length&&<div className="p-12 text-center text-xs text-gray-400"><i className="fa-solid fa-receipt mb-2 text-xl text-gray-200"/><p>ไม่พบคำสั่งซื้อ</p></div>}<div className="border-t border-gray-100 p-3 text-center text-[10px] text-gray-400">แสดง {filtered.length} จาก {orders.length} คำสั่งซื้อ</div></section>
    {toast&&<div className="fixed bottom-5 right-5 z-[120] rounded-xl bg-gray-900 px-4 py-3 text-xs font-bold text-white shadow-xl"><i className="fa-solid fa-circle-check mr-2 text-emerald-400"/>{toast}</div>}
  </div>
}
function Stat({label,value,icon}){return <div className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-[0_2px_10px_rgba(30,30,50,0.03)]"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f1edff] text-[#6d3df5]"><i className={`fa-solid ${icon} text-[11px]`}/></span><div><div className="text-[9px] text-gray-400">{label}</div><div className="text-lg font-extrabold">{value}</div></div></div></div>}
