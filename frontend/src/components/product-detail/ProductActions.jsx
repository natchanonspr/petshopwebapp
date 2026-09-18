export default function ProductActions() {
  return (
    <div className="product-detail-actions">
      <button className="add-to-cart-button">
        <i className="fa-solid fa-cart-shopping" />
        <span>ใส่ตะกร้า</span>
      </button>
      <button className="chat-button" aria-label="ติดต่อร้านค้า">
        <i className="fa-regular fa-comment" />
      </button>
    </div>
  )
}
