import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CartBadge from '../cart/CartBadge.jsx'
import NotificationBadge from '../profile/NotificationBadge.jsx'
import { getProductSearchSuggestions } from '../../lib/fuzzySearch.js'
import { getCategories } from '../../api/categories.js'

export default function ProductsHeader({
  category = 'all',
  search = '',
  products = [],
  onSearchChange,
  onCategoryChange,
}) {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(category)

  const tabsRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  // โหลดหมวดหมู่สินค้า
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories()

        // รองรับทั้งกรณี API คืน array โดยตรง
        // และกรณีคืน { data: [...] }
        const categoryData = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : []

        setCategories(categoryData)
      } catch (error) {
        console.error('ไม่สามารถโหลดหมวดหมู่สินค้าได้:', error)
        setCategories([])
      }
    }

    loadCategories()
  }, [])

  // ถ้า parent เปลี่ยน category ให้เปลี่ยนตาม
  useEffect(() => {
    setSelectedCategory(category)
  }, [category])

  const suggestions = getProductSearchSuggestions(
    products,
    search,
    3
  )

  // -----------------------------
  // Category
  // -----------------------------

  const handleCategoryChange = (value) => {
    setSelectedCategory(value)
    onCategoryChange?.(value)
  }

  // -----------------------------
  // Drag Category Tabs
  // -----------------------------

  const handleTabsMouseDown = (event) => {
    const container = tabsRef.current

    if (!container) return

    isDragging.current = true
    startX.current = event.pageX - container.offsetLeft
    scrollLeft.current = container.scrollLeft

    container.classList.remove('cursor-grab')
    container.classList.add('cursor-grabbing')
  }

  const handleTabsMouseMove = (event) => {
    const container = tabsRef.current

    if (!container || !isDragging.current) return

    event.preventDefault()

    const x = event.pageX - container.offsetLeft
    const walk = (x - startX.current) * 1.5

    container.scrollLeft = scrollLeft.current - walk
  }

  const stopTabsDragging = () => {
    const container = tabsRef.current

    isDragging.current = false

    if (container) {
      container.classList.remove('cursor-grabbing')
      container.classList.add('cursor-grab')
    }
  }

  return (
    <header className="z-10 min-w-0 shrink-0 overflow-hidden rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-3 pt-3 shadow-md">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">

        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            aria-label="กลับหน้าหลัก"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left" />
          </Link>

          <div>
            <h1 className="m-0 mt-1 text-xl font-bold leading-tight text-gray-900">
              ร้านค้า
            </h1>
          </div>
        </div>

        {/* Notification + Cart */}
        <div className="flex items-center gap-2">

          <Link
            to="/notifications"
            aria-label="การแจ้งเตือน"
            className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-95"
          >
            <NotificationBadge>
              <i className="fa-solid fa-bell" />
            </NotificationBadge>
          </Link>

          <Link
            to="/cart"
            aria-label="ตะกร้าสินค้า"
            className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-95"
          >
            <CartBadge>
              <i className="fa-solid fa-cart-shopping" />
            </CartBadge>
          </Link>

        </div>
      </div>

      {/* Search */}
      <label className="relative block">

        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            onSearchChange?.(event.target.value)
          }
          placeholder="ค้นหาสินค้า, แบรนด์, หรืออื่นๆ..."
          aria-label="ค้นหาสินค้า"
          className="block h-[46px] w-full rounded-2xl border-0 bg-gray-100 pl-10 pr-10 text-sm text-gray-700 outline-none placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-orange-200"
        />

        {search && (
          <button
            type="button"
            onClick={() => onSearchChange?.('')}
            aria-label="ล้างการค้นหา"
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-gray-200 text-gray-500 transition hover:bg-gray-300 active:scale-95"
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        )}

      </label>

      {/* Search Suggestions */}
      {search.trim() && suggestions.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">

          <p className="px-4 pb-1 pt-3 text-xs font-semibold text-gray-400">
            สินค้าที่ใกล้เคียง
          </p>

          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() =>
                onSearchChange?.(product.name)
              }
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 active:bg-gray-100"
            >

              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-500">
                <i
                  className={`fa-solid ${
                    product.icon || 'fa-paw'
                  }`}
                />
              </span>

              <span className="min-w-0 flex-1">

                <span className="block truncate text-sm font-semibold text-gray-800">
                  {product.name}
                </span>

                <span className="block text-xs text-gray-400">
                  {product.category || 'สินค้า'}
                </span>

              </span>

              <i className="fa-solid fa-arrow-up-right-from-square text-xs text-gray-300" />

            </button>
          ))}

        </div>
      )}

      {/* Categories */}
      <div
        ref={tabsRef}
        onMouseDown={handleTabsMouseDown}
        onMouseMove={handleTabsMouseMove}
        onMouseUp={stopTabsDragging}
        onMouseLeave={stopTabsDragging}
        className="mt-4 flex cursor-grab gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >

        {/* All */}
        <button
          type="button"
          onClick={() => handleCategoryChange('all')}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
            selectedCategory === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          สินค้าทั้งหมด
        </button>

        {/* Categories */}
        {[...categories].sort((a, b) =>
          Number(a.category_id) - Number(b.category_id)
          ).
          map((categoryItem) => (
        <button
        key={categoryItem.category_id}
        type="button"
        onClick={() =>
        handleCategoryChange(categoryItem.category_id)
      }
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              String(selectedCategory) ===
              String(categoryItem.category_id)
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {categoryItem.category_name}
          </button>
        ))}

      </div>

    </header>
  )
}