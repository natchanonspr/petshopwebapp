import { Link } from 'react-router-dom'

export default function OrdersHeader() {
  return <header className="simple-page-header"><Link to="/home" className="simple-page-back">กลับ</Link><h1>ประวัติ</h1><span className="simple-page-icon"><i className="fa-solid fa-receipt" /></span></header>
}
