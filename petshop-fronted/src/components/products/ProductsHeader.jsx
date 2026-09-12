import { Link } from 'react-router-dom'
import CartBadge from '../cart/CartBadge.jsx'
import NotificationBadge from '../profile/NotificationBadge.jsx'
import { getProductSearchSuggestions } from '../../lib/fuzzySearch.js'

const categories = [
  'ทั้งหมด',
  'อาหารสุนัข',
  'อาหารแมว',
  'ขนมแมว',
  'ขนมสุนัข',
  'ทรายแมว',
  'ของเล่น',
  'อุปกรณ์',
  'สุขภาพ',
  'ของใช้',
]

export default function ProductsHeader({ category = 'ทั้งหมด', search = '', products = [], onSearchChange, onCategoryChange }) {
  const suggestions = getProductSearchSuggestions(products, search, 3)
  return (
    <header className="z-10 min-w-0 shrink-0 overflow-hidden rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-3 pt-3 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/home" aria-label="กลับหน้าหลัก" className="grid size-12 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div>
            <h1 className="m-0 mt-1 text-xl font-bold leading-tight text-gray-900">ร้านค้า</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/notifications" aria-label="การแจ้งเตือน" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95">
            <NotificationBadge><i className="fa-solid fa-bell" /></NotificationBadge>
          </Link>
          <Link to="/cart" aria-label="ตะกร้าสินค้า" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95">
            <CartBadge><i className="fa-solid fa-cart-shopping" /></CartBadge>
          </Link>
        </div>
      </div>

      <label className="relative block">
        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="ค้นหาสินค้า, แบรนด์, หรืออื่นๆ..."
          aria-label="ค้นหาสินค้า"
          className="block h-[46px] w-full rounded-2xl border-0 bg-gray-100 pl-10 pr-10 text-sm text-gray-700 outline-none placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-orange-200"
        />
        {search && (
          <button type="button" onClick={() => onSearchChange?.('')} aria-label="ล้างการค้นหา" className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-gray-200 text-gray-500 transition hover:bg-gray-300 active:scale-95">
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        )}
      </label>
      {search.trim() && suggestions.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
          <p className="px-4 pb-1 pt-3 text-xs font-semibold text-gray-400">สินค้าที่ใกล้เคียง</p>
          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSearchChange?.(product.name)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-500"><i className={`fa-solid ${product.icon || 'fa-paw'}`} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-800">{product.name}</span>
                <span className="block text-xs text-gray-400">{product.category || 'สินค้า'}</span>
              </span>
              <i className="fa-solid fa-arrow-up-right-from-square text-xs text-gray-300" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange?.(item)}
            className={`shrink-0 rounded-full border-0 px-5 py-2 text-sm font-medium whitespace-nowrap transition active:scale-95 ${category === item ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'bg-gray-100 text-gray-500'}`}
          >
            {item}
          </button>
        ))}
      </div>
    </header>
  )
}
