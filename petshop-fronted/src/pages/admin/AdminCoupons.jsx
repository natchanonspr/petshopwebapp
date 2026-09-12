import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAdminData, saveAdminData } from '../../admin/data.js'

const KEY = 'petshop_admin_coupons_v1'
const initial = [
  { id: 'CP001', code: 'PETLOVE20', title: 'ลด 20% สำหรับอาหารสัตว์', type: 'เปอร์เซ็นต์', value: 20, used: 42, limit: 100, start: '2026-09-01T00:00', expire: '2026-09-30T23:59', active: true },
  { id: 'CP002', code: 'WELCOME100', title: 'สมาชิกใหม่ลด 100 บาท', type: 'ส่วนลดคงที่', value: 100, used: 18, limit: 200, start: '2026-09-01T00:00', expire: '2026-10-31T23:59', active: true },
  { id: 'CP003', code: 'FREESHIP', title: 'ส่งฟรีเมื่อซื้อครบ 500 บาท', type: 'ค่าส่ง', value: 0, used: 76, limit: 100, start: '2026-08-01T00:00', expire: '2026-09-15T23:59', active: false },
]

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    return Array.isArray(saved) ? saved : initial
  } catch { return initial }
}

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function scheduleStatus(item) {
  if (!item.active) return { label: 'ปิดอยู่', cls: 'bg-gray-100 text-gray-400' }
  const now = new Date()
  const start = item.start ? new Date(item.start) : null
  const end = item.expire ? new Date(item.expire) : null
  if (start && now < start) return { label: 'รอเริ่ม', cls: 'bg-amber-50 text-amber-600' }
  if (end && now > end) return { label: 'หมดอายุ', cls: 'bg-red-50 text-red-500' }
  if (item.used >= item.limit) return { label: 'ครบจำนวน', cls: 'bg-gray-100 text-gray-500' }
  return { label: 'กำลังใช้งาน', cls: 'bg-emerald-50 text-emerald-600' }
}

const blankForm = { code: '', title: '', type: 'ส่วนลดคงที่', value: '', min: 0, maxDiscount: '', limit: 100, perUser: 1, newMemberOnly: false, category: 'ทุกหมวดหมู่', start: '', expire: '' }

