import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import NotificationBadge from '../profile/NotificationBadge.jsx'
import CartBadge from '../cart/CartBadge.jsx'
import { getProductSearchSuggestions } from '../../lib/fuzzySearch.js'
import { getProductsWithAdminOverrides } from '../../data/products.js'

export default function HomeHeader() {
  const products = getProductsWithAdminOverrides()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [profile, setProfile] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('petshop_profile') || '{}')
      return saved && typeof saved === 'object' ? saved : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    const refreshProfile = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('petshop_profile') || '{}')
        setProfile(saved && typeof saved === 'object' ? saved : {})
      } catch {
        setProfile({})
      }
    }
    window.addEventListener('petshop-profile-updated', refreshProfile)
    window.addEventListener('storage', refreshProfile)
    return () => {
      window.removeEventListener('petshop-profile-updated', refreshProfile)
      window.removeEventListener('storage', refreshProfile)
    }
  }, [])

  const suggestions = getProductSearchSuggestions(products, search, 3)

  const handleSearch = (event) => {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
  }

  return (
    <header className="z-10 shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-4 pt-3 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/profile" aria-label="ไปหน้าบัญชี" title="บัญชีของฉัน" className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gray-200 text-lg text-gray-400 transition active:scale-90">
            {profile.avatar ? (
              <img src={profile.avatar} alt="รูปโปรไฟล์" className="size-full object-cover" />
            ) : (
              <i className="fa-solid fa-user" />
            )}
          </Link>
          <div>
            <p className="m-0 text-sm font-medium leading-none text-gray-500">สวัสดี</p>
            <h1 className="m-0 mt-1 text-xl font-bold leading-tight text-gray-900">{profile.name || 'กระเทียม เจียว'}</h1>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link to="/notifications" aria-label="การแจ้งเตือน" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full border-0 bg-gray-100 text-gray-500 transition active:scale-90">
            <NotificationBadge>
              <i className="fa-solid fa-bell" />
            </NotificationBadge>
          </Link>
          <Link to="/cart" aria-label="ตะกร้าสินค้า" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500">
            <CartBadge>
              <i className="fa-solid fa-cart-shopping" />
            </CartBadge>
          </Link>
        </div>
      </div>
      <form onSubmit={handleSearch} className="relative block">
        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาสินค้า, แบรนด์, หรืออื่นๆ..." aria-label="ค้นหาสินค้า" autoComplete="off" className="block h-[46px] w-full rounded-2xl border-0 bg-gray-100 pl-10 pr-10 text-sm text-gray-700 outline-none placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-orange-200" />
        {search && (
          <button type="button" onClick={() => setSearch('')} aria-label="ล้างการค้นหา" className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-gray-200 text-gray-500 transition hover:bg-gray-300 active:scale-95">
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        )}
        
        {search.trim() && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[54px] z-50 ovegit rflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-900/10">
            <p className="px-4 pb-1 pt-3 text-xs font-semibold text-gray-400">สินค้าที่ใกล้เคียง</p>
            {suggestions.map((product) => (
              <button key={product.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearch(product.name); navigate(`/products?search=${encodeURIComponent(product.name)}`) }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-orange-50 active:bg-gray-100">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-500"><i className={`fa-solid ${product.icon || 'fa-paw'}`} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-800">{product.name}</span>
                  <span className="block text-xs text-gray-400">{product.category || 'สินค้า'}</span>
                </span>
                <i className="fa-solid fa-chevron-right text-xs text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </form>
    </header>
  )
}
