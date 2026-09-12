import { useEffect, useState } from 'react'

export const FAVORITES_KEY = 'petshop_favorites'
export const FAVORITES_UPDATED_EVENT = 'petshop-favorites-updated'

function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function isFavorite(productId) {
  return readFavorites().some((item) => String(item.id) === String(productId))
}

export function toggleFavorite(product) {
  const favorites = readFavorites()
  const exists = favorites.some((item) => String(item.id) === String(product.id))
  const next = exists
    ? favorites.filter((item) => String(item.id) !== String(product.id))
    : [...favorites, { ...product }]
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT))
  return !exists
}

export default function FavoriteButton({ product, className = '' }) {
  const [favorite, setFavorite] = useState(() => isFavorite(product.id))

  useEffect(() => {
    const sync = () => setFavorite(isFavorite(product.id))
    window.addEventListener(FAVORITES_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [product.id])

  const handleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setFavorite(toggleFavorite(product))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorite ? `นำ ${product.name} ออกจากรายการโปรด` : `เพิ่ม ${product.name} ในรายการโปรด`}
      aria-pressed={favorite}
      className={`grid size-9 place-items-center rounded-full bg-white/95 shadow-sm transition-all duration-200 active:scale-90 ${favorite ? 'text-red-500' : 'text-gray-400 hover:text-red-400'} ${className}`}
    >
      <i className={`fa-${favorite ? 'solid' : 'regular'} fa-heart text-[16px] transition-transform duration-200 ${favorite ? 'scale-110' : ''}`} />
    </button>
  )
}
