import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import AddressFormComponent from '../../components/profile/AddressForm.jsx'

const ADDRESS_STORAGE_KEY = 'petshop_addresses'
const PAYMENT_STORAGE_KEY = 'petshop_payment_methods'
const THAILAND_GEOGRAPHY_URL = 'https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/main/src/geography.json'
const THAILAND_GEOGRAPHY_CACHE = 'petshop_thailand_geography_v2'

const seedPayments = [
  { id: 1, type: 'promptpay', name: 'พร้อมเพย์', detail: '081-234-5678', icon: 'fa-qrcode', default: true },
  { id: 2, type: 'card', name: 'บัตรเครดิต / เดบิต', detail: '•••• •••• •••• 4242', icon: 'fa-credit-card', default: false },
]

function readStorage(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(value) ? value : fallback } catch { return fallback }
}
function saveStorage(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

function normalizeGeography(raw) {
  if (!Array.isArray(raw)) return { provinces: [], districts: [], subdistricts: [] }
  const provinces = [], districts = [], subdistricts = []
  raw.forEach((province) => {
    const fp = province.provinceCode ?? province.province_code
    const fd = province.districtCode ?? province.district_code
    const fs = province.subdistrictCode ?? province.subdistrict_code
    const fpn = province.provinceNameTh ?? province.province_name_th
    const fdn = province.districtNameTh ?? province.district_name_th
    const fsn = province.subdistrictNameTh ?? province.subdistrict_name_th
    const fz = province.postalCode ?? province.postal_code ?? ''
    if (fp != null && fpn) {
      provinces.push({ id: String(fp), name: String(fpn) })
      if (fd != null && fdn) districts.push({ id: String(fd), name: String(fdn), provinceId: String(fp) })
      if (fs != null && fsn) subdistricts.push({ id: String(fs), name: String(fsn), districtId: String(fd), postalCode: String(fz) })
      return
    }
    const pid = province.id ?? province.province_id
    const pname = province.name_th ?? province.name ?? province.province_name
    const amphures = province.amphure ?? province.amphures ?? province.districts
    if (pid != null && pname && Array.isArray(amphures)) {
      provinces.push({ id: String(pid), name: String(pname) })
      amphures.forEach((district) => {
        const did = district.id ?? district.amphure_id ?? district.district_id
        const dname = district.name_th ?? district.name ?? district.amphure_name ?? district.district_name
        if (did == null || !dname) return
        districts.push({ id: String(did), name: String(dname), provinceId: String(district.province_id ?? pid) })
        const tambons = district.tambon ?? district.tambons ?? district.subdistricts
        if (Array.isArray(tambons)) tambons.forEach((subdistrict) => {
          const sid = subdistrict.id ?? subdistrict.tambon_id ?? subdistrict.subdistrict_id
          const sname = subdistrict.name_th ?? subdistrict.name ?? subdistrict.tambon_name ?? subdistrict.subdistrict_name
          const zip = subdistrict.zip_code ?? subdistrict.postcode ?? subdistrict.postal_code ?? subdistrict.zipCode ?? ''
          if (sid != null && sname) subdistricts.push({ id: String(sid), name: String(sname), districtId: String(subdistrict.amphure_id ?? subdistrict.district_id ?? did), postalCode: String(zip) })
        })
      })
    }
  })
  const unique = (items) => Array.from(new Map(items.map((item) => [item.id, item])).values())
  return { provinces: unique(provinces), districts: unique(districts), subdistricts: unique(subdistricts) }
}

function PageShell({ title, icon = 'fa-gear', subtitle, children }) {
  return <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
    <header className="relative z-20 shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-4 pb-4 pt-5 shadow-[0_3px_12px_rgba(15,23,42,0.08)]"><div className="grid grid-cols-[44px_1fr_44px] items-center"><Link to="/profile" aria-label="กลับโปรไฟล์" className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-700 transition active:scale-90"><i className="fa-solid fa-arrow-left text-[17px]" /></Link><div className="text-center"><h1 className="m-0 text-[18px] font-extrabold text-gray-900">{title}</h1>{subtitle && <p className="m-0 mt-0.5 text-[10px] text-gray-400">{subtitle}</p>}</div><span className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500"><i className={`fa-solid ${icon} text-[17px]`} /></span></div></header>
    <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</main><BottomNavigation />
  </div>
}

function Addresses() {
  const [addresses, setAddresses] = useState(() => readStorage(ADDRESS_STORAGE_KEY, seedAddresses))
  const [editingId, setEditingId] = useState(null), [showForm, setShowForm] = useState(false), [showConfirm, setShowConfirm] = useState(false), [showSuccess, setShowSuccess] = useState(false), [loading, setLoading] = useState(false)
  const [geography, setGeography] = useState({ provinces: [], districts: [], subdistricts: [] })
  const [form, setForm] = useState({ recipient: '', phone: '', detail: '', provinceId: '', districtId: '', subdistrictId: '', postalCode: '', default: false })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const cached = JSON.parse(localStorage.getItem(THAILAND_GEOGRAPHY_CACHE) || 'null')
        if (cached?.provinces?.length && cached?.districts?.length && cached?.subdistricts?.length) { if (alive) setGeography(cached); return }
        setLoading(true); const response = await fetch(THAILAND_GEOGRAPHY_URL); if (!response.ok) throw new Error('geography request failed')
        const normalized = normalizeGeography(await response.json()); if (normalized.provinces.length) localStorage.setItem(THAILAND_GEOGRAPHY_CACHE, JSON.stringify(normalized)); if (alive) setGeography(normalized)
      } catch { if (alive) setGeography({ provinces: [], districts: [], subdistricts: [] }) } finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])

  const provinceName = (id) => geography.provinces.find((item) => String(item.id) === String(id))?.name || ''
  const districtName = (id) => geography.districts.find((item) => String(item.id) === String(id))?.name || ''
  const subdistrictName = (id) => geography.subdistricts.find((item) => String(item.id) === String(id))?.name || ''
  const openAdd = () => { setEditingId(null); setForm({ recipient: '', phone: '', detail: '', provinceId: '', districtId: '', subdistrictId: '', postalCode: '', default: addresses.length === 0 }); setShowForm(true) }
  const openEdit = (address) => {
    const provinceId = address.provinceId || geography.provinces.find((item) => item.name === address.province)?.id || ''
    const districtId = address.districtId || geography.districts.find((item) => item.name === address.district && String(item.provinceId) === String(provinceId))?.id || ''
    const subdistrictId = address.subdistrictId || geography.subdistricts.find((item) => item.name === address.subdistrict && String(item.districtId) === String(districtId))?.id || ''
    setEditingId(address.id); setForm({ recipient: address.recipient || '', phone: address.phone || '', detail: address.detail || '', provinceId, districtId, subdistrictId, postalCode: address.postalCode || '', default: Boolean(address.default) }); setShowForm(true)
  }
  const persist = (next) => { setAddresses(next); saveStorage(ADDRESS_STORAGE_KEY, next); window.dispatchEvent(new Event('petshop-address-updated')) }
  const handleSave = (event) => { event.preventDefault(); if (!form.recipient.trim() || !/^0\d{8,9}$/.test(form.phone.trim()) || !form.detail.trim() || !form.provinceId || !form.districtId || !form.subdistrictId) return; setShowConfirm(true) }
  const confirmSave = () => {
    const nextAddress = { id: editingId ?? Date.now(), recipient: form.recipient.trim(), phone: form.phone.trim(), detail: form.detail.trim(), subdistrictId: form.subdistrictId, districtId: form.districtId, provinceId: form.provinceId, subdistrict: subdistrictName(form.subdistrictId), district: districtName(form.districtId), province: provinceName(form.provinceId), postalCode: form.postalCode || geography.subdistricts.find((item) => String(item.id) === String(form.subdistrictId))?.postalCode || '', default: form.default }
    let next = editingId ? addresses.map((item) => item.id === editingId ? nextAddress : item) : [...addresses, nextAddress]
    if (nextAddress.default || next.length === 1) next = next.map((item) => ({ ...item, default: item.id === nextAddress.id })); else if (!next.some((item) => item.default)) next = next.map((item, index) => ({ ...item, default: index === 0 }))
    persist(next); setShowConfirm(false); setShowForm(false); setEditingId(null); setShowSuccess(true)
  }
  const remove = (id) => { if (!window.confirm('ต้องการลบที่อยู่นี้ใช่ไหม?')) return; let next = addresses.filter((item) => item.id !== id); if (next.length && !next.some((item) => item.default)) next = next.map((item, index) => ({ ...item, default: index === 0 })); persist(next) }
  const setDefault = (id) => persist(addresses.map((item) => ({ ...item, default: item.id === id })))

  return <PageShell title="ที่อยู่จัดส่ง" icon="fa-location-dot">
    <button type="button" onClick={openAdd} className="flex w-full items-center gap-3 rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-4 text-left transition active:scale-[0.99]"><span className="grid size-11 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm"><i className="fa-solid fa-plus" /></span><span className="flex-1"><strong className="block text-sm font-extrabold text-gray-800">เพิ่มที่อยู่ใหม่</strong><small className="mt-1 block text-xs text-gray-400">เพิ่มที่อยู่สำหรับจัดส่งสินค้า</small></span><i className="fa-solid fa-chevron-right text-xs text-orange-400" /></button>
    {showForm && <div className="mt-4"><AddressFormComponent value={form} onChange={setForm} onSave={handleSave} onCancel={() => setShowForm(false)} editing={Boolean(editingId)} /></div>}
    <div className="mt-5 space-y-3">{addresses.length === 0 ? <div className="rounded-3xl bg-white p-8 text-center shadow-sm"><div className="mx-auto grid size-14 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-location-dot text-xl" /></div><h2 className="mt-3 text-sm font-extrabold">ยังไม่มีที่อยู่จัดส่ง</h2><p className="mt-1 text-xs text-gray-400">เพิ่มที่อยู่เพื่อให้สามารถสั่งซื้อสินค้าได้</p></div> : addresses.map((address) => <article key={address.id} className={`rounded-3xl border bg-white p-4 shadow-sm ${address.default ? 'border-orange-200' : 'border-gray-100'}`}><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-location-dot" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="m-0 text-sm font-extrabold text-gray-900">{address.recipient}</h2>{address.default && <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-extrabold text-orange-600">หลัก</span>}</div><p className="m-0 mt-1 text-xs font-medium text-gray-500">{address.phone}</p><p className="m-0 mt-1 text-xs leading-5 text-gray-500">{address.detail} ต.{address.subdistrict} อ.{address.district} จ.{address.province} {address.postalCode}</p></div></div><div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">{!address.default && <button type="button" onClick={() => setDefault(address.id)} className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-800">ตั้งเป็นหลัก</button>}<button type="button" onClick={() => openEdit(address)} className="rounded-full bg-orange-50 px-3 py-2 text-[11px] font-bold text-orange-600"><i className="fa-solid fa-pen mr-1" />แก้ไข</button><button type="button" onClick={() => remove(address.id)} className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-bold text-red-500"><i className="fa-solid fa-trash mr-1" />ลบ</button></div></article>)}</div>
    {showConfirm && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true"><div className="w-full max-w-[380px] rounded-[28px] bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.22)]"><div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-location-dot text-2xl" /></div><h2 className="mt-4 text-xl font-extrabold text-slate-900">ยืนยันการบันทึก?</h2><p className="mt-2 text-sm text-slate-500">คุณต้องการบันทึกที่อยู่จัดส่งนี้หรือไม่?</p><div className="mt-6 flex gap-2"><button type="button" onClick={() => setShowConfirm(false)} className="h-12 flex-1 rounded-2xl bg-gray-100 text-sm font-extrabold text-gray-600">ยกเลิก</button><button type="button" onClick={confirmSave} className="h-12 flex-1 rounded-2xl bg-orange-500 text-sm font-extrabold text-white">ยืนยันบันทึก</button></div></div></div>}
    {showSuccess && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true"><div className="w-full max-w-[380px] rounded-[28px] bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.22)]" style={{ animation: 'addressCardIn .48s cubic-bezier(.2,.8,.2,1) both' }}><style>{`@keyframes addressCardIn{0%{opacity:0;transform:translateY(18px) scale(.92)}65%{transform:translateY(-3px) scale(1.02)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style><div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-check text-2xl" /></div><h2 className="mt-4 text-xl font-extrabold text-slate-900">บันทึกที่อยู่เรียบร้อยแล้ว</h2><p className="mt-2 text-sm text-slate-500">ที่อยู่จัดส่งของคุณถูกบันทึกเรียบร้อย</p><button type="button" onClick={() => setShowSuccess(false)} className="mt-6 h-12 w-full rounded-2xl bg-orange-500 text-sm font-extrabold text-white">ตกลง</button></div></div>}
  </PageShell>
}

