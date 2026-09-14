import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductsHeader from '../../components/products/ProductsHeader.jsx'
import ShopProductCard from '../../components/products/ShopProductCard.jsx'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { fuzzyFilterProducts } from '../../lib/fuzzySearch.js'
import { getProducts } from '../../api/products.js'
import { addToCart } from '../../api/cart.js'
import { addNotification } from '../../lib/notifications.js'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [hasError, setHasError] = useState(false)
  const [products, setProducts] = useState([])
  const [cartError, setCartError] = useState('')
  const searchQuery = searchParams.get('search') || ''

  // TODO: ไม่มี category filter แล้ว รอ backend มี internal/category ก่อนค่อยเพิ่มกลับ

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setHasError(true))
  }, [])

  const filteredProducts = useMemo(() => {
    return fuzzyFilterProducts(products, searchQuery)
  }, [searchQuery, products])

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    setSearchParams(next, { replace: true })
  }

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
      setCartError(error.message || 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้')
      throw error
    }
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">

      <ProductsHeader
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
      />

      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        <div className="mb-4 flex items-end justify-between">
          <h2 className="m-0 text-lg font-bold leading-tight text-gray-900">
            {searchQuery
              ? `ผลการค้นหา "${searchQuery}"`
              : 'สินค้าทั้งหมด'}
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
          <ErrorState onRetry={() => setHasError(false)} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="fa-magnifying-glass"
            title={
              searchQuery
                ? `ไม่พบสินค้า "${searchQuery}"`
                : 'ยังไม่มีสินค้า'
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
