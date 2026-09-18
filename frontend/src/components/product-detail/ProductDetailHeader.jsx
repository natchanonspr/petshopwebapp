import { Link } from 'react-router-dom'
import CartBadge from '../cart/CartBadge.jsx'

export default function ProductDetailHeader() {
  return (
    <header className="z-20 shrink-0 rounded-b-[28px] bg-white px-5 pb-4 pt-3 shadow-[0_3px_8px_rgba(0,0,0,0.12)]">
      <div className="relative flex h-12 items-center justify-center">
        <Link
          to="/products"
          aria-label="กลับไปร้านค้า"
          className="absolute left-0 grid size-10 place-items-center rounded-full bg-gray-100 text-gray-700 transition active:scale-90"
        >
          <i className="fa-solid fa-arrow-left text-[15px]" />
        </Link>

        <h1 className="m-0 text-[19px] font-bold text-gray-900">รายละเอียดสินค้า</h1>

        <Link
          to="/cart"
          aria-label="ตะกร้าสินค้า"
          className="absolute right-0 grid size-10 place-items-center rounded-full bg-gray-100 text-gray-700 transition active:scale-90"
        >
          <CartBadge>
            <i className="fa-solid fa-cart-shopping text-[16px]" />
          </CartBadge>
        </Link>
      </div>
    </header>
  )
}
