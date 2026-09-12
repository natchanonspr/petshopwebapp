import { useState } from 'react'
import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton.jsx'
import { logActivity } from '../../admin/activity.js'

const CART_KEY = 'petshop_cart'

export default function ShopProductCard({ product }) {
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    let savedCart = []

    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
      savedCart = Array.isArray(parsed) ? parsed : []
    } catch {
      savedCart = []
    }

    const existing = savedCart.find((item) => item.id === product.id)
    const nextQty = existing ? (existing.qty || 0) + 1 : 1
    const nextCart = existing
      ? savedCart.map((item) =>
          item.id === product.id ? { ...item, qty: nextQty } : item,
        )
      : [...savedCart, { ...product, qty: 1 }]

    localStorage.setItem(CART_KEY, JSON.stringify(nextCart))
    window.dispatchEvent(new Event('petshop-cart-updated'))
    logActivity('cart', `เพิ่ม ${product.name} ลงตะกร้า`, { productId: product.id, productName: product.name, qty: 1 })

    setAdded(true)
    window.setTimeout(() => setAdded(false), 1000)
  }

  return (
    <article className="relative min-w-0 min-h-[280px] rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton product={product} />
        </div>
        {product.badge && (
        <span className={`absolute left-3 top-3 z-10 rounded-md px-2 py-1 text-[10px] font-bold leading-none text-white ${product.badgeType === 'sale' || product.badge === 'ขายดี' ? 'bg-orange-400' : 'bg-red-500'}`}>
          {product.badge}
        </span>
        )}
        <Link to={`/products/${product.id}`} className="flex h-full flex-col">
        <div className="mb-3 grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-gray-100 text-[40px] text-gray-300">
          {product.image ? <img src={product.image} alt={product.name} className="size-full object-cover" /> : <i className={`fa-solid ${product.icon}`} />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col pr-8">
          <h2 className="m-0 mb-1 line-clamp-2 text-sm font-bold leading-tight text-gray-700">{product.name}</h2>
          <p className="m-0 mb-2 text-[10px] leading-tight text-gray-500">{product.category}</p>
          <div className="mb-2 flex items-center gap-1 text-[11px] text-gray-500">
            <i className="fa-solid fa-star text-[11px] text-amber-400" />
            <span>{product.rating} ({product.reviews})</span>
          </div>
          <div className="mt-auto flex items-end gap-2">
            <strong className="text-base font-bold leading-none text-orange-500">฿{product.price}</strong>
          </div>
        </div>
        </Link>
        <button
          type="button"
        onClick={handleAddToCart}
        aria-label={`เพิ่ม ${product.name} ลงตะกร้า`}
        className="absolute bottom-3 right-3 z-20 grid size-8 place-items-center rounded-full border-0 bg-black text-white shadow-sm active:scale-95"
      >
          <i className={`fa-solid ${added ? 'fa-check' : 'fa-plus'} text-[13px]`} />
        </button>
    </article>
  )
}