function PaymentForm({ value, onChange, onSave, onCancel, editing }) {
  const type = value.type
  return <form onSubmit={onSave} className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="m-0 text-base font-extrabold text-gray-900">{editing ? 'แก้ไขวิธีชำระเงิน' : 'เพิ่มวิธีชำระเงิน'}</h2><p className="m-0 mt-1 text-xs text-gray-400">ข้อมูลจะถูกใช้ในหน้าชำระเงิน</p></div><span className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-wallet" /></span></div><div className="grid grid-cols-2 gap-2">{[['promptpay','พร้อมเพย์','fa-qrcode'],['card','บัตรเครดิต / เดบิต','fa-credit-card'],['bank','โอนผ่านธนาคาร','fa-building-columns'],['cod','เก็บเงินปลายทาง','fa-money-bill-wave']].map(([id,label,icon])=><button key={id} type="button" onClick={()=>onChange({...value,type:id})} className={`rounded-2xl border p-3 text-left ${type===id?'border-orange-500 bg-orange-50':'border-gray-100 bg-white'}`}><i className={`fa-solid ${icon} mr-2 ${type===id?'text-orange-500':'text-gray-400'}`} /><span className="text-xs font-bold">{label}</span></button>)}</div>{type==='promptpay'&&<label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-gray-600">เบอร์โทรศัพท์ 10 หลัก หรือเลขพร้อมเพย์</span><input required value={value.detail||''} onChange={(e)=>onChange({...value,detail:e.target.value})} placeholder="0812345678" className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200" /></label>}{type==='card'&&<label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-gray-600">เลขบัตร 4 หลักสุดท้าย</span><input required inputMode="numeric" maxLength={4} value={value.detail||''} onChange={(e)=>onChange({...value,detail:e.target.value.replace(/\D/g,'').slice(-4)})} placeholder="4242" className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200" /></label>}{type==='bank'&&<label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-gray-600">ชื่อธนาคาร</span><input required value={value.detail||''} onChange={(e)=>onChange({...value,detail:e.target.value})} placeholder="เช่น กสิกรไทย" className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200" /></label>}{type==='cod'&&<div className="mt-4 rounded-2xl bg-gray-50 p-4 text-xs text-gray-500">ชำระเงินเมื่อได้รับสินค้า</div>}<label className="mt-4 flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-3 text-xs font-bold text-orange-700">ตั้งเป็นวิธีหลัก<input type="checkbox" checked={Boolean(value.default)} onChange={(e)=>onChange({...value,default:e.target.checked})} className="size-4 accent-orange-500" /></label><div className="mt-5 flex gap-2"><button type="button" onClick={onCancel} className="h-11 flex-1 rounded-full bg-gray-100 text-sm font-bold text-gray-600">ยกเลิก</button><button type="submit" className="h-11 flex-1 rounded-full bg-orange-500 text-sm font-bold text-white">{editing?'บันทึก':'เพิ่มวิธีชำระเงิน'}</button></div></form>
}

