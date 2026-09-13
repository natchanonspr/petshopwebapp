import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'

export default function RecommendedProducts({ products = [] }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="m-0 text-lg font-bold leading-tight text-gray-900">
          สินค้า
        </h2>

        <Link
          to="/products"
          className="text-sm font-medium text-orange-500"
        >
          ดูทั้งหมด
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          ไม่พบสินค้า
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-[360px]:gap-3">
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