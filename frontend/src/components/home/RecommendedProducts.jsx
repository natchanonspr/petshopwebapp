import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'
import { getProducts } from '../../api/products.js'

function unwrapData(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

function normalizeProduct(product) {
  return {
    ...product,
    id: product?.id ?? product?.product_id,
  }
}

export default function RecommendedProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      try {
        const response = await getProducts()

        if (!mounted) return

        const data = unwrapData(response)
          .map(normalizeProduct)
          .slice(0, 6)

        setProducts(data)
      } catch (error) {
        console.error('Load home products error:', error)

        if (mounted) {
          setProducts([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="m-0 text-lg font-bold leading-tight text-gray-900">
          สินค้า
        </h2>

        <Link
          to="/products"
          className="text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          ดูทั้งหมด
        </Link>
      </div>

      {loading ? (
        <div className="grid min-w-0 grid-cols-2 gap-4 max-[360px]:gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="aspect-square w-full animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          ไม่พบสินค้า
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-4 max-[360px]:gap-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </section>
  )
}