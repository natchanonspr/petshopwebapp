import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadAdminData, updateAdminData } from '../../admin/data'
import { getProductRating, getProductReviews, replyToReview, deleteProductReview } from '../../lib/reviews.js'
import { fuzzyFilterProducts } from '../../lib/fuzzySearch.js'

const emptyForm = {
  name: '', category: 'อาหารแมว', subtitle: '', price: '', stock: '', image: '',
  rating: '5.0', reviews: 0, badge: '', description: '', highlights: '', variants: '', defaultSize: '',
}
const categories = [
  'ทั้งหมด',
  'อาหารแมว',
  'อาหารสุนัข',
  'ขนมแมว',
  'ขนมสุนัข',
  'ทรายแมว',
  'ของเล่น',
  'อุปกรณ์',
  'สุขภาพ',
  'ของใช้',
]

function statusOf(stock) {
  if (stock <= 0) return 'หมดสต็อก'
  if (stock <= 15) return 'ใกล้หมด'
  return 'พร้อมขาย'
}

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState(() => loadAdminData().products || [])
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [category, setCategory] = useState('ทั้งหมด')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [reviewTarget, setReviewTarget] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [deleteReviewTarget, setDeleteReviewTarget] = useState(null)

  const refresh = () => setProducts(loadAdminData().products || [])
  useEffect(() => {
    window.addEventListener('petshop-admin-data-updated', refresh)
    return () => window.removeEventListener('petshop-admin-data-updated', refresh)
  }, [])

  useEffect(() => {
    const fromUrl = searchParams.get('search') || ''
    if (fromUrl !== search) setSearch(fromUrl)
  }, [searchParams])

  const filtered = useMemo(() => {
    const q = search.trim()
    const searched = q ? fuzzyFilterProducts(products, q) : products
    return searched.filter(p => category === 'ทั้งหมด' || p.category === category)
  }, [products, search, category])

  const updateSearch = (value) => {
    setSearch(value)
    const params = new URLSearchParams(searchParams)
    if (value.trim()) params.set('search', value)
    else params.delete('search')
    setSearchParams(params, { replace: true })
  }

  const openAdd = () => { setError(''); setForm(emptyForm); setModal('add') }
  const openEdit = (p) => {
    setError('')
    setForm({
      name: p.name || '', category: p.category || 'อาหารแมว', subtitle: p.subtitle || '',
      price: p.price ?? '', stock: p.stock ?? '', image: p.image || '', rating: p.rating || '5.0',
      reviews: p.reviews ?? 0, badge: p.badge || '', description: p.description || '',
      highlights: Array.isArray(p.highlights) ? p.highlights.join('\\n') : '',
      variants: Array.isArray(p.variants) ? p.variants.map(v => `${v.label}:${v.price}`).join(', ') : '',
      defaultSize: p.defaultSize || '',
    })
    setModal({ type: 'edit', id: p.id })
  }

  const save = () => {
    const name = form.name.trim()
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!name) return setError('กรุณากรอกชื่อสินค้า')
    if (!Number.isFinite(price) || price < 0) return setError('กรุณากรอกราคาให้ถูกต้อง')
    if (!Number.isInteger(stock) || stock < 0) return setError('สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป')

    const highlights = form.highlights.split('\\n').map(v => v.trim()).filter(Boolean)
    const variants = form.variants.split(',').map(v => {
      const [label, value] = v.split(':').map(x => x.trim())
      const variantPrice = Number(value)
      return label && Number.isFinite(variantPrice) ? { label, price: variantPrice } : null
    }).filter(Boolean)

    updateAdminData(data => {
      data.products = data.products || []
      if (modal === 'add') {
        data.products.push({ id: Date.now(), name, category: form.category, subtitle: form.subtitle.trim(), price, stock, sold: 0, image: form.image || '', rating: '0.0', reviews: 0, badge: form.badge.trim(), description: form.description.trim(), highlights, variants, defaultSize: form.defaultSize.trim(), icon: 'fa-box' })
      } else {
        const item = data.products.find(p => p.id === modal.id)
        if (item) Object.assign(item, { name, category: form.category, subtitle: form.subtitle.trim(), price, stock, image: form.image || '', badge: form.badge.trim(), description: form.description.trim(), highlights, variants, defaultSize: form.defaultSize.trim() })
      }
    })
    setModal(null)
    refresh()
  }

  const remove = () => {
    if (!deleteTarget) return
    updateAdminData(data => {
      const existsInCatalog = [1,2,3,4].some(id => String(id) === String(deleteTarget.id))
      if (existsInCatalog) data.products = (data.products || []).map(p => p.id === deleteTarget.id ? { ...p, deleted: true } : p)
      else data.products = (data.products || []).filter(p => p.id !== deleteTarget.id)
    })
    setDeleteTarget(null)
    refresh()
  }

  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0)
  const lowStock = products.filter(p => Number(p.stock) <= 15).length
  const outOfStock = products.filter(p => Number(p.stock) <= 0).length

  return <div className="space-y-4 pb-20 md:pb-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-[10px] text-gray-400"><Link to="/home/admin">หน้าหลัก</Link><i className="fa-solid fa-chevron-right mx-2 text-[8px]"/>สินค้า</div>
        <h1 className="mt-1 text-[22px] font-extrabold">จัดการสินค้า</h1>
        <p className="mt-0.5 text-[11px] text-gray-400">เพิ่ม แก้ไข ลบสินค้า และตรวจสอบสต็อกแบบเรียลไทม์</p>
      </div>
      <button onClick={openAdd} className="rounded-xl bg-[#6d3df5] px-4 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-violet-500/20 hover:bg-violet-700"><i className="fa-solid fa-plus mr-2"/>เพิ่มสินค้า</button>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Mini label="สินค้าทั้งหมด" value={products.length} icon="fa-box" />
      <Mini label="สต็อกรวม" value={totalStock.toLocaleString()} icon="fa-layer-group" />
      <Mini label="ใกล้หมด / หมด" value={lowStock} icon="fa-triangle-exclamation" />
      <Mini label="หมดสต็อก" value={outOfStock} icon="fa-circle-xmark" />
    </div>

    <section className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-[0_2px_10px_rgba(30,30,50,0.03)]">
      <div className="flex flex-col gap-2 md:flex-row">
        <label className="relative flex-1"><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400"/><input value={search} onChange={e=>updateSearch(e.target.value)} placeholder="ค้นหาชื่อสินค้า หมวดหมู่ หรือ ID..." className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-[11px] outline-none focus:border-violet-300 focus:bg-white"/></label>
        <select value={category} onChange={e=>setCategory(e.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[11px] text-gray-600">{categories.map(c=><option key={c}>{c}</option>)}</select>
      </div>
    </section>

    <section className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-[0_2px_10px_rgba(30,30,50,0.03)]">
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[11px]"><thead className="bg-[#fafafa] text-[9px] font-bold text-gray-400"><tr><th className="px-4 py-3">สินค้า</th><th>หมวดหมู่</th><th>ราคา</th><th>คะแนน</th><th>รีวิว</th><th>สต็อก</th><th>ขายแล้ว</th><th>สถานะ</th><th className="text-center">จัดการ</th></tr></thead>
      <tbody>{filtered.map(p => { const s=statusOf(Number(p.stock)); const reviewSummary = getProductRating(p.id, p.rating, p.reviews); return <tr key={p.id} className="border-t border-gray-50 hover:bg-violet-50/30">
        <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f3f0ff] text-[#6d3df5]">{p.image?<img src={p.image} alt={p.name} className="size-full object-cover"/>:<i className={`fa-solid ${p.category.includes('แมว')?'fa-cat':p.category.includes('สุนัข')?'fa-dog':'fa-box'} text-[11px]`}/>}</span><div><div className="font-bold text-gray-800">{p.name}</div><div className="text-[9px] text-gray-400">SKU-PET-{String(p.id).padStart(4,'0')}</div></div></div></td>
        <td className="text-gray-500">{p.category}</td><td className="font-extrabold">฿{Number(p.price||0).toLocaleString()}</td><td><span className="font-bold text-orange-500">★ {reviewSummary.rating.toFixed(1)}</span></td><td><button type="button" onClick={()=>{setReviewTarget(p);setReplyText('')}} className="font-bold text-violet-600 hover:underline">{reviewSummary.reviews} รีวิว</button></td><td className={`font-bold ${s==='หมดสต็อก'?'text-red-500':s==='ใกล้หมด'?'text-amber-500':'text-gray-700'}`}>{p.stock}</td><td>{p.sold || 0}</td>
        <td><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${s==='หมดสต็อก'?'bg-red-50 text-red-500':s==='ใกล้หมด'?'bg-amber-50 text-amber-600':'bg-emerald-50 text-emerald-600'}`}>{s}</span></td>
        <td><div className="flex justify-center gap-1"><button title="แก้ไข" onClick={()=>openEdit(p)} className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:border-violet-200 hover:text-violet-600"><i className="fa-solid fa-pen text-[9px]"/></button><button title="ลบ" onClick={()=>setDeleteTarget(p)} className="grid size-8 place-items-center rounded-lg border border-gray-200 text-red-400 hover:bg-red-50"><i className="fa-regular fa-trash-can text-[9px]"/></button></div></td>
      </tr> })}</tbody></table></div>
      {!filtered.length && <div className="p-14 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-gray-50 text-gray-300"><i className="fa-solid fa-box-open"/></div><p className="mt-3 text-xs font-bold text-gray-500">ไม่พบสินค้า</p><p className="mt-1 text-[10px] text-gray-400">ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p></div>}
    </section>

    {reviewTarget && <ReviewModal product={reviewTarget} replyText={replyText} setReplyText={setReplyText} onClose={()=>setReviewTarget(null)} onReply={(reviewId)=>{ if (!replyText.trim()) return; replyToReview(reviewId, replyText); setReplyText(''); }} onDelete={(review)=>setDeleteReviewTarget(review)} />}
    {deleteReviewTarget && <Modal title="ลบรีวิว" onClose={()=>setDeleteReviewTarget(null)}><div className="rounded-xl bg-red-50 p-4"><p className="text-xs font-bold text-red-700">ต้องการลบรีวิวของ “{deleteReviewTarget.userName}” ใช่หรือไม่?</p><p className="mt-1 text-[10px] text-red-500">รีวิวและคำตอบจากร้านค้าจะถูกลบออกจากระบบ</p></div><div className="mt-5 flex gap-2"><button onClick={()=>setDeleteReviewTarget(null)} className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500">ยกเลิก</button><button onClick={()=>{deleteProductReview(deleteReviewTarget.id);setDeleteReviewTarget(null)}} className="h-10 flex-1 rounded-lg bg-red-500 text-xs font-bold text-white">ลบรีวิว</button></div></Modal>}
    {modal && <Modal title={modal==='add'?'เพิ่มสินค้า':'แก้ไขสินค้า'} onClose={()=>setModal(null)}><ProductForm form={form} setForm={setForm} error={error} setError={setError}/><div className="mt-5 flex gap-2"><button onClick={()=>setModal(null)} className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500">ยกเลิก</button><button onClick={save} className="h-10 flex-1 rounded-lg bg-[#6d3df5] text-xs font-bold text-white">บันทึกสินค้า</button></div></Modal>}
    {deleteTarget && <Modal title="ยืนยันการลบสินค้า" onClose={()=>setDeleteTarget(null)}><div className="rounded-xl bg-red-50 p-4"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-red-500"><i className="fa-solid fa-triangle-exclamation"/></span><div><p className="text-xs font-bold text-red-700">ต้องการลบ “{deleteTarget.name}” ใช่หรือไม่?</p><p className="mt-1 text-[10px] text-red-500">ข้อมูลสินค้านี้จะถูกลบออกจากระบบ</p></div></div></div><div className="mt-5 flex gap-2"><button onClick={()=>setDeleteTarget(null)} className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500">ยกเลิก</button><button onClick={remove} className="h-10 flex-1 rounded-lg bg-red-500 text-xs font-bold text-white">ลบสินค้า</button></div></Modal>}
  </div>
}

function ProductForm({ form, setForm, error, setError }) {
  const field = (key, value) => setForm(current => ({ ...current, [key]: value }))
  return <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="mb-1.5 block text-[10px] font-bold text-gray-500">ชื่อสินค้า <span className="text-red-400">*</span></label><input autoFocus value={form.name} onChange={e=>field('name',e.target.value)} placeholder="เช่น Royal Canin Adult 3kg" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-400"/></div>
      <div className="sm:col-span-2"><label className="mb-1.5 block text-[10px] font-bold text-gray-500">คำโปรย / ชื่อรอง</label><input value={form.subtitle} onChange={e=>field('subtitle',e.target.value)} placeholder="เช่น อาหารสุนัขโตพันธุ์กลาง" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"/></div>
      <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">หมวดหมู่ <span className="text-red-400">*</span></label><select value={form.category} onChange={e=>field('category',e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs">{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></div>
      <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">ราคา (บาท) <span className="text-red-400">*</span></label><input type="number" min="0" value={form.price} onChange={e=>field('price',e.target.value)} placeholder="0" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"/></div>
      <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">สต็อก <span className="text-red-400">*</span></label><input type="number" min="0" step="1" value={form.stock} onChange={e=>field('stock',e.target.value)} placeholder="0" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"/></div>
      <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">ป้ายสินค้า</label><input value={form.badge} onChange={e=>field('badge',e.target.value)} placeholder="เช่น ขายดี / แนะนำ / ลด 20%" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"/></div>
    </div>
    <textarea value={form.description} onChange={e=>field('description',e.target.value)} rows="3" placeholder="รายละเอียดสินค้า" className="w-full resize-none rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-violet-400"/>
    <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">จุดเด่นสินค้า <span className="font-normal text-gray-400">(ขึ้นบรรทัดใหม่แต่ละข้อ)</span></label><textarea value={form.highlights} onChange={e=>field('highlights',e.target.value)} rows="3" placeholder="โปรตีนคุณภาพสูง\nช่วยดูแลสุขภาพ\nเหมาะสำหรับสุนัขโต" className="w-full resize-none rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-violet-400"/></div>
    <div><label className="mb-1.5 block text-[10px] font-bold text-gray-500">ตัวเลือกขนาด / ราคา <span className="font-normal text-gray-400">(เช่น 1.5 kg:520, 3 kg:890, 10 kg:2270)</span></label><input value={form.variants} onChange={e=>field('variants',e.target.value)} placeholder="1.5 kg:520, 3 kg:890, 10 kg:2270" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"/><input value={form.defaultSize} onChange={e=>field('defaultSize',e.target.value)} placeholder="ขนาดเริ่มต้น เช่น 3 kg" className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"/></div>
    <div className="rounded-xl border border-dashed border-gray-200 p-3"><div className="flex items-center gap-3"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-50 text-gray-300">{form.image?<img src={form.image} alt="ตัวอย่างสินค้า" className="size-full object-cover"/>:<i className="fa-solid fa-image text-lg"/>}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-gray-700">รูปภาพสินค้า</p><p className="mt-1 text-[10px] text-gray-400">รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 2 MB</p><label className="mt-2 inline-flex cursor-pointer items-center rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-600 hover:bg-violet-100"><i className="fa-solid fa-upload mr-2"/>เลือกจากเครื่อง<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickImageFromForm(setForm,setError)} className="hidden"/></label>{form.image&&<button type="button" onClick={()=>field('image','')} className="ml-2 text-[10px] font-bold text-red-400">ลบรูป</button>}</div></div></div>
    {error&&<p className="text-[11px] font-semibold text-red-500">{error}</p>}
  </div>
}
function pickImageFromForm(setForm,setError){return event=>{const file=event.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/'))return setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');if(file.size>2*1024*1024)return setError('รูปภาพต้องมีขนาดไม่เกิน 2 MB');const reader=new FileReader();reader.onload=()=>setForm(current=>({...current,image:String(reader.result||'')}));reader.readAsDataURL(file)}}
function ReviewModal({ product, replyText, setReplyText, onClose, onReply, onDelete }) {
  const [reviews, setReviews] = useState(() => getProductReviews(product.id))
  useEffect(() => {
    const refresh = () => setReviews(getProductReviews(product.id))
    window.addEventListener('petshop-reviews-updated', refresh)
    return () => window.removeEventListener('petshop-reviews-updated', refresh)
  }, [product.id])
  const summary = getProductRating(product.id, product.rating, product.reviews)
  return <Modal title={`รีวิว ${product.name}`} onClose={onClose}>
    <div className="mt-4 rounded-xl bg-orange-50 p-4 text-center"><div className="text-2xl font-extrabold text-orange-500">★ {summary.rating.toFixed(1)}</div><p className="mt-1 text-[10px] text-gray-500">จาก {summary.reviews} รีวิวของลูกค้า</p></div>
    <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto">
      {reviews.length ? reviews.map(review => <div key={review.id} className="rounded-xl border border-gray-100 p-3"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><span className="text-xs font-bold">{review.userName}</span><p className="mt-0.5 text-[9px] text-gray-400">รีวิวเมื่อ {review.date}</p></div><div className="flex shrink-0 items-center gap-2"><span className="text-xs text-orange-400">{'★'.repeat(Number(review.rating))}{'☆'.repeat(5-Number(review.rating))}</span><button type="button" title="ลบรีวิว" onClick={()=>onDelete(review)} className="grid size-7 place-items-center rounded-lg text-red-400 hover:bg-red-50"><i className="fa-regular fa-trash-can text-[10px]"/></button></div></div><p className="mt-2 text-xs leading-5 text-gray-600">{review.comment}</p>{review.reply ? <div className="mt-2 rounded-lg bg-gray-50 p-2 text-[10px] text-gray-500"><b className="text-violet-600">ตอบกลับจากร้าน:</b> {review.reply}</div> : <div className="mt-3 flex gap-2"><input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="ตอบกลับลูกค้า..." className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2 text-[10px]"/><button type="button" onClick={()=>onReply(review.id)} className="rounded-lg bg-[#6d3df5] px-3 text-[10px] font-bold text-white">ตอบ</button></div>}{review.customerReply && <div className="mt-2 rounded-lg bg-orange-50 p-2 text-[10px] text-gray-600"><b className="text-orange-600">ลูกค้าตอบกลับ:</b> {review.customerReply}<span className="ml-1 text-[9px] text-gray-400">({review.customerReplyDate || 'วันนี้'})</span></div>}</div>) : <p className="py-8 text-center text-xs text-gray-400">ยังไม่มีรีวิวจากลูกค้า</p>}
    </div>
  </Modal>
}
function Modal({title,onClose,children}) { return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-4" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-base font-extrabold">{title}</h2><button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-50"><i className="fa-solid fa-xmark"/></button></div>{children}</div></div> }
function Mini({label,value,icon}) { return <div className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-[0_2px_10px_rgba(30,30,50,0.03)]"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f1edff] text-[#6d3df5]"><i className={`fa-solid ${icon} text-[11px]`}/></span><div><div className="text-[9px] text-gray-400">{label}</div><div className="text-lg font-extrabold">{value}</div></div></div></div> }
