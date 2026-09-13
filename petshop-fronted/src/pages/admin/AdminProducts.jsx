import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getProductRating,
  getProductReviews,
  replyToReview,
  deleteProductReview,
} from '../../lib/reviews.js'
import { fuzzyFilterProducts } from '../../lib/fuzzySearch.js'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../api/products.js'

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

const categories = [
  'ทั้งหมด',
  ...categoryOptions.map(category => category.name),
]

const emptyForm = {
  name: '',
  category: 'อาหารแมว',
  categoryId: 1,
  subtitle: '',
  price: '',
  stock: '',
  image: '',
  rating: '5.0',
  reviews: 0,
  badge: '',
  description: '',
  highlights: '',
  variants: '',
  defaultSize: '',
}

function statusOf(stock) {
  if (stock <= 0) return 'หมดสต็อก'
  if (stock <= 15) return 'ใกล้หมด'
  return 'พร้อมขาย'
}

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState(
    () => searchParams.get('search') || '',
  )

  const [category, setCategory] = useState('ทั้งหมด')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const [reviewTarget, setReviewTarget] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [deleteReviewTarget, setDeleteReviewTarget] = useState(null)

  // โหลดสินค้าจาก Backend
  const refresh = async () => {
    try {
      setError('')
      setLoading(true)

      const data = await getProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load products error:', err)
      setError(err.message || 'โหลดข้อมูลสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // Sync search จาก URL
  useEffect(() => {
    const fromUrl = searchParams.get('search') || ''

    if (fromUrl !== search) {
      setSearch(fromUrl)
    }
  }, [searchParams])

  const filtered = useMemo(() => {
    const q = search.trim()

    const searched = q
      ? fuzzyFilterProducts(products, q)
      : products

    return searched.filter(
      product =>
        category === 'ทั้งหมด' ||
        product.category === category,
    )
  }, [products, search, category])

  const updateSearch = value => {
    setSearch(value)

    const params = new URLSearchParams(searchParams)

    if (value.trim()) {
      params.set('search', value)
    } else {
      params.delete('search')
    }

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
      categoryId: product.categoryId ?? getCategoryId(product.category),
      subtitle: product.subtitle || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      image: product.image || '',
      rating: product.rating || '5.0',
      reviews: product.reviews ?? 0,
      badge: product.badge || '',
      description: product.description || '',
      highlights: Array.isArray(product.highlights)
        ? product.highlights.join('\n')
        : '',
      variants: Array.isArray(product.variants)
        ? product.variants
            .map(v => `${v.label}:${v.price}`)
            .join(', ')
        : '',
      defaultSize: product.defaultSize || '',
    })

    setModal({
      type: 'edit',
      id: product.id,
    })
  }

  const save = async () => {
    setError('')

    const name = form.name.trim()
    const price = Number(form.price)
    const stock = Number(form.stock)
    const categoryId = Number(form.categoryId)

    if (!name) {
      setError('กรุณากรอกชื่อสินค้า')
      return
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setError('กรุณาเลือกหมวดหมู่สินค้า')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setError('กรุณากรอกราคาให้ถูกต้อง')
      return
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError('สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป')
      return
    }

    // Backend ProductRequest รองรับเฉพาะ fields เหล่านี้
    const payload = {
      category_id: categoryId,
      product_name: name,
      product_price: price,
      product_stock: stock,
      product_image: form.image || '',
      description: form.description.trim(),
    }

    try {
      if (modal === 'add') {
        await createProduct(payload)
      } else {
        await updateProduct(modal.id, payload)
      }

      setModal(null)
      await refresh()
    } catch (err) {
      console.error('Save product error:', err)
      setError(err.message || 'บันทึกสินค้าไม่สำเร็จ')
    }
  }

  const remove = async () => {
    if (!deleteTarget) return

    try {
      setError('')

      await deleteProduct(deleteTarget.id)

      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      console.error('Delete product error:', err)
      setError(err.message || 'ลบสินค้าไม่สำเร็จ')
    }
  }

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0,
  )

  const lowStock = products.filter(
    product => Number(product.stock) > 0 && Number(product.stock) <= 15,
  ).length

  const outOfStock = products.filter(
    product => Number(product.stock) <= 0,
  ).length

  return (
    <div className="space-y-4 pb-20 md:pb-6">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] text-gray-400">
            <Link to="/home/admin">หน้าหลัก</Link>
            <i className="fa-solid fa-chevron-right mx-2 text-[8px]" />
            สินค้า
          </div>

          <h1 className="mt-1 text-[22px] font-extrabold">
            จัดการสินค้า
          </h1>

          <p className="mt-0.5 text-[11px] text-gray-400">
            เพิ่ม แก้ไข ลบสินค้า และตรวจสอบสต็อกแบบเรียลไทม์
          </p>
        </div>

        <button
          onClick={openAdd}
          className="rounded-xl bg-[#6d3df5] px-4 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-violet-500/20 hover:bg-violet-700"
        >
          <i className="fa-solid fa-plus mr-2" />
          เพิ่มสินค้า
        </button>
      </div>

      {/* Error */}
      {error && !modal && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
          <i className="fa-solid fa-circle-exclamation mr-2" />
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini
          label="สินค้าทั้งหมด"
          value={products.length}
          icon="fa-box"
        />

        <Mini
          label="สต็อกรวม"
          value={totalStock.toLocaleString()}
          icon="fa-layer-group"
        />

        <Mini
          label="ใกล้หมด"
          value={lowStock}
          icon="fa-triangle-exclamation"
        />

        <Mini
          label="หมดสต็อก"
          value={outOfStock}
          icon="fa-circle-xmark"
        />
      </div>

      {/* Search */}
      <section className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-[0_2px_10px_rgba(30,30,50,0.03)]">
        <div className="flex flex-col gap-2 md:flex-row">

          <label className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400" />

            <input
              value={search}
              onChange={e => updateSearch(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า หมวดหมู่ หรือ ID..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-[11px] outline-none focus:border-violet-300 focus:bg-white"
            />
          </label>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[11px] text-gray-600"
          >
            {categories.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Product table */}
      <section className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-[0_2px_10px_rgba(30,30,50,0.03)]">

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[11px]">

            <thead className="bg-[#fafafa] text-[9px] font-bold text-gray-400">
              <tr>
                <th className="px-4 py-3">สินค้า</th>
                <th>หมวดหมู่</th>
                <th>ราคา</th>
                <th>คะแนน</th>
                <th>รีวิว</th>
                <th>สต็อก</th>
                <th>ขายแล้ว</th>
                <th>สถานะ</th>
                <th className="text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-14 text-center">
                    <i className="fa-solid fa-spinner fa-spin text-lg text-violet-500" />
                    <p className="mt-3 text-xs text-gray-400">
                      กำลังโหลดสินค้า...
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(product => {
                  const stock = Number(product.stock || 0)
                  const status = statusOf(stock)

                  const reviewSummary = getProductRating(
                    product.id,
                    product.rating,
                    product.reviews,
                  )

                  return (
                    <tr
                      key={product.id}
                      className="border-t border-gray-50 hover:bg-violet-50/30"
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">

                          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f3f0ff] text-[#6d3df5]">

                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <i
                                className={`fa-solid ${
                                  product.category?.includes('แมว')
                                    ? 'fa-cat'
                                    : product.category?.includes('สุนัข')
                                      ? 'fa-dog'
                                      : 'fa-box'
                                } text-[11px]`}
                              />
                            )}

                          </span>

                          <div>
                            <div className="font-bold text-gray-800">
                              {product.name}
                            </div>

                            <div className="text-[9px] text-gray-400">
                              SKU-PET-
                              {String(product.id).padStart(4, '0')}
                            </div>
                          </div>

                        </div>
                      </td>

                      {/* Category */}
                      <td className="text-gray-500">
                        {product.category || '-'}
                      </td>

                      {/* Price */}
                      <td className="font-extrabold">
                        ฿{Number(product.price || 0).toLocaleString()}
                      </td>

                      {/* Rating */}
                      <td>
                        <span className="font-bold text-orange-500">
                          ★ {reviewSummary.rating.toFixed(1)}
                        </span>
                      </td>

                      {/* Reviews */}
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewTarget(product)
                            setReplyText('')
                          }}
                          className="font-bold text-violet-600 hover:underline"
                        >
                          {reviewSummary.reviews} รีวิว
                        </button>
                      </td>

                      {/* Stock */}
                      <td
                        className={`font-bold ${
                          status === 'หมดสต็อก'
                            ? 'text-red-500'
                            : status === 'ใกล้หมด'
                              ? 'text-amber-500'
                              : 'text-gray-700'
                        }`}
                      >
                        {stock}
                      </td>

                      {/* Sold */}
                      <td>
                        {product.sold || 0}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                            status === 'หมดสต็อก'
                              ? 'bg-red-50 text-red-500'
                              : status === 'ใกล้หมด'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex justify-center gap-1">

                          <button
                            title="แก้ไข"
                            onClick={() => openEdit(product)}
                            className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:border-violet-200 hover:text-violet-600"
                          >
                            <i className="fa-solid fa-pen text-[9px]" />
                          </button>

                          <button
                            title="ลบ"
                            onClick={() => setDeleteTarget(product)}
                            className="grid size-8 place-items-center rounded-lg border border-gray-200 text-red-400 hover:bg-red-50"
                          >
                            <i className="fa-regular fa-trash-can text-[9px]" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>

          </table>
        </div>

        {!loading && !filtered.length && (
          <div className="p-14 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-gray-50 text-gray-300">
              <i className="fa-solid fa-box-open" />
            </div>

            <p className="mt-3 text-xs font-bold text-gray-500">
              ไม่พบสินค้า
            </p>

            <p className="mt-1 text-[10px] text-gray-400">
              ลองเปลี่ยนคำค้นหาหรือหมวดหมู่
            </p>
          </div>
        )}
      </section>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          product={reviewTarget}
          replyText={replyText}
          setReplyText={setReplyText}
          onClose={() => setReviewTarget(null)}
          onReply={reviewId => {
            if (!replyText.trim()) return

            replyToReview(reviewId, replyText)
            setReplyText('')
          }}
          onDelete={review => setDeleteReviewTarget(review)}
        />
      )}

      {/* Delete review */}
      {deleteReviewTarget && (
        <Modal
          title="ลบรีวิว"
          onClose={() => setDeleteReviewTarget(null)}
        >
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-xs font-bold text-red-700">
              ต้องการลบรีวิวของ “
              {deleteReviewTarget.userName}
              ” ใช่หรือไม่?
            </p>

            <p className="mt-1 text-[10px] text-red-500">
              รีวิวและคำตอบจากร้านค้าจะถูกลบออกจากระบบ
            </p>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setDeleteReviewTarget(null)}
              className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500"
            >
              ยกเลิก
            </button>

            <button
              onClick={() => {
                deleteProductReview(deleteReviewTarget.id)
                setDeleteReviewTarget(null)
              }}
              className="h-10 flex-1 rounded-lg bg-red-500 text-xs font-bold text-white"
            >
              ลบรีวิว
            </button>
          </div>
        </Modal>
      )}

      {/* Add / Edit product */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'เพิ่มสินค้า' : 'แก้ไขสินค้า'}
          onClose={() => setModal(null)}
        >
          <ProductForm
            form={form}
            setForm={setForm}
            error={error}
            setError={setError}
          />

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setModal(null)}
              className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500"
            >
              ยกเลิก
            </button>

            <button
              onClick={save}
              disabled={loading}
              className="h-10 flex-1 rounded-lg bg-[#6d3df5] text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              บันทึกสินค้า
            </button>
          </div>
        </Modal>
      )}

      {/* Delete product */}
      {deleteTarget && (
        <Modal
          title="ยืนยันการลบสินค้า"
          onClose={() => setDeleteTarget(null)}
        >
          <div className="rounded-xl bg-red-50 p-4">
            <div className="flex gap-3">

              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-red-500">
                <i className="fa-solid fa-triangle-exclamation" />
              </span>

              <div>
                <p className="text-xs font-bold text-red-700">
                  ต้องการลบ “{deleteTarget.name}” ใช่หรือไม่?
                </p>

                <p className="mt-1 text-[10px] text-red-500">
                  ข้อมูลสินค้านี้จะถูกลบออกจากระบบ
                </p>
              </div>

            </div>
          </div>

          <div className="mt-5 flex gap-2">

            <button
              onClick={() => setDeleteTarget(null)}
              className="h-10 flex-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-500"
            >
              ยกเลิก
            </button>

            <button
              onClick={remove}
              className="h-10 flex-1 rounded-lg bg-red-500 text-xs font-bold text-white"
            >
              ลบสินค้า
            </button>

          </div>
        </Modal>
      )}

    </div>
  )
}

