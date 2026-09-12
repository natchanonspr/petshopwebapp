import { useEffect, useMemo, useState } from 'react'
import { getStoreProfile, saveStoreProfile, STORE_UPDATED_EVENT } from '../lib/store.js'

const DEMO_ITEMS = [
  { name: 'Royal Canin Adult 3kg', qty: 1, price: 890 },
  { name: 'ขนมสุนัข Dental Care', qty: 2, price: 120 },
]

export default function StoreProfileCard() {
  const [store, setStore] = useState(getStoreProfile)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const refresh = () => setStore(getStoreProfile())
    window.addEventListener('storage', refresh)
    window.addEventListener(STORE_UPDATED_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(STORE_UPDATED_EVENT, refresh)
    }
  }, [])

  const update = (key, value) => setStore((current) => ({ ...current, [key]: value }))

  const chooseImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('image', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    saveStoreProfile(store)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const subtotal = useMemo(() => DEMO_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0), [])
  const vat = Math.round(subtotal * 0.07)
  const total = subtotal + vat

  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_420px]">
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_2px_12px_rgba(30,30,50,0.04)] md:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><i className="fa-solid fa-store text-sm"/></span>
            <h2 className="text-base font-extrabold">รายละเอียดร้านค้า</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-gray-400">แก้ไขข้อมูลที่จะแสดงบนใบเสร็จและเอกสารของร้าน</p>
        </div>
        {saved && <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-600"><i className="fa-solid fa-circle-check mr-1"/>บันทึกแล้ว</span>}
      </div>

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gray-200 bg-white text-violet-500 shadow-sm">
            {store.image ? <img src={store.image} alt="โลโก้ร้าน" className="h-full w-full object-cover"/> : <i className="fa-solid fa-paw text-3xl"/>}
          </div>
          <div className="min-w-[180px] flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Store Logo</p>
            <p className="mt-1 text-sm font-extrabold text-gray-800">โลโก้ร้านค้า</p>
            <p className="mt-1 text-[10px] leading-4 text-gray-400">แนะนำไฟล์ JPG หรือ PNG สำหรับใช้บนใบเสร็จ</p>
            <label className="mt-3 inline-flex cursor-pointer items-center rounded-xl bg-white px-3.5 py-2 text-[11px] font-bold text-violet-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-violet-50">
              <i className="fa-solid fa-image mr-2"/>เปลี่ยนโลโก้
              <input type="file" accept="image/*" onChange={chooseImage} className="hidden"/>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อร้าน" value={store.name} onChange={(value) => update('name', value)} placeholder="ชื่อร้าน PetShop" />
        <Field label="เบอร์โทรศัพท์" value={store.phone} onChange={(value) => update('phone', value)} placeholder="081-234-5678" />
        <Field label="เลขประจำตัวผู้เสียภาษี" value={store.taxId} onChange={(value) => update('taxId', value)} placeholder="13 หลัก" />
        <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
          <p className="text-[10px] font-bold text-violet-600">ใช้ข้อมูลนี้บนใบเสร็จ</p>
          <p className="mt-1 text-[10px] leading-4 text-gray-500">ชื่อร้าน ที่อยู่ เบอร์โทร และเลขภาษีจะซิงก์ไปยังใบเสร็จอัตโนมัติ</p>
        </div>
        <label className="sm:col-span-2 block"><span className="mb-1.5 block text-xs font-bold text-gray-700">ที่อยู่ร้าน</span><textarea value={store.address || ''} onChange={(e) => update('address', e.target.value)} rows={4} placeholder="ที่อยู่ร้านสำหรับออกใบเสร็จ" className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/></label>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => setStore(getStoreProfile())} className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-gray-500 transition hover:bg-gray-50">คืนค่าเดิม</button>
        <button type="button" onClick={handleSave} className="h-11 rounded-xl bg-violet-600 px-6 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-[.98]"><i className="fa-solid fa-floppy-disk mr-2"/>บันทึกข้อมูลร้านค้า</button>
      </div>
    </section>

    <ReceiptPreview store={store} items={DEMO_ITEMS} subtotal={subtotal} vat={vat} total={total} />
  </div>
}

