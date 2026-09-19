
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import FavoriteButton from '../products/FavoriteButton.jsx'
import { addToCart } from '../../api/cart.js'
import { addNotification } from '../../lib/notifications.js'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (isAdding) return

    try {
      setIsAdding(true)

      await addToCart({
        productId: product.id,
        cartQuantity: 1,
      })

      window.dispatchEvent(new Event('petshop-cart-updated'))


      setAdded(true)

      window.setTimeout(() => {
        setAdded(false)
      }, 700)
    } catch (error) {
      console.error('Add to cart error:', error)

      // ถ้าเพิ่มสินค้าไม่ได้ เช่น ยังไม่ได้ Login
      // หรือ API error ให้ไปหน้ารายละเอียดสินค้า
      navigate(`/products/${product.id}`)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="relative min-h-0 min-w-0 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">

      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton product={product} />
      </div>

      {product.badge && (
        <span
          className={`absolute left-3 top-3 z-10 rounded-md px-2 py-1 text-[10px] font-bold leading-none text-white ${
            product.badge === '-20%'
              ? 'bg-orange-400'
              : 'bg-red-500'
          }`}
        >
          {product.badge}
        </span>
      )}

      <Link
        to={`/products/${product.id}`}
        className="flex min-h-full flex-col"
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

          <h3 className="m-0 mb-1 text-sm font-bold leading-tight text-gray-700">
            {product.name}
          </h3>

          <p className="m-0 mb-2 text-[10px] leading-tight text-gray-500">
            {product.subtitle}
          </p>

          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through">
              ฿{product.oldPrice}
            </span>
          )}

          <div className="mt-auto pr-10 pt-1">
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
        className={`absolute bottom-3 right-3 z-20 grid size-8 place-items-center rounded-full border-0 text-white shadow-sm transition ${
          added
            ? 'scale-105 bg-green-500'
            : isAdding
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-black active:scale-90'
        }`}
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
