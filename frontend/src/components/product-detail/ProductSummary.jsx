import { useState } from 'react'

export default function ProductSummary() {
  const [quantity, setQuantity] = useState(1)

  return (
    <section className="product-detail-card product-detail-summary">
      <div>
        <h2>Royal Canin Adult 3kg</h2>
        <p className="product-detail-category">อาหารสุนัข</p>
      </div>

      <div className="product-detail-rating">
        <span className="stars" aria-label="5 ดาว">★★★★★</span>
        <strong>4.8</strong>
        <span>• 234 รีวิว</span>
      </div>

      <div className="product-detail-summary-bottom">
        <strong className="product-detail-price">฿890</strong>
        <div className="quantity-control">
          <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="ลดจำนวน">−</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity((value) => value + 1)} aria-label="เพิ่มจำนวน">+</button>
        </div>
      </div>
    </section>
  )
}