function ReceiptPreview({ store, items, subtotal, vat, total }) {
  return <section className="sticky top-[92px] rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_2px_12px_rgba(30,30,50,0.04)] md:p-5">
    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
      <div>
        <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-violet-600"><i className="fa-solid fa-receipt text-xs"/></span><h2 className="text-sm font-extrabold">Preview ใบเสร็จ</h2></div>
        <p className="mt-1 text-[10px] text-gray-400">ตัวอย่างที่จะแสดงให้ลูกค้าเห็น</p>
      </div>
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[9px] font-bold text-gray-500">LIVE PREVIEW</span>
    </div>

    <div className="mt-5 rounded-[22px] border border-gray-200 bg-[#f1f2f5] p-3 md:p-4">
      <div className="relative mx-auto max-w-[330px] bg-white px-5 py-6 text-gray-900 shadow-[0_8px_25px_rgba(30,30,50,0.10)] before:absolute before:inset-x-0 before:-bottom-1 before:h-2 before:bg-[radial-gradient(circle_at_6px_0,transparent_5px,#fff_5.5px)] before:bg-[length:12px_8px] before:bg-repeat-x">
        <div className="text-center">
          <div className="mx-auto grid size-16 place-items-center overflow-hidden rounded-xl text-gray-700">
            {store.image ? <img src={store.image} alt="โลโก้ร้าน" className="h-full w-full object-contain"/> : <i className="fa-solid fa-paw text-3xl"/>}
          </div>
          <h3 className="mt-2 text-base font-black uppercase tracking-tight">{store.name || 'ชื่อร้านของคุณ'}</h3>
          <p className="mx-auto mt-1 max-w-[280px] whitespace-pre-line text-[9px] leading-4 text-gray-500">{store.address || 'ที่อยู่ร้าน'}</p>
          <p className="mt-0.5 text-[9px] text-gray-500">โทร {store.phone || '-'}</p>
          <p className="mt-0.5 text-[8px] text-gray-400">เลขประจำตัวผู้เสียภาษี: {store.taxId || '-'}</p>
        </div>

        <div className="my-4 border-t border-dashed border-gray-400" />
        <div className="text-center"><p className="text-xs font-black tracking-widest">ใบเสร็จรับเงิน</p><p className="mt-1 text-[8px] text-gray-400">RECEIPT / TAX INVOICE</p></div>
        <div className="mt-3 grid grid-cols-2 gap-1 text-[8px] text-gray-500"><span>เลขที่: <b className="text-gray-700">PS-20260906-001</b></span><span className="text-right">06/09/2026 14:30</span></div>

        <div className="my-4 border-t border-gray-300" />
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-[8px] font-bold text-gray-500"><span>รายการ</span><span>จำนวน</span><span>รวม</span></div>
        <div className="mt-2 space-y-2.5">
          {items.map((item) => <div key={item.name} className="grid grid-cols-[1fr_auto_auto] items-start gap-x-3"><div className="min-w-0"><p className="text-[9px] font-bold leading-3.5 text-gray-800">{item.name}</p><p className="text-[8px] text-gray-400">฿{item.price.toLocaleString()} / ชิ้น</p></div><span className="text-[9px] text-gray-600">{item.qty}</span><span className="text-right text-[9px] font-bold">฿{(item.price * item.qty).toLocaleString()}</span></div>)}
        </div>

        <div className="my-4 border-t border-dashed border-gray-400" />
        <div className="space-y-1.5 text-[9px]"><div className="flex justify-between"><span className="text-gray-500">รวมค่าสินค้า</span><span>฿{subtotal.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-gray-500">ส่วนลด</span><span>฿0.00</span></div><div className="flex justify-between"><span className="text-gray-500">ค่าจัดส่ง</span><span>ฟรี</span></div><div className="flex justify-between"><span className="text-gray-500">ราคาก่อน VAT</span><span>฿{subtotal.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-gray-500">VAT 7%</span><span>฿{vat.toLocaleString()}</span></div><div className="mt-2 flex items-end justify-between border-t-2 border-gray-900 pt-3"><span className="text-[11px] font-black">ยอดชำระสุทธิ</span><span className="text-lg font-black">฿{total.toLocaleString()}</span></div></div>

        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-[8px] text-gray-500"><div className="flex justify-between"><span>ชำระโดย</span><b className="text-gray-700">พร้อมเพย์</b></div><div className="mt-1 flex justify-between"><span>สถานะ</span><b className="text-emerald-600">ชำระเงินแล้ว</b></div></div>
        <div className="mt-5 border-t border-dashed border-gray-400 pt-3 text-center"><p className="text-[9px] font-bold">ขอบคุณที่ใช้บริการ</p><p className="mt-1 text-[8px] text-gray-400">Thank you for shopping with us</p><p className="mt-2 text-[7px] tracking-[.2em] text-gray-300">•• •••• ••• •••• ••</p></div>
      </div>
    </div>
  </section>
}

function Field({ label, value, onChange, placeholder }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-gray-700">{label}</span><input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/></label>
}