/* =========================================================
   Product Form
========================================================= */

function ProductForm({
  form,
  setForm,
  error,
  setError,
}) {
  const field = (key, value) => {
    setForm(current => ({
      ...current,
      [key]: value,
    }))
  }

  const handleCategoryChange = value => {
    const selected = categoryOptions.find(
      category => category.name === value,
    )

    setForm(current => ({
      ...current,
      category: value,
      categoryId: selected?.id || '',
    }))
  }

  return (
    <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1">

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        {/* Name */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
            ชื่อสินค้า <span className="text-red-400">*</span>
          </label>

          <input
            autoFocus
            value={form.name}
            onChange={e => field('name', e.target.value)}
            placeholder="เช่น Royal Canin Adult 3kg"
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-400"
          />
        </div>

        {/* Subtitle */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
            คำโปรย / ชื่อรอง
          </label>

          <input
            value={form.subtitle}
            onChange={e => field('subtitle', e.target.value)}
            placeholder="เช่น อาหารสุนัขโตพันธุ์กลาง"
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
            หมวดหมู่ <span className="text-red-400">*</span>
          </label>

          <select
            value={form.category}
            onChange={e => handleCategoryChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"
          >
            {categoryOptions.map(category => (
              <option
                key={category.id}
                value={category.name}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
            ราคา (บาท) <span className="text-red-400">*</span>
          </label>

          <input
            type="number"
            min="0"
            value={form.price}
            onChange={e => field('price', e.target.value)}
            placeholder="0"
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
            สต็อก <span className="text-red-400">*</span>
          </label>

          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={e => field('stock', e.target.value)}
            placeholder="0"
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"
          />
        </div>

        {/* Badge */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
            ป้ายสินค้า
          </label>

          <input
            value={form.badge}
            onChange={e => field('badge', e.target.value)}
            placeholder="เช่น ขายดี / แนะนำ / ลด 20%"
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
          รายละเอียดสินค้า
        </label>

        <textarea
          value={form.description}
          onChange={e => field('description', e.target.value)}
          rows="3"
          placeholder="รายละเอียดสินค้า"
          className="w-full resize-none rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-violet-400"
        />
      </div>

      {/* Highlights */}
      <div>
        <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
          จุดเด่นสินค้า{' '}
          <span className="font-normal text-gray-400">
            (ขึ้นบรรทัดใหม่แต่ละข้อ)
          </span>
        </label>

        <textarea
          value={form.highlights}
          onChange={e => field('highlights', e.target.value)}
          rows="3"
          placeholder={`โปรตีนคุณภาพสูง
ช่วยดูแลสุขภาพ
เหมาะสำหรับสุนัขโต`}
          className="w-full resize-none rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-violet-400"
        />
      </div>

      {/* Variants */}
      <div>
        <label className="mb-1.5 block text-[10px] font-bold text-gray-500">
          ตัวเลือกขนาด / ราคา{' '}
          <span className="font-normal text-gray-400">
            (เช่น 1.5 kg:520, 3 kg:890)
          </span>
        </label>

        <input
          value={form.variants}
          onChange={e => field('variants', e.target.value)}
          placeholder="1.5 kg:520, 3 kg:890, 10 kg:2270"
          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"
        />

        <input
          value={form.defaultSize}
          onChange={e => field('defaultSize', e.target.value)}
          placeholder="ขนาดเริ่มต้น เช่น 3 kg"
          className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-xs"
        />
      </div>

      {/* Image */}
      <div className="rounded-xl border border-dashed border-gray-200 p-3">

        <div className="flex items-center gap-3">

          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-50 text-gray-300">

            {form.image ? (
              <img
                src={form.image}
                alt="ตัวอย่างสินค้า"
                className="size-full object-cover"
              />
            ) : (
              <i className="fa-solid fa-image text-lg" />
            )}

          </div>

          <div className="min-w-0 flex-1">

            <p className="text-xs font-bold text-gray-700">
              รูปภาพสินค้า
            </p>

            <p className="mt-1 text-[10px] text-gray-400">
              รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 2 MB
            </p>

            <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-600 hover:bg-violet-100">

              <i className="fa-solid fa-upload mr-2" />

              เลือกจากเครื่อง

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={pickImageFromForm(setForm, setError)}
                className="hidden"
              />

            </label>

            {form.image && (
              <button
                type="button"
                onClick={() => field('image', '')}
                className="ml-2 text-[10px] font-bold text-red-400"
              >
                ลบรูป
              </button>
            )}

          </div>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-500">
          {error}
        </p>
      )}

    </div>
  )
}

/* =========================================================
   Image
========================================================= */

function pickImageFromForm(setForm, setError) {
  return event => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('รูปภาพต้องมีขนาดไม่เกิน 2 MB')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setForm(current => ({
        ...current,
        image: String(reader.result || ''),
      }))
    }

    reader.readAsDataURL(file)
  }
}

/* =========================================================
   Review Modal
========================================================= */

function ReviewModal({
  product,
  replyText,
  setReplyText,
  onClose,
  onReply,
  onDelete,
}) {
  const [reviews, setReviews] = useState(
    () => getProductReviews(product.id),
  )

  useEffect(() => {
    const refresh = () => {
      setReviews(getProductReviews(product.id))
    }

    window.addEventListener(
      'petshop-reviews-updated',
      refresh,
    )

    return () => {
      window.removeEventListener(
        'petshop-reviews-updated',
        refresh,
      )
    }
  }, [product.id])

  const summary = getProductRating(
    product.id,
    product.rating,
    product.reviews,
  )

  return (
    <Modal
      title={`รีวิว ${product.name}`}
      onClose={onClose}
    >
      <div className="mt-4 rounded-xl bg-orange-50 p-4 text-center">

        <div className="text-2xl font-extrabold text-orange-500">
          ★ {summary.rating.toFixed(1)}
        </div>

        <p className="mt-1 text-[10px] text-gray-500">
          จาก {summary.reviews} รีวิวของลูกค้า
        </p>

      </div>

      <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto">

        {reviews.length ? (
          reviews.map(review => (
            <div
              key={review.id}
              className="rounded-xl border border-gray-100 p-3"
            >
              <div className="flex items-center justify-between gap-2">

                <div className="min-w-0">
                  <span className="text-xs font-bold">
                    {review.userName}
                  </span>

                  <p className="mt-0.5 text-[9px] text-gray-400">
                    รีวิวเมื่อ {review.date}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">

                  <span className="text-xs text-orange-400">
                    {'★'.repeat(Number(review.rating))}
                    {'☆'.repeat(
                      5 - Number(review.rating),
                    )}
                  </span>

                  <button
                    type="button"
                    title="ลบรีวิว"
                    onClick={() => onDelete(review)}
                    className="grid size-7 place-items-center rounded-lg text-red-400 hover:bg-red-50"
                  >
                    <i className="fa-regular fa-trash-can text-[10px]" />
                  </button>

                </div>
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-600">
                {review.comment}
              </p>

              {review.reply ? (
                <div className="mt-2 rounded-lg bg-gray-50 p-2 text-[10px] text-gray-500">
                  <b className="text-violet-600">
                    ตอบกลับจากร้าน:
                  </b>{' '}
                  {review.reply}
                </div>
              ) : (
                <div className="mt-3 flex gap-2">

                  <input
                    value={replyText}
                    onChange={e =>
                      setReplyText(e.target.value)
                    }
                    placeholder="ตอบกลับลูกค้า..."
                    className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2 text-[10px]"
                  />

                  <button
                    type="button"
                    onClick={() => onReply(review.id)}
                    className="rounded-lg bg-[#6d3df5] px-3 text-[10px] font-bold text-white"
                  >
                    ตอบ
                  </button>

                </div>
              )}

              {review.customerReply && (
                <div className="mt-2 rounded-lg bg-orange-50 p-2 text-[10px] text-gray-600">
                  <b className="text-orange-600">
                    ลูกค้าตอบกลับ:
                  </b>{' '}
                  {review.customerReply}

                  <span className="ml-1 text-[9px] text-gray-400">
                    ({review.customerReplyDate || 'วันนี้'})
                  </span>
                </div>
              )}

            </div>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-gray-400">
            ยังไม่มีรีวิวจากลูกค้า
          </p>
        )}

      </div>
    </Modal>
  )
}

/* =========================================================
   Modal
========================================================= */

function Modal({
  title,
  onClose,
  children,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">

        <div className="flex items-center justify-between">

          <h2 className="text-base font-extrabold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-50"
          >
            <i className="fa-solid fa-xmark" />
          </button>

        </div>

        {children}

      </div>
    </div>
  )
}

/* =========================================================
   Mini
========================================================= */

function Mini({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-[0_2px_10px_rgba(30,30,50,0.03)]">

      <div className="flex items-center gap-3">

        <span className="grid size-9 place-items-center rounded-lg bg-[#f1edff] text-[#6d3df5]">
          <i className={`fa-solid ${icon} text-[11px]`} />
        </span>

        <div>
          <div className="text-[9px] text-gray-400">
            {label}
          </div>

          <div className="text-lg font-extrabold">
            {value}
          </div>
        </div>

      </div>
    </div>
  )
}

/* =========================================================
   Category helper
========================================================= */

function getCategoryId(categoryName) {
  const category = categoryOptions.find(
    item => item.name === categoryName,
  )

  return category?.id || ''
}