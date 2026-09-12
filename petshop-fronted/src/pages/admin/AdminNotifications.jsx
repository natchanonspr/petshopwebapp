import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, subscribeNotifications, markAllNotificationsRead, markNotificationRead, clearNotifications, addNotification } from '../../lib/notifications.js'
import { notifyAdmin, notifyPromotion } from '../../admin/commerce.js'

const templates = [
  { type: 'promo', icon: 'fa-tag', title: 'โปรโมชั่นพิเศษสำหรับคุณ', detail: 'ใช้คูปองวันนี้ รับส่วนลดสำหรับอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { type: 'promo', icon: 'fa-ticket', title: 'คูปองใหม่มาแล้ว', detail: 'มีคูปองใหม่พร้อมส่วนลดพิเศษสำหรับคุณ' },
  { type: 'promo', icon: 'fa-percent', title: 'ลดราคาพิเศษ', detail: 'สินค้าสุดคุ้ม ลดพิเศษในช่วงเวลาจำกัด' },
  { type: 'promo', icon: 'fa-clock', title: 'คูปองใกล้หมดอายุ', detail: 'รีบใช้คูปองก่อนสิทธิ์ของคุณจะหมดอายุ' },
  { type: 'promo', icon: 'fa-truck-fast', title: 'ส่งฟรีวันนี้', detail: 'รับสิทธิ์ส่งฟรีเมื่อสั่งซื้อตามเงื่อนไขที่กำหนด' },
  { type: 'promo', icon: 'fa-gift', title: 'สิทธิพิเศษสำหรับสมาชิก ', detail: 'ข้อเสนอพิเศษสำหรับสมาชิก PetShop เท่านั้น' },
  { type: 'promo', icon: 'fa-user-plus', title: 'โปรโมชั่นสมาชิกใหม่ ', detail: 'สมาชิกใหม่รับส่วนลดพิเศษสำหรับคำสั่งซื้อแรก' },
  { type: 'system', icon: 'fa-bullhorn', title: 'แจ้งข่าวสารจาก PetShop', detail: 'มีข้อมูล ข่าวสาร และสิทธิพิเศษใหม่จากร้าน PetShop' },
  { type: 'order', icon: 'fa-truck', title: 'อัปเดตสถานะการจัดส่ง', detail: 'คำสั่งซื้อของคุณกำลังเดินทางไปหาคุณ' },
]

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState(() => getNotifications([], 'admin'))
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [type, setType] = useState('system')
  const [orderId, setOrderId] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => subscribeNotifications(setNotifications, 'admin'), [])

  const send = () => {
    if (!title.trim() || !detail.trim()) return
    if (type === 'promo') notifyPromotion(title.trim(), detail.trim())
    else addNotification({ audience: 'customer', type, icon: type === 'order' ? 'fa-truck-fast' : 'fa-bullhorn', title: title.trim(), detail: detail.trim(), ...(type === 'order' && orderId.trim() ? { orderId: orderId.trim() } : {}) })
    setTitle(''); setDetail(''); setOrderId(''); setToast('ส่งการแจ้งเตือนแล้ว')
    window.setTimeout(() => setToast(''), 2200)
  }

  const useTemplate = (item) => { setType(item.type); setTitle(item.title); setDetail(item.detail); if(item.type!=='order') setOrderId('') }
  const markRead = (id) => markNotificationRead(id)

  return <div className="space-y-4 pb-20 md:pb-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><div className="text-[10px] text-gray-400"><Link to="/home/admin">หน้าหลัก</Link><i className="fa-solid fa-chevron-right mx-2 text-[8px]"/>การแจ้งเตือน</div><h1 className="mt-1 text-[22px] font-extrabold">จัดการการแจ้งเตือน</h1><p className="mt-0.5 text-[11px] text-gray-400">ส่งข่าวสาร โปรโมชั่น และติดตามสถานะคำสั่งซื้อให้ Customer</p></div>
      <div className="flex gap-2"><button onClick={()=>markAllNotificationsRead('admin')} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[10px] font-bold text-gray-600">อ่านทั้งหมด</button><button onClick={()=>setConfirmClear(true)} disabled={!notifications.length} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-500 disabled:opacity-40">ล้างทั้งหมด</button></div>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <section className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm"><h2 className="text-sm font-extrabold">ส่งการแจ้งเตือน</h2><p className="mt-1 text-[10px] text-gray-400">ข้อความจะถูกบันทึกในระบบ Customer และเรียกเสียงแจ้งเตือนด้วย</p><div className="mt-4 space-y-3"><label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">ประเภท</span><select value={type} onChange={e=>setType(e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"><option value="system">ระบบ</option><option value="promo">โปรโมชั่น</option><option value="order">คำสั่งซื้อ</option></select></label><label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">หัวข้อ</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="หัวข้อการแจ้งเตือน" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-400"/></label><label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">รายละเอียด</span><textarea value={detail} onChange={e=>setDetail(e.target.value)} rows={4} placeholder="รายละเอียดข้อความ..." className="w-full rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-violet-400"/></label>{type==='order'&&<label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">เลขคำสั่งซื้อ (ถ้ามี)</span><input value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder="เช่น #PP-2024-0892" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-400"/></label>}<button onClick={send} disabled={!title.trim()||!detail.trim()} className="h-10 w-full rounded-lg bg-[#6d3df5] text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><i className="fa-solid fa-paper-plane mr-2"/>ส่งแจ้งเตือน</button></div></section>
      <section className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm"><h2 className="text-sm font-extrabold">ข้อความสำเร็จรูป</h2><p className="mt-1 text-[10px] text-gray-400">เลือกข้อความแล้วปรับแก้ก่อนส่งได้</p><div className="mt-4 space-y-2">{templates.map(item=><button key={item.title} onClick={()=>useTemplate(item)} className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/40"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-white text-violet-600 shadow-sm"><i className={`fa-solid ${item.icon || (item.type==='promo'?'fa-tag':item.type==='order'?'fa-truck':'fa-bullhorn')}`}/></span><div className="min-w-0 flex-1"><b className="block text-xs">{item.title}</b><span className="mt-1 block text-[10px] text-gray-400">{item.detail}</span></div><i className="fa-solid fa-chevron-right text-[9px] text-gray-300"/></div></button>)}</div></section>
    </div>

    <section className="rounded-xl border border-[#ececf2] bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-4 py-3"><div><h2 className="text-sm font-extrabold">ประวัติการแจ้งเตือน</h2><p className="text-[10px] text-gray-400">ทั้งหมด {notifications.length} รายการ · ยังไม่อ่าน {notifications.filter(n=>n.unread).length}</p></div></div><div className="divide-y divide-gray-100">{notifications.length ? notifications.map(item=><button type="button" key={item.id} onClick={()=>markRead(item.id)} className={`flex w-full gap-3 p-4 text-left transition hover:bg-gray-50 ${item.unread?'bg-orange-50/30':'bg-white'}`}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600"><i className={`fa-solid ${item.icon||'fa-bell'} text-[10px]`}/></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><b className={`text-xs ${item.unread?'font-extrabold text-gray-900':'font-semibold text-gray-600'}`}>{item.title}</b>{item.unread&&<span className="rounded-full bg-orange-50 px-2 py-0.5 text-[8px] font-bold text-orange-500">ยังไม่อ่าน</span>}</div><p className="mt-1 text-[10px] text-gray-500">{item.detail}</p><p className="mt-1 text-[9px] text-gray-300">{item.time}</p></div>{item.unread&&<span className="mt-1 size-2 shrink-0 rounded-full bg-orange-500" title="ยังไม่อ่าน"/>}</button>) : <div className="p-12 text-center text-xs text-gray-400"><i className="fa-regular fa-bell mb-2 text-2xl text-gray-200"/><p>ยังไม่มีการแจ้งเตือน</p></div>}</div></section>
    {confirmClear&&<div className="fixed inset-0 z-[110] grid place-items-center bg-gray-950/45 p-4 backdrop-blur-sm"><div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white shadow-2xl"><div className="h-1.5 bg-red-500"/><div className="p-6 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500"><i className="fa-solid fa-bell-slash text-xl"/></span><h2 className="mt-4 text-lg font-extrabold">ล้างการแจ้งเตือนทั้งหมด?</h2><p className="mt-1 text-xs text-gray-500">รายการแจ้งเตือนทั้งหมด {notifications.length} รายการจะถูกลบออก</p><div className="mt-6 flex gap-2"><button onClick={()=>setConfirmClear(false)} className="h-11 flex-1 rounded-xl border border-gray-200 text-xs font-bold text-gray-500">ยกเลิก</button><button onClick={()=>{clearNotifications();setConfirmClear(false);setToast('ล้างการแจ้งเตือนแล้ว');window.setTimeout(()=>setToast(''),2200)}} className="h-11 flex-1 rounded-xl bg-red-500 text-xs font-bold text-white hover:bg-red-600">ยืนยันล้าง</button></div></div></div></div>}
    {toast&&<div className="fixed bottom-5 right-5 z-[120] rounded-xl bg-gray-900 px-4 py-3 text-xs font-bold text-white shadow-xl"><i className="fa-solid fa-circle-check mr-2 text-emerald-400"/>{toast}</div>}
  </div>
}
