import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductsHeader from '../../components/products/ProductsHeader.jsx'
import ShopProductCard from '../../components/products/ShopProductCard.jsx'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { fuzzyFilterProducts } from '../../lib/fuzzySearch.js'
import { getProducts } from '../../api/products.js'
import { getCategories } from '../../api/categories.js'
import { addToCart } from '../../api/cart.js'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [hasError, setHasError] = useState(false)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cartError, setCartError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // ค่าค้นหาจาก URL
  const searchQuery = searchParams.get('search') || ''

  // สำหรับลากหมวดหมู่ซ้าย-ขวา
  const tabsRef = useRef(null)
  const isDraggingTabs = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)

  // โหลดสินค้าและหมวดหมู่
  useEffect(() => {
    const loadData = async () => {
      try {
        setHasError(false)

        const [productData, categoryData] = await Promise.all([
          getProducts(),
          getCategories(),
        ])

        setProducts(
          Array.isArray(productData)
            ? productData
            : Array.isArray(productData?.data)
              ? productData.data
              : []
        )

        setCategories(
          Array.isArray(categoryData)
            ? categoryData
            : Array.isArray(categoryData?.data)
              ? categoryData.data
              : []
        )
      } catch (error) {
        console.error('Load products/categories error:', error)
        setHasError(true)
      }
    }

    loadData()
  }, [])

  // กรองสินค้า
  const filteredProducts = useMemo(() => {
  let result = products

  if (selectedCategory !== 'all') {
    result = result.filter(
      (product) =>
        String(product.categoryId) === String(selectedCategory)
    )
  }

  return fuzzyFilterProducts(result, searchQuery)
}, [products, searchQuery, selectedCategory])

  // ล้างการค้นหา
  const clearSearch = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    setSearchParams(next, { replace: true })
  }

  // เปลี่ยนหมวดหมู่
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
  }

  // เพิ่มสินค้าลงตะกร้า
  const handleAddToCart = async (product) => {
    try {
      setCartError('')

      await addToCart({
        productId: product.id,
        cartQuantity: 1,
      })

      window.dispatchEvent(new Event('petshop-cart-updated'))
    } catch (error) {
      console.error('Add to cart error:', error)

      setCartError(
        error.message || 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้'
      )

      throw error
    }
  }

  // เริ่มลากหมวดหมู่
  const handleTabsMouseDown = (event) => {
    const element = tabsRef.current

    if (!element) return

    isDraggingTabs.current = true
    startX.current = event.pageX - element.offsetLeft
    startScrollLeft.current = element.scrollLeft

    element.classList.add('cursor-grabbing')
  }

  // ลากหมวดหมู่
  const handleTabsMouseMove = (event) => {
    if (!isDraggingTabs.current) return

    const element = tabsRef.current

    if (!element) return

    event.preventDefault()

    const x = event.pageX - element.offsetLeft
    const distance = x - startX.current

    element.scrollLeft = startScrollLeft.current - distance
  }

  // หยุดลาก
  const stopTabsDragging = () => {
    const element = tabsRef.current

    isDraggingTabs.current = false

    if (element) {
      element.classList.remove('cursor-grabbing')
    }
  }

  // ชื่อหมวดหมู่ที่เลือก
  const selectedCategoryName =
    selectedCategory === 'all'
      ? 'สินค้าทั้งหมด'
      : categories.find(
          (category) =>
            String(category.category_id) ===
            String(selectedCategory)
        )?.category_name || 'สินค้าทั้งหมด'

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">

      <ProductsHeader
        category={selectedCategory}
        search={searchQuery}
        products={products}
        onSearchChange={(value) => {
          const next = new URLSearchParams(searchParams)

          if (value.trim()) {
            next.set('search', value)
          } else {
            next.delete('search')
          }

          setSearchParams(next, { replace: true })
        }}
        onCategoryChange={handleCategoryChange}
      />

      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        <div className="mb-4 flex items-end justify-between">
          <h2 className="m-0 text-lg font-bold leading-tight text-gray-900">
            {searchQuery
              ? `ผลการค้นหา "${searchQuery}"`
              : selectedCategoryName}
          </h2>

          <span className="text-sm text-gray-400">
            {filteredProducts.length} รายการ
          </span>
        </div>

        {cartError && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {cartError}
          </div>
        )}

        {hasError ? (
          <ErrorState
            onRetry={() => {
              setHasError(false)
              window.location.reload()
            }}
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="fa-magnifying-glass"
            title={
              searchQuery
                ? `ไม่พบสินค้า "${searchQuery}"`
                : selectedCategory === 'all'
                  ? 'ยังไม่มีสินค้า'
                  : `ยังไม่มีสินค้าในหมวด ${selectedCategoryName}`
            }
            description={searchQuery ? 'ลองใช้คำค้นอื่น' : ''}
            actionLabel={searchQuery ? 'ล้างการค้นหา' : undefined}
            onAction={searchQuery ? clearSearch : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 max-[360px]:gap-3">
            {filteredProducts.map((product) => (
              <ShopProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        <div className="h-4" />
      </main>

      <BottomNavigation />
    </div>
  )
}