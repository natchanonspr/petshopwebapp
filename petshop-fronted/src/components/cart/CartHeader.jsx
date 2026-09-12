import { Link } from 'react-router-dom'

export default function CartHeader() {
  return <header className="simple-page-header"><Link to="/products" className="simple-page-back">กลับ</Link><h1>ตะกร้า</h1><span className="simple-page-icon"><i className="fa-solid fa-cart-shopping" /></span></header>
}
