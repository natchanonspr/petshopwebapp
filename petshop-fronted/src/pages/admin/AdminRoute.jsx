import { Navigate, useLocation } from 'react-router-dom'
export default function AdminRoute({ children }) {
  const location = useLocation()
  const loggedIn = localStorage.getItem('petshop_admin_auth') === 'true'
  return loggedIn ? children : <Navigate to="/home/admin/login" replace state={{ from: location.pathname }} />
}
