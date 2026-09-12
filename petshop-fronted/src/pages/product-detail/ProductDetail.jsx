import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CartBadge from '../../components/cart/CartBadge.jsx'
import ProductDetailHeader from '../../components/product-detail/ProductDetailHeader.jsx'
import ProductInfoCard from '../../components/product-detail/ProductInfoCard.jsx'
import ProductDescription from '../../components/product-detail/ProductDescription.jsx'
import ProductReviews from '../../components/product-detail/ProductReviews.jsx'
import FavoriteButton from '../../components/products/FavoriteButton.jsx'
import { getProductsWithAdminOverrides } from '../../data/products.js'
import { logActivity } from '../../admin/activity.js'

const getProductDetails = (product) => {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const fallbackDescription = `สินค้าคุณภาพสำหรับน้อง ๆ ของคุณ เหมาะสำหรับหมวด${product.category}`
  return {
    ...product,
    displayName: product.displayName || product.name,
    displayCategory: product.subtitle || product.category,
    sold: Number(product.sold ?? product.reviews ?? 0),
    variants,
    defaultSize: product.defaultSize || variants[0]?.label || '',
    description: product.description || fallbackDescription,
    highlights: Array.isArray(product.highlights) && product.highlights.length
      ? product.highlights
      : ['วัตถุดิบคุณภาพ', 'ช่วยดูแลสุขภาพ', 'เหมาะสำหรับสัตว์เลี้ยง'],
  }
}

export default function ProductDetail() {
  const { productId } = useParams()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [products, setProducts] = useState(() => getProductsWithAdminOverrides())

  useEffect(() => {
    const refresh = () => setProducts(getProductsWithAdminOverrides())
    window.addEventListener('petshop-admin-data-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('petshop-admin-data-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const sourceProduct = products.find((item) => String(item.id) === productId) ?? products[0]
  const product = useMemo(() => getProductDetails(sourceProduct), [sourceProduct])
  const [selectedVariantLabel, setSelectedVariantLabel] = useState(product.defaultSize || '')
  const selectedVariant = product.variants.find((item) => item.label === selectedVariantLabel) || product.variants[product.variants.length - 1]
  const selectedPrice = selectedVariant?.price ?? product.price

  useEffect(() => {
    setQuantity(1)
    setAdded(false)
    setSelectedVariantLabel(product.defaultSize || '')
    if (product?.id) logActivity('view_product', `ดูสินค้า ${product.name}`, { productId: product.id, productName: product.name })
  }, [product.id, product.defaultSize, product.name])

  const saveToCart = () => {
    let savedCart = []
    try {
      const parsed = JSON.parse(localStorage.getItem('petshop_cart') || '[]')
      savedCart = Array.isArray(parsed) ? parsed : []
    } catch {
      savedCart = []
    }

    const variantLabel = selectedVariant?.label || ''
    const existing = savedCart.find((item) => item.id === product.id && (item.variantLabel || '') === variantLabel)
    const cartProduct = {
      ...product,
      price: selectedPrice,
      variantLabel,
      detail: variantLabel ? `ขนาด ${variantLabel}` : product.category,
    }
    const nextCart = existing
      ? savedCart.map((item) => item.id === product.id && (item.variantLabel || '') === variantLabel
          ? { ...item, ...cartProduct, qty: (item.qty || 0) + quantity }
          : item)
      : [...savedCart, { ...cartProduct, qty: quantity }]

    localStorage.setItem('petshop_cart', JSON.stringify(nextCart))
    window.dispatchEvent(new Event('petshop-cart-updated'))
    logActivity('cart', `เพิ่ม ${product.name}${variantLabel ? ` (${variantLabel})` : ''} ลงตะกร้า`, {
      productId: product.id,
      productName: product.name,
      variant: variantLabel,
      qty: quantity,
    })
  }

  const handleAddToCart = () => {
    saveToCart()
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
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
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-orange-500" />
            <span className="size-1.5 rounded-full bg-gray-300" />
            <span className="size-1.5 rounded-full bg-gray-300" />
            <span className="size-1.5 rounded-full bg-gray-300" />
          </div>
        </section>

        <div className="space-y-5">
          <ProductInfoCard
            product={{ ...product, price: selectedPrice }}
            variants={product.variants}
            selectedVariant={selectedVariant}
            onVariantChange={(variant) => {
              setSelectedVariantLabel(variant.label)
              setAdded(false)
            }}
            quantity={quantity}
            onDecrease={() => setQuantity((value) => Math.max(1, value - 1))}
            onIncrease={() => setQuantity((value) => value + 1)}
          />
          <ProductDescription product={product} />
          <ProductReviews product={product} />
        </div>
      </main>

      <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.10)]">
        <div className="flex items-center gap-2">
          <FavoriteButton product={product} className="size-12 shrink-0 border border-gray-200 bg-white text-lg" />
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 text-sm font-bold text-white shadow-sm shadow-orange-500/20 active:scale-[0.99]"
          >
            <i className={`fa-solid ${added ? 'fa-check' : 'fa-cart-plus'}`} />
            {added ? 'เพิ่มลงตะกร้าแล้ว' : 'ใส่ตะกร้า'}
          </button>
        </div>
      </div>
    </div>
  )
}
