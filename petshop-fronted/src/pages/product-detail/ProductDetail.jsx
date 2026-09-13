import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProductDetailHeader from '../../components/product-detail/ProductDetailHeader.jsx'
import ProductInfoCard from '../../components/product-detail/ProductInfoCard.jsx'
import ProductDescription from '../../components/product-detail/ProductDescription.jsx'
import ProductReviews from '../../components/product-detail/ProductReviews.jsx'
import FavoriteButton from '../../components/products/FavoriteButton.jsx'
import { getProduct } from '../../api/products.js'
import { addToCart } from '../../api/cart.js'
import { logActivity } from '../../admin/activity.js'

export default function ProductDetail() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [addError, setAddError] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')

    getProduct(productId)
      .then((data) => {
        if (!active) return
        if (!data) {
          setLoadError('ไม่พบสินค้านี้')
          return
        }
        setProduct(data)
        setQuantity(1)
        setAdded(false)
        logActivity('view_product', `ดูสินค้า ${data.name}`, {
          productId: data.id,
          productName: data.name,
        })
      })
      .catch((err) => {
        if (active) setLoadError(err?.message || 'โหลดข้อมูลสินค้าไม่สำเร็จ')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [productId])

  const handleAddToCart = async () => {
    if (!product || isAdding) return

    try {
      setIsAdding(true)
      setAddError('')

      await addToCart({ productId: product.id, cartQuantity: quantity })

      setAdded(true)
      logActivity('cart', `เพิ่ม ${product.name} ลงตะกร้า`, {
        productId: product.id,
        productName: product.name,
        qty: quantity,
      })
      window.setTimeout(() => setAdded(false), 1800)
    } catch (err) {
      setAddError(err?.message || 'เพิ่มลงตะกร้าไม่สำเร็จ')
    } finally {
      setIsAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
        <ProductDetailHeader />
        <div className="grid flex-1 place-items-center text-sm text-gray-400">
          <i className="fa-solid fa-spinner fa-spin mr-2" />
          กำลังโหลดข้อมูลสินค้า...
        </div>
      </div>
    )
  }

  if (loadError || !product) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
        <ProductDetailHeader />
        <div className="grid flex-1 place-items-center px-6 text-center text-sm text-gray-400">
          {loadError || 'ไม่พบสินค้านี้'}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <ProductDetailHeader />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="relative mb-5 overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-gray-100 text-[48px] text-gray-300">
            {product.image ? (
              <img src={product.image} alt={product.name} className="size-full object-contain p-5" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-300">
                <i className={`fa-solid ${product.icon}`} />
                <span className="text-xs font-medium text-gray-400">รูปภาพสินค้า</span>
              </div>
            )}
          </div>
        </section>

        <div className="space-y-5">
          {/*
            TODO: backend ยังไม่มี concept "variants" (ขนาด/ตัวเลือกคนละราคา)
            ทั้งในตาราง products และ cart_items เลย จึงตัดฟีเจอร์เลือกขนาดออกไปก่อน
          */}
          <ProductInfoCard
            product={product}
            variants={[]}
            selectedVariant={null}
            onVariantChange={() => {}}
            quantity={quantity}
            onDecrease={() => setQuantity((value) => Math.max(1, value - 1))}
            onIncrease={() => setQuantity((value) => value + 1)}
          />
          <ProductDescription product={product} />
          <ProductReviews product={product} />
        </div>
      </main>

      <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.10)]">
        {addError && <p className="m-0 mb-2 text-center text-xs text-red-500">{addError}</p>}
        <div className="flex items-center gap-2">
          <FavoriteButton product={product} className="size-12 shrink-0 border border-gray-200 bg-white text-lg" />
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 text-sm font-bold text-white shadow-sm shadow-orange-500/20 active:scale-[0.99] disabled:opacity-60"
          >
            <i className={`fa-solid ${isAdding ? 'fa-spinner fa-spin' : added ? 'fa-check' : 'fa-cart-plus'}`} />
            {isAdding ? 'กำลังเพิ่ม...' : added ? 'เพิ่มลงตะกร้าแล้ว' : 'ใส่ตะกร้า'}
          </button>
        </div>
      </div>
    </div>
  )
}