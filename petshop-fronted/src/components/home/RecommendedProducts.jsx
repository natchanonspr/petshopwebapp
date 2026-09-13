import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'
import { getProducts } from '../../api/products.js'

const filters = ['แนะนำ', 'ขายดี', 'อาหารลดราคา']

export default function RecommendedProducts() {
  const [filter, setFilter] = useState('แนะนำ')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadProducts = async () => {
      try {
        const data = await getProducts()

        if (active) {
          setProducts(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('load recommended products error:', error)

        if (active) {
          setProducts([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [])

  const filteredProducts = products.filter((product) => {
    if (filter === 'แนะนำ') {
      return true
    }

    if (filter === 'ขายดี') {
      return product.status === 'best_seller'
    }

    if (filter === 'อาหารลดราคา') {
      return product.status === 'sale'
    }

    return true
  })

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="m-0 text-lg font-bold leading-tight text-gray-900">
          สินค้าแนะนำ
        </h2>

        <Link
          to="/products"
          className="text-sm font-medium text-orange-500"
        >
          ดูทั้งหมด
        </Link>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-full border-0 px-5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
              filter === item
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30'
                : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">
          กำลังโหลดสินค้า...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          ไม่พบสินค้า
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-[360px]:gap-3">
          {filteredProducts.map((product) => (
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