function Payments() {
  const [payments,setPayments]=useState(()=>readStorage(PAYMENT_STORAGE_KEY,seedPayments)),[showForm,setShowForm]=useState(false),[editingId,setEditingId]=useState(null),[form,setForm]=useState({type:'promptpay',detail:'',default:false})
  const persist=(next)=>{setPayments(next);saveStorage(PAYMENT_STORAGE_KEY,next);window.dispatchEvent(new Event('petshop-payment-updated'))}
  const openAdd=()=>{setEditingId(null);setForm({type:'promptpay',detail:'',default:payments.length===0});setShowForm(true)}
  const openEdit=(payment)=>{setEditingId(payment.id);let detail=payment.detail||'';if(payment.type==='card')detail=detail.replace(/\D/g,'').slice(-4);setForm({type:payment.type,detail,default:Boolean(payment.default)});setShowForm(true)}
  const display=(payment)=>payment.type==='card'?`•••• •••• •••• ${String(payment.detail||'').replace(/\D/g,'').slice(-4)||'----'}`:payment.type==='cod'?'ชำระเงินเมื่อได้รับสินค้า':payment.detail||'-'
  const save=(event)=>{event.preventDefault();const detail=form.type==='cod'?'ชำระเงินเมื่อได้รับสินค้า':form.detail.trim();if(form.type!=='cod'&&!detail)return;const names={promptpay:'พร้อมเพย์',card:'บัตรเครดิต / เดบิต',bank:'โอนผ่านธนาคาร',cod:'เก็บเงินปลายทาง'},icons={promptpay:'fa-qrcode',card:'fa-credit-card',bank:'fa-building-columns',cod:'fa-money-bill-wave'};const item={id:editingId??Date.now(),type:form.type,name:names[form.type],detail,icon:icons[form.type],default:form.default};let next=editingId?payments.map((p)=>p.id===editingId?item:p):[...payments,item];if(item.default||next.length===1)next=next.map((p)=>({...p,default:p.id===item.id}));else if(!next.some((p)=>p.default))next=next.map((p,i)=>({...p,default:i===0}));persist(next);setShowForm(false);setEditingId(null)}
  const remove=(id)=>{if(!window.confirm('ต้องการลบวิธีชำระเงินนี้ใช่ไหม?'))return;let next=payments.filter((p)=>p.id!==id);if(next.length&&!next.some((p)=>p.default))next=next.map((p,i)=>({...p,default:i===0}));persist(next)}
  const setDefault=(id)=>persist(payments.map((p)=>({...p,default:p.id===id})))
  return <PageShell title="วิธีชำระเงิน" icon="fa-credit-card"><button type="button" onClick={openAdd} className="flex w-full items-center gap-3 rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-4 text-left active:scale-[0.99]"><span className="grid size-11 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm"><i className="fa-solid fa-plus" /></span><span className="flex-1"><strong className="block text-sm font-extrabold text-gray-800">เพิ่มวิธีชำระเงิน</strong><small className="mt-1 block text-xs text-gray-400">เลือกวิธีที่ต้องการใช้ตอนชำระเงิน</small></span><i className="fa-solid fa-chevron-right text-xs text-orange-400" /></button>{showForm&&<div className="mt-4"><PaymentForm value={form} onChange={setForm} onSave={save} onCancel={()=>setShowForm(false)} editing={Boolean(editingId)} /></div>}<div className="mt-5 space-y-3">{payments.map((payment)=><article key={payment.id} className={`rounded-3xl border bg-white p-4 shadow-sm ${payment.default?'border-orange-200':'border-gray-100'}`}><div className="flex items-center gap-3"><span className={`grid size-11 place-items-center rounded-2xl ${payment.default?'bg-orange-500 text-white':'bg-gray-100 text-gray-500'}`}><i className={`fa-solid ${payment.icon||'fa-credit-card'}`} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="m-0 text-sm font-extrabold">{payment.name}</h2>{payment.default&&<span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-extrabold text-orange-600">หลัก</span>}</div><p className="m-0 mt-1 text-xs text-gray-400">{display(payment)}</p></div></div><div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3">{!payment.default&&<button type="button" onClick={()=>setDefault(payment.id)} className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-800">ตั้งเป็นหลัก</button>}<button type="button" onClick={()=>openEdit(payment)} className="rounded-full bg-orange-50 px-3 py-2 text-[11px] font-bold text-orange-600"><i className="fa-solid fa-pen mr-1" />แก้ไข</button><button type="button" onClick={()=>remove(payment.id)} className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-bold text-red-500"><i className="fa-solid fa-trash mr-1" />ลบ</button></div></article>)}</div></PageShell>
}

function SimplePage({ title, icon, text }) { return <PageShell title={title} icon={icon}><div className="rounded-3xl bg-white p-8 text-center shadow-sm"><div className="mx-auto grid size-14 place-items-center rounded-full bg-orange-50 text-orange-500"><i className={`fa-solid ${icon} text-xl`} /></div><h2 className="mt-3 text-sm font-extrabold">{title}</h2><p className="mt-1 text-xs leading-5 text-gray-400">{text}</p></div></PageShell> }
export default function ProfileSettings({ type }) { if(type==='addresses')return <Addresses />;if(type==='payment')return <Payments />;if(type==='edit')return <SimplePage title="แก้ไขข้อมูลส่วนตัว" icon="fa-user-pen" text="ส่วนแก้ไขข้อมูลส่วนตัวพร้อมเชื่อมต่อกับข้อมูลสมาชิกในขั้นถัดไป" />;if(type==='favorites')return <SimplePage title="รายการโปรด" icon="fa-heart" text="รายการสินค้าที่คุณบันทึกไว้จะแสดงที่หน้านี้" />;if(type==='coupons')return <SimplePage title="คูปอง" icon="fa-ticket" text="คูปองและส่วนลดของคุณจะแสดงที่หน้านี้" />;return <SimplePage title="ตั้งค่าโปรไฟล์" icon="fa-gear" text="เลือกเมนูจากหน้าโปรไฟล์เพื่อจัดการข้อมูลของคุณ" /> }
