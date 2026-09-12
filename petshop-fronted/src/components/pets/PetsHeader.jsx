import { Link } from 'react-router-dom'
import NotificationBadge from '../profile/NotificationBadge.jsx'
import CartBadge from '../cart/CartBadge.jsx'

export default function PetsHeader() {
  return (
    <header className="z-10 shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-4 pt-3 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/home" aria-label="กลับหน้าหลัก" className="grid size-12 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-95">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <h1 className="m-0 truncate text-xl font-bold leading-tight text-gray-900">สัตว์เลี้ยงของคุณ</h1>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link to="/notifications" aria-label="การแจ้งเตือน" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-90">
            <NotificationBadge>
              <i className="fa-regular fa-bell" />
            </NotificationBadge>
          </Link>
          <Link to="/cart" aria-label="ตะกร้าสินค้า" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500">
            <CartBadge>
              <i className="fa-solid fa-cart-shopping" />
            </CartBadge>
          </Link>
        </div>
      </div>
    </header>
  )
}
