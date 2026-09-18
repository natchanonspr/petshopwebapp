import { useEffect, useState } from 'react'
import HomeHeader from './HomeHeader.jsx'
import RecommendedProducts from './RecommendedProducts.jsx'
import { getProducts } from '../../api/products.js'

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts()
        setProducts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('load home products error:', error)
        setProducts([])
      }
    }

    loadProducts()
  }, [])

  return (
    <>
      <HomeHeader products={products} />
      <RecommendedProducts products={products} />
    </>
  )
}