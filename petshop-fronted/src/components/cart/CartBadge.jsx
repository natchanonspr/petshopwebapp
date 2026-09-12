import { useEffect, useState } from 'react'

const CART_KEY = 'petshop_cart'

function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    if (!Array.isArray(cart)) return 0
    return cart.reduce((total, item) => total + Math.max(0, Number(item.qty) || 0), 0)
  } catch {
    return 0
  }
}

export default function CartBadge({ children }) {
  const [count, setCount] = useState(getCartCount)
  const [bouncing, setBouncing] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setCount(getCartCount())
      setBouncing(true)
      window.setTimeout(() => setBouncing(false), 550)
    }

    const handleStorage = (event) => {
      if (event.key === CART_KEY) refresh()
    }

    window.addEventListener('petshop-cart-updated', refresh)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('petshop-cart-updated', refresh)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return (
    <span className="relative inline-grid place-items-center">
      {children}
      {count > 0 && (
        <span
          key={`${count}-${bouncing}`}
          className={`absolute -right-3.5 -top-3.5 z-30 grid min-w-[17px] h-[17px] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white ${bouncing ? 'animate-cart-badge-bounce' : ''}`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  )
}
