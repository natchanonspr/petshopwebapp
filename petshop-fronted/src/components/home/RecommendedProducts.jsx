import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'

const filters = ['แนะนำ', 'ขายดี', 'อาหารลดราคา']

export default function RecommendedProducts({ products = [] }) {
  const [filter, setFilter] = useState('แนะนำ')

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
            className={`shrink-0 rounded-full border-0 px-5 py-2 text-sm font-medium whitespace-nowrap ${
              filter === item
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
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