export default function AdminCoupons() {
  const [items, setItems] = useState(loadItems)
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
    const data = loadAdminData()
    saveAdminData({ ...data, coupons: items })
    window.dispatchEvent(new Event('petshop-coupons-updated'))
  }, [items])

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(x => scheduleStatus(x).label === 'กำลังใช้งาน').length,
    used: items.reduce((a, x) => a + Number(x.used || 0), 0),
  }), [items])

  const openCreate = () => {
    setEditingId(null)
    setForm(blankForm)
    setError('')
    setModal(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({ code: item.code || '', title: item.title || '', type: item.type || 'ส่วนลดคงที่', value: item.value || '', min: item.min || 0, maxDiscount: item.maxDiscount || '', limit: item.limit || 100, perUser: item.perUser || 1, newMemberOnly: Boolean(item.newMemberOnly), category: item.category || 'ทุกหมวดหมู่', start: item.start || '', expire: item.expire || '' })
    setError('')
    setModal(true)
  }

  const save = () => {
    if (!form.code.trim() || !form.title.trim() || !form.start || !form.expire) {
      setError('กรุณากรอกข้อมูลและกำหนดช่วงเวลาโปรโมชั่นให้ครบ')
      return
    }
    if (new Date(form.expire) <= new Date(form.start)) {
      setError('วันและเวลาสิ้นสุดต้องหลังวันและเวลาเริ่มต้น')
      return
    }
    const duplicate = items.some(x => x.code === form.code.trim().toUpperCase() && x.id !== editingId)
    if (duplicate) { setError('รหัสโปรโมชั่นนี้มีอยู่แล้ว'); return }

    const value = Number(form.value) || 0
    const min = Math.max(0, Number(form.min) || 0)
    const maxDiscount = form.maxDiscount === '' ? '' : Math.max(0, Number(form.maxDiscount) || 0)
    const limit = Math.max(1, Number(form.limit) || 100)
    const perUser = Math.max(1, Number(form.perUser) || 1)
    if (form.type === 'เปอร์เซ็นต์' && (value <= 0 || value > 100)) { setError('ส่วนลดเปอร์เซ็นต์ต้องอยู่ระหว่าง 1–100%'); return }
    if (form.type !== 'ค่าส่ง' && value <= 0) { setError('กรุณาระบุจำนวนส่วนลดมากกว่า 0'); return }
    if (editingId) {
      setItems(items.map(x => x.id === editingId ? { ...x, code: form.code.trim().toUpperCase(), title: form.title.trim(), type: form.type, value, min, maxDiscount, limit, perUser, newMemberOnly: form.newMemberOnly, category: form.category, start: form.start, expire: form.expire } : x))
    } else {
      setItems([...items, { id: `CP${Date.now()}`, code: form.code.trim().toUpperCase(), title: form.title.trim(), type: form.type, value, min, maxDiscount, used: 0, limit, perUser, newMemberOnly: form.newMemberOnly, category: form.category, start: form.start, expire: form.expire, active: true }])
    }
    setModal(false)
    setForm(blankForm)
    setError('')
  }

  const remove = (id) => setItems(items.filter(x => x.id !== id))

  return <div className="space-y-4 pb-20 md:pb-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><div className="text-[10px] text-gray-400"><Link to="/home/admin">หน้าหลัก</Link> <i className="fa-solid fa-chevron-right mx-1 text-[8px]"/>โปรโมชั่น</div><h1 className="mt-1 text-[22px] font-extrabold">จัดการโปรโมชั่น </h1><p className="mt-0.5 text-[11px] text-gray-400">สร้าง แก้ไข และตั้งเวลาเปิด–ปิดโปรโมชั่นอัตโนมัติ</p></div>
      <button onClick={openCreate} className="rounded-lg bg-[#6d3df5] px-4 py-2.5 text-[11px] font-bold text-white"><i className="fa-solid fa-plus mr-2"/>สร้างโปรโมชั่น</button>
    </div>

    <div className="grid gap-3 sm:grid-cols-3"><Stat label="โปรโมชั่นทั้งหมด" value={stats.total} icon="fa-ticket"/><Stat label="กำลังใช้งาน" value={stats.active} icon="fa-circle-check"/><Stat label="ใช้ไปแล้ว" value={stats.used} icon="fa-chart-simple"/></div>

    <section className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-[11px]"><thead className="bg-[#fafafa] text-[9px] font-bold text-gray-400"><tr><th className="px-4 py-3">โปรโมชั่น</th><th>ประเภท</th><th>ส่วนลด</th><th>การใช้งาน</th><th>เริ่ม</th><th>สิ้นสุด</th><th>สถานะ</th><th/></tr></thead><tbody>{items.map(x => { const status = scheduleStatus(x); return <tr key={x.id} className="border-t border-gray-50 hover:bg-violet-50/30">
      <td className="px-4 py-3"><div className="font-extrabold text-[#6d3df5]">{x.code}</div><div className="mt-0.5 text-[9px] text-gray-500">{x.title}</div></td><td>{x.type}</td><td className="font-extrabold">{x.type === 'เปอร์เซ็นต์' ? `${x.value}%` : x.type === 'ค่าส่ง' ? 'ฟรี' : `฿${x.value}`}<div className="mt-0.5 text-[8px] font-normal text-gray-400">ขั้นต่ำ ฿{Number(x.min || 0).toLocaleString()}</div></td><td>{x.used} / {x.limit}<div className="mt-0.5 text-[8px] text-gray-400">ต่อคน {x.perUser || 1} ครั้ง</div></td><td>{formatDate(x.start)}</td><td>{formatDate(x.expire)}</td><td><button onClick={() => setItems(items.map(i => i.id === x.id ? {...i, active: !i.active} : i))} className={`rounded-full px-2 py-1 text-[9px] font-bold ${status.cls}`}>{status.label}</button></td><td className="pr-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => openEdit(x)} title="แก้ไข" className="grid size-7 place-items-center rounded-lg bg-violet-50 text-violet-600"><i className="fa-solid fa-pen text-[9px]"/></button><button onClick={() => remove(x.id)} title="ลบ" className="grid size-7 place-items-center rounded-lg bg-red-50 text-red-500"><i className="fa-solid fa-trash text-[9px]"/></button></div></td>
    </tr>})}</tbody></table></div></section>

    {modal && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-4" onMouseDown={e => e.target === e.currentTarget && setModal(false)}><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex justify-between"><div><h2 className="text-base font-extrabold">{editingId ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่น'}</h2><p className="mt-0.5 text-[10px] text-gray-400">กำหนดช่วงเวลาให้ระบบจัดการสถานะให้อัตโนมัติ</p></div><button onClick={() => setModal(false)} className="text-gray-400"><i className="fa-solid fa-xmark"/></button></div>
      <div className="mt-4 space-y-3">
        <label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">รหัสโปรโมชั่น</span><input value={form.code} onChange={e => setForm({...form, code:e.target.value})} placeholder="เช่น PET100" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-[#6d3df5]"/></label>
        <label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">ชื่อโปรโมชั่น</span><input value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="เช่น ลด 100 บาท สำหรับสมาชิกใหม่" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-[#6d3df5]"/></label>
        <div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">ประเภทส่วนลด</span><select value={form.type} onChange={e => setForm({...form,type:e.target.value})} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs"><option>ส่วนลดคงที่</option><option>เปอร์เซ็นต์</option><option>ค่าส่ง</option></select></label><label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">จำนวนส่วนลด</span><input type="number" min="0" value={form.value} onChange={e => setForm({...form,value:e.target.value})} placeholder="เช่น 100" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"/></label></div>
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold text-violet-700"><i className="fa-solid fa-sliders"/> เงื่อนไขการใช้คูปอง</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-[9px] font-bold text-gray-500">ยอดซื้อขั้นต่ำ (บาท)</span><input type="number" min="0" value={form.min} onChange={e => setForm({...form,min:e.target.value})} placeholder="เช่น 499" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs"/></label>
            <label className="block"><span className="mb-1 block text-[9px] font-bold text-gray-500">ส่วนลดสูงสุด (เฉพาะ %)</span><input type="number" min="0" value={form.maxDiscount} onChange={e => setForm({...form,maxDiscount:e.target.value})} placeholder="ไม่จำกัด" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs"/></label>
            <label className="block"><span className="mb-1 block text-[9px] font-bold text-gray-500">ใช้ได้สูงสุดต่อคน</span><input type="number" min="1" value={form.perUser} onChange={e => setForm({...form,perUser:e.target.value})} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs"/></label>
            <label className="block"><span className="mb-1 block text-[9px] font-bold text-gray-500">สินค้าที่ร่วมรายการ</span><select value={form.category} onChange={e => setForm({...form,category:e.target.value})} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs"><option>ทุกหมวดหมู่</option><option>อาหารสัตว์</option><option>ขนม</option><option>ของเล่น</option><option>อุปกรณ์</option><option>สุขภาพและดูแล</option></select></label>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-[10px] font-bold text-gray-600"><input type="checkbox" checked={form.newMemberOnly} onChange={e => setForm({...form,newMemberOnly:e.target.checked})} className="size-4 rounded accent-[#6d3df5]"/> เฉพาะสมาชิกใหม่ / คำสั่งซื้อแรก</label>
        </div>
        <label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">จำนวนสิทธิ์ทั้งหมด</span><input type="number" min="1" value={form.limit} onChange={e => setForm({...form,limit:e.target.value})} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"/></label>
        <div className="rounded-xl bg-violet-50 p-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold text-violet-700"><i className="fa-regular fa-calendar-clock"/> ตั้งเวลาโปรโมชั่น</div><div className="grid gap-3 sm:grid-cols-2"><label className="relative block"><span className="mb-1 block text-[9px] font-bold text-gray-500">เริ่มวันที่และเวลา</span><input type="datetime-local" value={form.start} onChange={e => setForm({...form,start:e.target.value})} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs"/></label><label className="relative block"><span className="mb-1 block text-[9px] font-bold text-gray-500">สิ้นสุดวันที่และเวลา</span><input type="datetime-local" value={form.expire} onChange={e => setForm({...form,expire:e.target.value})} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs"/></label></div></div>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-500"><i className="fa-solid fa-circle-exclamation mr-1"/>{error}</div>}
      </div>
      <div className="mt-5 flex gap-2"><button onClick={() => setModal(false)} className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500">ยกเลิก</button><button onClick={save} className="h-10 flex-1 rounded-lg bg-[#6d3df5] text-xs font-bold text-white">{editingId ? 'บันทึกการแก้ไข' : 'สร้างโปรโมชั่น'}</button></div>
    </div></div>}
  </div>
}

function Stat({label,value,icon}){return <div className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f1edff] text-[#6d3df5]"><i className={`fa-solid ${icon} text-[11px]`}/></span><div><div className="text-[9px] text-gray-400">{label}</div><div className="text-lg font-extrabold">{value}</div></div></div></div>}
