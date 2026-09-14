import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth.js'

export default function AdminLogin() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const nav = useNavigate()
  const loc = useLocation()

  const submit = async (e) => {
    e.preventDefault()

    try {
      setError('')
      setLoading(true)

      const token = await login({
        userPhone: phone,
        userPassword: password,
      })

      localStorage.setItem('petshop_token', token)

      nav(
        loc.state?.from?.pathname || '/home/admin',
        { replace: true }
      )
    } catch (error) {
      console.error('Admin login error:', error)
      setError(error?.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#f8f9fc] p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-xl"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-100 text-violet-600">
          <i className="fa-solid fa-paw text-xl" />
        </div>

        <h1 className="mt-4 text-center text-2xl font-extrabold">
          Pet Shop Admin
        </h1>

        <p className="mt-1 text-center text-sm text-gray-400">
          เข้าสู่ระบบผู้ดูแลระบบ
        </p>

        <div className="mt-6 space-y-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-violet-400"
            placeholder="เบอร์โทรศัพท์"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-violet-400"
            placeholder="รหัสผ่าน"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="mt-5 h-11 w-full rounded-xl bg-violet-600 font-bold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  )
}