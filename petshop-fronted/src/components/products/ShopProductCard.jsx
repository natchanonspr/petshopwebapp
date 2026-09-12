import { useState } from 'react'
import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton.jsx'
import { logActivity } from '../../admin/activity.js'

export default function ShopProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async (event) => {
    // ป้องกันการกดปุ่มแล้ว Link ด้านหลังทำงาน
    event.stopPropagation()
    event.preventDefault()

    if (isAdding) return

    try {
      setIsAdding(true)

      await onAddToCart(product)

      logActivity(
        'cart',
        `เพิ่ม ${product.name} ลงตะกร้า`,
        {
          productId: product.id,
          productName: product.name,
          qty: 1,
        },
      )

      setAdded(true)

      window.setTimeout(() => {
        setAdded(false)
      }, 1000)
    } catch (error) {
      console.error('Add to cart error:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="relative min-h-[280px] min-w-0 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">

      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton product={product} />
      </div>

      <Link
        to={`/products/${product.id}`}
        className="flex h-full flex-col"
      >
        <div className="mb-3 grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-gray-100 text-[40px] text-gray-300">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="size-full object-cover"
            />
          ) : (
            <i className={`fa-solid ${product.icon}`} />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col pr-8">
          <h2 className="m-0 mb-1 line-clamp-2 text-sm font-bold leading-tight text-gray-700">
            {product.name}
          </h2>

          <div className="mt-auto flex items-end gap-2">
            <strong className="text-base font-bold leading-none text-orange-500">
              ฿{product.price}
            </strong>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAdding}
        aria-label={`เพิ่ม ${product.name} ลงตะกร้า`}
        className="absolute bottom-3 right-3 z-20 grid size-8 place-items-center rounded-full border-0 bg-black text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <i
          className={`fa-solid ${
            isAdding
              ? 'fa-spinner fa-spin'
              : added
                ? 'fa-check'
                : 'fa-plus'
          } text-[13px]`}
        />
      </button>

    </article>
  )
}

