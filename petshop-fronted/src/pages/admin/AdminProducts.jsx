import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fuzzyFilterProducts } from '../../lib/fuzzySearch.js'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products.js'

const categoryOptions = [
  { id: 1, name: 'อาหารแมว' },
  { id: 2, name: 'อาหารสุนัข' },
  { id: 3, name: 'ขนมแมว' },
  { id: 4, name: 'ขนมสุนัข' },
  { id: 5, name: 'ทรายแมว' },
  { id: 6, name: 'ของเล่น' },
  { id: 7, name: 'อุปกรณ์' },
  { id: 8, name: 'สุขภาพ' },
  { id: 9, name: 'ของใช้' },
]

const emptyForm = { name: '', category: 'อาหารแมว', categoryId: 1, price: '', stock: '', image: '', description: '' }

function statusOf(stock) {
  if (stock <= 0) return 'หมดสต็อก'
  if (stock <= 15) return 'ใกล้หมด'
  return 'พร้อมขาย'
}

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [category, setCategory] = useState('ทั้งหมด')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const refresh = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load products error:', err)
      setError(err.message || 'โหลดข้อมูลสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const filtered = useMemo(() => {
    const searched = search.trim() ? fuzzyFilterProducts(products, search.trim()) : products
    return searched.filter(product => category === 'ทั้งหมด' || product.category === category)
  }, [products, search, category])

  const updateSearch = value => {
    setSearch(value)
    const params = new URLSearchParams(searchParams)
    if (value.trim()) params.set('search', value)
    else params.delete('search')
    setSearchParams(params, { replace: true })
  }

  const openAdd = () => {
    setError('')
    setForm({ ...emptyForm })
    setModal('add')
  }

  const openEdit = product => {
    setError('')
    setForm({
      name: product.name || '',
      category: product.category || 'อาหารแมว',
      categoryId: product.categoryId || categoryOptions.find(x => x.name === product.category)?.id || 1,
      price: product.price ?? '',
      stock: product.stock ?? '',
      image: product.image || '',
      description: product.description || '',
    })
    setModal({ type: 'edit', id: product.id })
  }

  const save = async () => {
    setError('')
    const name = form.name.trim()
    const categoryId = Number(form.categoryId)
    const price = Number(form.price)
    const stock = Number(form.stock)

    if (!name) return setError('กรุณากรอกชื่อสินค้า')
    if (!Number.isInteger(categoryId) || categoryId <= 0) return setError('กรุณาเลือกหมวดหมู่สินค้า')
    if (!Number.isFinite(price) || price < 0) return setError('กรุณากรอกราคาให้ถูกต้อง')
    if (!Number.isInteger(stock) || stock < 0) return setError('สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป')

    const payload = {
      category_id: categoryId,
      product_name: name,
      product_price: price,
      product_stock: stock,
      product_image: form.image || '',
      description: form.description.trim(),
    }

    try {
      setSaving(true)
      if (modal === 'add') await createProduct(payload)
      else await updateProduct(modal.id, payload)
      setModal(null)
      await refresh()
    } catch (err) {
      console.error('Save product error:', err)
      setError(err.message || 'บันทึกสินค้าไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    try {
      setSaving(true)
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      setError(err.message || 'ลบสินค้าไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0)
  const lowStock = products.filter(product => Number(product.stock) > 0 && Number(product.stock) <= 15).length
  const outOfStock = products.filter(product => Number(product.stock) <= 0).length

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] text-gray-400"><Link to="/home/admin">หน้าหลัก</Link><i className="fa-solid fa-chevron-right mx-2 text-[8px]" />สินค้า</div>
          <h1 className="mt-1 text-[22px] font-extrabold">จัดการสินค้า</h1>
        </div>
        <button type="button" onClick={openAdd} className="rounded-xl bg-[#6d3df5] px-4 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-violet-500/20 hover:bg-violet-700">
          <i className="fa-solid fa-plus mr-2" />เพิ่มสินค้า
        </button>
      </div>

      {error && !modal && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"><i className="fa-solid fa-circle-exclamation mr-2" />{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="สินค้าทั้งหมด" value={products.length} icon="fa-box" />
        <Mini label="สต็อกรวม" value={totalStock.toLocaleString()} icon="fa-layer-group" />
        <Mini label="ใกล้หมด" value={lowStock} icon="fa-triangle-exclamation" />
        <Mini label="หมดสต็อก" value={outOfStock} icon="fa-circle-xmark" />
      </div>

      <section className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row">
          <label className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400" />
            <input value={search} onChange={e => updateSearch(e.target.value)} placeholder="ค้นหาชื่อสินค้า หมวดหมู่ หรือ ID..." className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-[11px] outline-none focus:border-violet-300 focus:bg-white" />
          </label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[11px] text-gray-600">
            <option value="ทั้งหมด">ทั้งหมด</option>
            {categoryOptions.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[11px]">
            <thead className="bg-[#fafafa] text-[9px] font-bold text-gray-400"><tr><th className="px-4 py-3">สินค้า</th><th>หมวดหมู่</th><th>ราคา</th><th>สต็อก</th><th>สถานะ</th><th className="text-center">จัดการ</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="px-4 py-14 text-center"><i className="fa-solid fa-spinner fa-spin text-lg text-violet-500" /><p className="mt-3 text-xs text-gray-400">กำลังโหลดสินค้า...</p></td></tr> : filtered.map(product => {
                const stock = Number(product.stock || 0)
                const status = statusOf(stock)
                return <tr key={product.id} className="border-t border-gray-50 hover:bg-violet-50/30">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f3f0ff] text-[#6d3df5]">{product.image ? <img src={product.image} alt={product.name} className="size-full object-cover" /> : <i className="fa-solid fa-box text-[11px]" />}</span><div><div className="font-bold text-gray-800">{product.name}</div><div className="text-[9px] text-gray-400">SKU-PET-{String(product.id).padStart(4, '0')}</div></div></div></td>
                  <td className="text-gray-500">{product.category || '-'}</td>
                  <td className="font-extrabold">฿{Number(product.price || 0).toLocaleString()}</td>
                  <td className={status === 'หมดสต็อก' ? 'font-bold text-red-500' : status === 'ใกล้หมด' ? 'font-bold text-amber-500' : 'font-bold text-gray-700'}>{stock}</td>
                  <td><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${status === 'หมดสต็อก' ? 'bg-red-50 text-red-500' : status === 'ใกล้หมด' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{status}</span></td>
                  <td><div className="flex justify-center gap-1"><button type="button" title="แก้ไข" onClick={() => openEdit(product)} className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:border-violet-200 hover:text-violet-600"><i className="fa-solid fa-pen text-[9px]" /></button><button type="button" title="ลบ" onClick={() => setDeleteTarget(product)} className="grid size-8 place-items-center rounded-lg border border-gray-200 text-red-400 hover:bg-red-50"><i className="fa-regular fa-trash-can text-[9px]" /></button></div></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        {!loading && !filtered.length && <div className="p-14 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-gray-50 text-gray-300"><i className="fa-solid fa-box-open" /></div><p className="mt-3 text-xs font-bold text-gray-500">ไม่พบสินค้า</p></div>}
      </section>

      {modal && <Modal title={modal === 'add' ? 'เพิ่มสินค้า' : 'แก้ไขสินค้า'} onClose={() => !saving && setModal(null)}>
        <ProductForm form={form} setForm={setForm} error={error} setError={setError} />
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => setModal(null)} disabled={saving} className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500">ยกเลิก</button>
          <button type="button" onClick={save} disabled={saving} className="h-10 flex-1 rounded-lg bg-[#6d3df5] text-xs font-bold text-white disabled:opacity-60">{saving ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}</button>
        </div>
      </Modal>}

      {deleteTarget && <div className="fixed inset-0 z-[110] grid place-items-center bg-gray-950/45 p-4 backdrop-blur-[2px]" onMouseDown={e => e.target === e.currentTarget && !saving && setDeleteTarget(null)}>
        <div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white shadow-2xl"><div className="h-1.5 bg-red-500" /><div className="p-5 text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500"><i className="fa-solid fa-trash-can text-xl" /></div><h2 className="mt-4 text-base font-extrabold">ยืนยันการลบสินค้า</h2><p className="mt-2 text-[11px] text-gray-500">คุณต้องการลบสินค้า <b>{deleteTarget.name}</b> ใช่หรือไม่?</p><p className="mt-1 text-[10px] text-gray-400">การลบสินค้านี้ไม่สามารถย้อนกลับได้</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => setDeleteTarget(null)} disabled={saving} className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500">ยกเลิก</button><button type="button" onClick={remove} disabled={saving} className="h-10 flex-1 rounded-lg bg-red-500 text-xs font-bold text-white">{saving ? 'กำลังลบ...' : 'ยืนยันลบ'}</button></div></div></div>
      </div>}
    </div>
  )
}

function ProductForm({ form, setForm, error, setError }) {
  const field = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const handleCategoryChange = value => {
    const selected = categoryOptions.find(category => category.name === value)
    setForm(current => ({ ...current, category: value, categoryId: selected?.id || '' }))
  }
  const pickImage = event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
    if (file.size > 2 * 1024 * 1024) return setError('รูปภาพต้องมีขนาดไม่เกิน 2 MB')
    const reader = new FileReader()
    reader.onload = () => setForm(current => ({ ...current, image: String(reader.result || '') }))
    reader.readAsDataURL(file)
  }
  return <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
    <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">ชื่อสินค้า <span className="text-red-400">*</span></label><input autoFocus value={form.name} onChange={e => field('name', e.target.value)} placeholder="เช่น Royal Canin Adult 3kg" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-400" /></div>
    <div className="grid grid-cols-2 gap-3">
      <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">หมวดหมู่ <span className="text-red-400">*</span></label><select value={form.category} onChange={e => handleCategoryChange(e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs">{categoryOptions.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
      <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">ราคา <span className="text-red-400">*</span></label><input type="number" min="0" value={form.price} onChange={e => field('price', e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs" /></div>
      <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">สต็อก <span className="text-red-400">*</span></label><input type="number" min="0" step="1" value={form.stock} onChange={e => field('stock', e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs" /></div>
    </div>
    <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">รายละเอียดสินค้า</label><textarea value={form.description} onChange={e => field('description', e.target.value)} rows="3" className="w-full resize-none rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-violet-400" /></div>
    <div className="rounded-xl border border-dashed border-gray-200 p-3"><div className="flex items-center gap-3"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-50 text-gray-300">{form.image ? <img src={form.image} alt="ตัวอย่างสินค้า" className="size-full object-cover" /> : <i className="fa-solid fa-image text-lg" />}</div><div><p className="text-xs font-bold text-gray-700">รูปภาพสินค้า</p><label className="mt-2 inline-flex cursor-pointer items-center rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-600"><i className="fa-solid fa-upload mr-2" />เลือกจากเครื่อง<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickImage} className="hidden" /></label>{form.image && <button type="button" onClick={() => field('image', '')} className="ml-2 text-[10px] font-bold text-red-400">ลบรูป</button>}</div></div></div>
    {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
  </div>
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-base font-extrabold">{title}</h2><button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-50"><i className="fa-solid fa-xmark" /></button></div>{children}</div></div>
}

function Mini({ label, value, icon }) {
  return <div className="h-full rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f1edff] text-[#6d3df5]"><i className={`fa-solid ${icon} text-[11px]`} /></span><div><div className="text-[9px] text-gray-400">{label}</div><div className="text-lg font-extrabold">{value}</div></div></div></div>
}
