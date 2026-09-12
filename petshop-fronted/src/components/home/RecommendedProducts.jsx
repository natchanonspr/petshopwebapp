import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'
import { products as catalogProducts } from '../../data/products.js'

const filters = ['แนะนำ', 'ขายดี', 'อาหารลดราคา']
const products = catalogProducts.map((product) => ({
  ...product,
  subtitle: product.subtitle || product.category,
  tags: product.tags || (product.badge === 'ขายดี' ? ['ขายดี'] : product.badgeType === 'sale' ? ['อาหารลดราคา'] : ['แนะนำ']),
  oldPrice: product.oldPrice,
}))

export default function RecommendedProducts() {
  const [filter, setFilter] = useState('แนะนำ')

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="m-0 text-lg font-bold leading-tight text-gray-900">สินค้าแนะนำ</h2>
        <Link to="/products" className="text-sm font-medium text-orange-500">ดูทั้งหมด</Link>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full border-0 px-5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${filter === item ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 max-[360px]:gap-3">
        {products
          .filter((product) => filter === 'แนะนำ' || product.tags?.includes(filter))
          .map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  )
}
