import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductsHeader from '../../components/products/ProductsHeader.jsx'
import ShopProductCard from '../../components/products/ShopProductCard.jsx'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import { getProductsWithAdminOverrides } from '../../data/products.js'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { fuzzyFilterProducts } from '../../lib/fuzzySearch.js'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState('ทั้งหมด')
  const [hasError, setHasError] = useState(false)
  const [products, setProducts] = useState(() => getProductsWithAdminOverrides())
  const searchQuery = searchParams.get('search') || ''

  useEffect(() => {
    if (searchQuery) setCategory('ทั้งหมด')
  }, [searchQuery])

  useEffect(() => {
    const refresh = () => setProducts(getProductsWithAdminOverrides())
    window.addEventListener('petshop-admin-data-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('petshop-admin-data-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const categoryProducts = products.filter((product) => category === 'ทั้งหมด' || product.category === category)
    return fuzzyFilterProducts(categoryProducts, searchQuery)
  }, [category, searchQuery, products])

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <ProductsHeader
        category={category}
        search={searchQuery}
        products={products}
        onSearchChange={(value) => {
          const next = new URLSearchParams(searchParams)
          if (value.trim()) next.set('search', value)
          else next.delete('search')
          setSearchParams(next, { replace: true })
        }}
        onCategoryChange={setCategory}
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="m-0 text-lg font-bold leading-tight text-gray-900">{searchQuery ? `ผลการค้นหา “${searchQuery}”` : 'สินค้าทั้งหมด'}</h2>
          <span className="text-sm text-gray-400">{filteredProducts.length} รายการ</span>
        </div>
        {hasError ? (
          <ErrorState onRetry={() => setHasError(false)} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="fa-magnifying-glass"
            title={searchQuery ? `ไม่พบสินค้า “${searchQuery}”` : 'ยังไม่มีสินค้าในหมวดนี้'}
            description={searchQuery ? 'ลองใช้คำค้นอื่น หรือเลือกดูสินค้าทั้งหมด' : 'ลองเลือกหมวดอื่นเพื่อดูสินค้าเพิ่มเติม'}
            actionLabel={searchQuery ? 'ล้างการค้นหา' : 'ดูสินค้าทั้งหมด'}
            onAction={() => {
              setCategory('ทั้งหมด')
              clearSearch()
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 max-[360px]:gap-3">
            {filteredProducts.map((product) => (
              <ShopProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <div className="h-4" />
      </main>
      <BottomNavigation />
    </div>
  )
}
