import { Navigate, useLocation } from 'react-router-dom'

function getTokenPayload(token) {
  try {
    const payload = token.split('.')[1]

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(
          (char) =>
            `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`
        )
        .join('')
    )

    return JSON.parse(json)
  } catch {
    return null
  }
}

export default function AdminRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('petshop_token')

  // ยังไม่ได้ Login
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // Token ไม่ถูกต้อง
  const payload = getTokenPayload(token)

  if (!payload) {
    localStorage.removeItem('petshop_token')

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // Login แล้วแต่ไม่ใช่ Admin
  if (payload.role !== 'admin') {
    return <Navigate to="/home" replace />
  }

  // เป็น Admin
  return children
}