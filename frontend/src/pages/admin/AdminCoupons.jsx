import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../api/coupons.js'

const COUPONS_PER_PAGE = 20

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
  if (item.limit > 0 && item.used >= item.limit) return { label: 'ครบจำนวน', cls: 'bg-gray-100 text-gray-500' }
  return { label: 'กำลังใช้งาน', cls: 'bg-emerald-50 text-emerald-600' }
}

const blankForm = { code: '', title: '', type: 'ส่วนลดคงที่', value: '', min: 0, maxDiscount: '', limit: 100, perUser: 1, start: '', expire: '' }

export default function AdminCoupons() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadError, setLoadError] = useState('')
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const refresh = () => {
    setLoading(true)
    setLoadError('')
    setCurrentPage(1)
    getCoupons()
      .then(setItems)
      .catch((err) => setLoadError(err.message || 'โหลดข้อมูลโปรโมชั่นไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(x => scheduleStatus(x).label === 'กำลังใช้งาน').length,
    used: items.reduce((a, x) => a + Number(x.used || 0), 0),
  }), [items])

  const totalPages = Math.max(
    1,
    Math.ceil(
      items.length / COUPONS_PER_PAGE
    )
  )

  const paginatedItems = useMemo(() => {
    const start =
      (currentPage - 1) * COUPONS_PER_PAGE

    return items.slice(
      start,
      start + COUPONS_PER_PAGE
    )
  }, [items, currentPage])

  const pageStart =
    items.length === 0
      ? 0
      : (currentPage - 1) *
      COUPONS_PER_PAGE +
      1

  const pageEnd = Math.min(
    currentPage * COUPONS_PER_PAGE,
    items.length
  )

  const openCreate = () => {
    setEditingId(null)
    setForm(blankForm)
    setError('')
    setModal(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({ code: item.code || '', title: item.title || '', type: item.type || 'ส่วนลดคงที่', value: item.value ?? '', min: item.min || 0, maxDiscount: item.maxDiscount || '', limit: item.limit ?? 100, perUser: item.perUser ?? 1, start: item.start || '', expire: item.expire || '', active: item.active })
    setError('')
    setModal(true)
  }

  const save = async () => {
    if (!form.code.trim() || !form.title.trim() || !form.start || !form.expire) {
      setError('กรุณากรอกข้อมูลและกำหนดช่วงเวลาโปรโมชั่นให้ครบ')
      return
    }
    if (new Date(form.expire) <= new Date(form.start)) {
      setError('วันและเวลาสิ้นสุดต้องหลังวันและเวลาเริ่มต้น')
      return
    }
    const value = Number(form.value) || 0
    const minOrder = Number(form.min) || 0
    const maxDiscount = Number(form.maxDiscount) || 0
    const usageLimit = Number(form.limit)
    const perUserLimit = Number(form.perUser)

    if (minOrder < 0) {
      setError('ยอดซื้อขั้นต่ำต้องไม่ติดลบ')
      return
    }

    if (maxDiscount < 0) {
      setError('ส่วนลดสูงสุดต้องไม่ติดลบ')
      return
    }

    if (usageLimit < 0 || Number.isNaN(usageLimit)) {
      setError('จำนวนสิทธิ์ทั้งหมดไม่ถูกต้อง')
      return
    }

    if (perUserLimit < 0 || Number.isNaN(perUserLimit)) {
      setError('จำนวนครั้งต่อคนไม่ถูกต้อง')
      return
    }

    if (form.type === 'เปอร์เซ็นต์' && (value <= 0 || value > 100)) { setError('ส่วนลดเปอร์เซ็นต์ต้องอยู่ระหว่าง 1–100%'); return }
    if (form.type !== 'ค่าส่ง' && value <= 0) { setError('กรุณาระบุจำนวนส่วนลดมากกว่า 0'); return }

    setSaving(true)
    setError('')
    try {
      const payload = { ...form, active: editingId ? form.active : true }
      if (editingId) {
        await updateCoupon(editingId, payload)
      } else {
        await createCoupon(payload)
      }
      setModal(false)
      setForm(blankForm)
      refresh()
    } catch (err) {
      setError(err.message || 'บันทึกโปรโมชั่นไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item) => {
    try {
      await updateCoupon(item.id, { ...item, active: !item.active })
      refresh()
    } catch (err) {
      setLoadError(err.message || 'เปลี่ยนสถานะไม่สำเร็จ')
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCoupon(deleteTarget.id)
      setDeleteTarget(null)
      refresh()
    } catch (err) {
      setLoadError(err.message || 'ลบโปรโมชั่นไม่สำเร็จ')
    } finally {
      setDeleting(false)
    }
  }

  return <div className="space-y-4 pb-20 md:pb-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><div className="text-[10px] text-gray-400"><Link to="/home/admin">หน้าหลัก</Link>
        <i className="fa-solid fa-chevron-right mx-1 text-[8px]" />โปรโมชั่น</div><h1 className="mt-1 text-[22px] font-extrabold">จัดการโปรโมชั่น </h1>
      </div>
      <button onClick={openCreate} className="rounded-lg bg-[#6d3df5] px-4 py-2.5 text-[11px] font-bold text-white"><i className="fa-solid fa-plus mr-2" />สร้างโปรโมชั่น</button>
    </div>

    <div className="grid gap-3 sm:grid-cols-3"><Stat label="โปรโมชั่นทั้งหมด" value={stats.total} icon="fa-ticket" /><Stat label="กำลังใช้งาน" value={stats.active} icon="fa-circle-check" /><Stat label="ใช้ไปแล้ว" value={stats.used} icon="fa-chart-simple" /></div>

    {loadError && <div className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-500"><i className="fa-solid fa-circle-exclamation mr-1" />{loadError}</div>}

    <section className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-sm">
      <div className="max-h-[600px] overflow-auto">
        <table className="w-full min-w-[980px] text-left text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#fafafa] text-[9px] font-bold text-gray-400">
            <tr>
              <th className="px-4 py-3">โปรโมชั่น</th>
              <th>ประเภท</th><th>ส่วนลด</th>
              <th>การใช้งาน</th><th>เริ่ม</th>
              <th>สิ้นสุด</th><th>สถานะ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ?
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">กำลังโหลด...</td>
              </tr> : paginatedItems.map(x => {
                const status = scheduleStatus(x); return <tr key={x.id} className="border-t border-gray-50 hover:bg-violet-50/30">
                  <td className="px-4 py-3"><div className="font-extrabold text-[#6d3df5]">{x.code}</div><div className="mt-0.5 text-[9px] text-gray-500">{x.title}</div></td><td>{x.type}</td><td className="font-extrabold">{x.type === 'เปอร์เซ็นต์' ? `${x.value}%` : x.type === 'ค่าส่ง' ? 'ฟรี' : `฿${x.value}`}<div className="mt-0.5 text-[8px] font-normal text-gray-400">ขั้นต่ำ ฿{Number(x.min || 0).toLocaleString()}</div></td><td>{x.used} / {x.limit}<div className="mt-0.5 text-[8px] text-gray-400">ต่อคน {x.perUser || 1} ครั้ง</div></td><td>{formatDate(x.start)}</td><td>{formatDate(x.expire)}</td><td><button onClick={() => toggleActive(x)} className={`rounded-full px-2 py-1 text-[9px] font-bold ${status.cls}`}>{status.label}</button></td><td className="pr-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => openEdit(x)} title="แก้ไข" className="grid size-7 place-items-center rounded-lg bg-violet-50 text-violet-600"><i className="fa-solid fa-pen text-[9px]" /></button><button onClick={() => setDeleteTarget(x)} title="ลบ" className="grid size-7 place-items-center rounded-lg bg-red-50 text-red-500"><i className="fa-solid fa-trash text-[9px]" /></button></div></td>
                </tr>
              })}</tbody></table></div></section>

    <div className="flex flex-col gap-3 border-t border-[#f0f0f3] px-4 py-3 text-[10px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
      <span>
        แสดง {pageStart}-{pageEnd} จาก {items.length} โปรโมชั่น
      </span>

      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) =>
              Math.max(page - 1, 1)
            )
          }
          disabled={currentPage === 1}
          className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i className="fa-solid fa-chevron-left text-[10px]" />
        </button>

        <span className="min-w-[75px] text-center font-semibold text-gray-500">
          หน้า {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) =>
              Math.min(page + 1, totalPages)
            )
          }
          disabled={currentPage === totalPages}
          className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i className="fa-solid fa-chevron-right text-[10px]" />
        </button>
      </div>
    </div>

    {deleteTarget && <div className="fixed inset-0 z-[110] grid place-items-center bg-gray-950/45 p-4 backdrop-blur-sm" onMouseDown={e => e.target === e.currentTarget && !deleting && setDeleteTarget(null)}><div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white shadow-2xl">
      <div className="h-1.5 bg-red-500" />
      <div className="p-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500">
          <i className="fa-solid fa-trash text-xl" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold">ลบโปรโมชั่น?</h2>
        <p className="mt-1 text-xs text-gray-500">
          โปรโมชั่น <span className="font-bold text-gray-700">{deleteTarget.code}</span> จะถูกลบออกจากระบบ
        </p>
        <p className="text-[10px] text-gray-400">การลบโปรโมชั่นนี้ไม่สามารถย้อนกลับได้</p>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="h-11 flex-1 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 disabled:opacity-60">ยกเลิก</button>
          <button type="button" onClick={remove} disabled={deleting} className="h-11 flex-1 rounded-xl bg-red-500 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60">{deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}</button>
        </div>
      </div>
    </div></div>}

    {modal && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-4" onMouseDown={e => e.target === e.currentTarget && setModal(false)}><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex justify-between"><div><h2 className="text-base font-extrabold">{editingId ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่น'}</h2><p className="mt-0.5 text-[10px] text-gray-400">กำหนดช่วงเวลาให้ระบบจัดการสถานะให้อัตโนมัติ</p></div><button onClick={() => setModal(false)} className="text-gray-400"><i className="fa-solid fa-xmark" /></button></div>
      <div className="mt-4 space-y-3">
        <label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">รหัสโปรโมชั่น</span><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="เช่น PET100" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-[#6d3df5]" /></label>
        <label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">ชื่อโปรโมชั่น</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="เช่น ลด 100 บาท สำหรับสมาชิกใหม่" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-[#6d3df5]" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold text-gray-500">
              ประเภทส่วนลด
            </span>

            <select
              value={form.type}
              onChange={e =>
                setForm({
                  ...form,
                  type: e.target.value,
                  value:
                    e.target.value === 'ค่าส่ง'
                      ? 0
                      : form.value,
                })
              }
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs"
            >
              <option value="ส่วนลดคงที่">
                ส่วนลดคงที่
              </option>

              <option value="เปอร์เซ็นต์">
                เปอร์เซ็นต์
              </option>

              <option value="ค่าส่ง">
                ค่าส่ง
              </option>
            </select>
          </label>

          {form.type !== 'ค่าส่ง' ? (
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-gray-500">
                จำนวนส่วนลด
              </span>

              <input
                type="number"
                min="0"
                value={form.value}
                onChange={e =>
                  setForm({
                    ...form,
                    value: e.target.value,
                  })
                }
                placeholder={
                  form.type === 'เปอร์เซ็นต์'
                    ? 'เช่น 10'
                    : 'เช่น 100'
                }
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"
              />
            </label>
          ) : (
            <div className="flex items-end">
              <div className="flex h-10 w-full items-center rounded-lg bg-gray-100 px-3 text-xs font-semibold text-gray-500">
                ส่งฟรี
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold text-violet-700"><i className="fa-solid fa-sliders" /> เงื่อนไขการใช้คูปอง</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-[9px] font-bold text-gray-500">ยอดซื้อขั้นต่ำ (บาท)</span><input type="number" min="0" value={form.min} onChange={e => setForm({ ...form, min: e.target.value })} placeholder="เช่น 499" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs" /></label>
            <label className="block"><span className="mb-1 block text-[9px] font-bold text-gray-500">ส่วนลดสูงสุด (เฉพาะ %)</span><input type="number" min="0" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="ไม่จำกัด" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs" /></label>
            <label className="block"><span className="mb-1 block text-[9px] font-bold text-gray-500">ใช้ได้สูงสุดต่อคน</span><input type="number" min="0" value={form.perUser} onChange={e => setForm({ ...form, perUser: e.target.value })} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs" /><p className='mt-1 text-[9px] text-gray-400'> ใส่ 0 หากไม่จำกัดจำนวนครั้งต่อคน</p></label>
          </div>
        </div>
        <label className="block"><span className="mb-1 block text-[10px] font-bold text-gray-500">จำนวนสิทธิ์ทั้งหมด</span><input type="number" min="0" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs" /> <p className='mt-1 text-[9px] text-gray-400'> ใส่ 0 หากไม่จำกัดจำนวนสิทธิ์</p></label>
        <div className="rounded-xl bg-violet-50 p-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold text-violet-700"><i className="fa-regular fa-calendar-clock" /> ตั้งเวลาโปรโมชั่น</div><div className="grid gap-3 sm:grid-cols-2"><label className="relative block"><span className="mb-1 block text-[9px] font-bold text-gray-500">เริ่มวันที่และเวลา</span><input type="datetime-local" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs" /></label><label className="relative block"><span className="mb-1 block text-[9px] font-bold text-gray-500">สิ้นสุดวันที่และเวลา</span><input type="datetime-local" value={form.expire} onChange={e => setForm({ ...form, expire: e.target.value })} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs" /></label></div></div>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-500"><i className="fa-solid fa-circle-exclamation mr-1" />{error}</div>}
      </div>
      <div className="mt-5 flex gap-2"><button onClick={() => setModal(false)} className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500">ยกเลิก</button><button onClick={save} disabled={saving} className="h-10 flex-1 rounded-lg bg-[#6d3df5] text-xs font-bold text-white disabled:opacity-60">{saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'สร้างโปรโมชั่น'}</button></div>
    </div></div>}
  </div>
}

function Stat({ label, value, icon }) { return <div className="h-full rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f1edff] text-[#6d3df5]"><i className={`fa-solid ${icon} text-[11px]`} /></span><div><div className="text-[9px] text-gray-400">{label}</div><div className="text-lg font-extrabold">{value}</div></div></div></div> }