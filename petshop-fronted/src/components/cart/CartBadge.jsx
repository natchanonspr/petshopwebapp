import { useEffect, useState } from 'react'
import { getCart } from '../../api/cart.js'

export default function CartBadge({ children }) {
  const [count, setCount] = useState(0)
  const [bouncing, setBouncing] = useState(false)

  useEffect(() => {
    let active = true
    let timeoutId = null

    const loadCartCount = async (shouldBounce = false) => {
      try {
        const cart = await getCart()

        if (!active) return

        const total = Array.isArray(cart)
          ? cart.reduce(
              (sum, item) =>
                sum + Math.max(
                  0,
                  Number(item.cart_quantity) || 0
                ),
              0
            )
          : 0

        setCount(total)

        if (shouldBounce) {
          setBouncing(true)

          if (timeoutId) {
            window.clearTimeout(timeoutId)
          }

          timeoutId = window.setTimeout(() => {
            if (active) {
              setBouncing(false)
            }
          }, 550)
        }
      } catch (error) {
        console.error('load cart count error:', error)

        if (active) {
          setCount(0)
        }
      }
    }

    // โหลดจำนวน Cart ตอนเปิด component
    loadCartCount()

    // อัปเดตเมื่อมีการเปลี่ยน Cart
    const refresh = () => {
      loadCartCount(true)
    }

    window.addEventListener('petshop-cart-updated', refresh)

    return () => {
      active = false

      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }

      window.removeEventListener('petshop-cart-updated', refresh)
    }
  }, [])

  return (
    <span className="relative inline-grid place-items-center">
      {children}

      {count > 0 && (
        <span
          className={`absolute -right-3.5 -top-3.5 z-30 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white ${
            bouncing ? 'animate-cart-badge-bounce' : ''
          }`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  )
}