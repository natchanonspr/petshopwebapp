import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import liff from '@line/liff'

import { login, loginWithLine } from '../../api/auth.js'
import BoxLoader from '../../components/ui/box-loader.jsx'

function getRedirectPath(location) {
  if (typeof location.state?.from === 'string') {
    return location.state.from
  }

  if (location.state?.from?.pathname) {
    const pathname = location.state.from.pathname
    const search = location.state.from.search || ''
    const hash = location.state.from.hash || ''

    return `${pathname}${search}${hash}`
  }

  return '/home/admin'
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [lineReady, setLineReady] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = getRedirectPath(location)

  // ========================================
  // Login ด้วย LINE
  // ========================================
  const saveLineUser = async () => {
    try {
      setLoading(true)
      setError('')

      if (!liff.isLoggedIn()) {
        throw new Error('LINE ยังไม่ได้เข้าสู่ระบบ')
      }

      const profile = await liff.getProfile()

      if (!profile?.userId) {
        throw new Error('ไม่พบ LINE User ID')
      }

      const token = await loginWithLine({
        lineUserId: profile.userId,
        displayName: profile.displayName || '',
        pictureUrl: profile.pictureUrl || '',
      })

      if (!token) {
        throw new Error('ไม่ได้รับ token จาก Backend')
      }

      // ใช้ JWT ตัวเดียวกับ User
      localStorage.setItem('petshop_token', token)

      // สถานะ Login
      localStorage.setItem(
        'petshop_user_auth',
        'true'
      )

      navigate(redirectTo, {
        replace: true,
      })
    } catch (err) {
      console.error('Admin LINE login failed:', err)

      setError(
        err?.message ||
        'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ'
      )
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // Initialize LIFF
  // ========================================
  useEffect(() => {
    const liffId = import.meta.env.VITE_LIFF_ID

    if (!liffId) {
      setError('ยังไม่ได้ตั้งค่า LIFF ID')
      return
    }

    let active = true

    const initLiff = async () => {
      try {
        await liff.init({
          liffId,
        })

        if (!active) return

        console.log('Admin LIFF init success')
        console.log(
          'LINE is logged in:',
          liff.isLoggedIn()
        )
        console.log(
          'LINE is in client:',
          liff.isInClient()
        )

        setLineReady(true)

        // ถ้า LINE Login อยู่แล้ว
        // ให้ส่งข้อมูลไป Backend ทันที
        if (liff.isLoggedIn()) {
          await saveLineUser()
        }
      } catch (err) {
        console.error(
          'Admin LIFF init failed:',
          err
        )

        if (!active) return

        setLineReady(false)

        setError(
          err?.message ||
          'เชื่อมต่อ LINE ไม่สำเร็จ'
        )
      }
    }

    initLiff()

    return () => {
      active = false
    }
  }, [])

  // ========================================
  // กด Login ด้วย LINE
  // ========================================
  const handleLineLogin = () => {
    if (!lineReady) {
      setError(
        'กำลังเชื่อมต่อ LINE กรุณารอสักครู่'
      )
      return
    }

    setError('')
    setLoading(true)

    try {
      if (!liff.isLoggedIn()) {
        const redirectUri =
          `${window.location.origin}/home/admin/login`

        console.log(
          'Admin LINE login redirect:',
          redirectUri
        )

        liff.login({
          redirectUri,
        })

        return
      }

      saveLineUser()
    } catch (err) {
      console.error(
        'Admin LINE login button failed:',
        err
      )

      setLoading(false)

      setError(
        err?.message ||
        'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ'
      )
    }
  }

  // ========================================
  // Login ด้วยเบอร์โทร + Password
  // ========================================
  const handlePhoneLogin = async (event) => {
    event.preventDefault()

    const cleanPhone = phone.trim()

    if (!cleanPhone || !password) {
      setError(
        'กรุณากรอกเบอร์โทรและรหัสผ่าน'
      )
      return
    }

    try {
      setError('')
      setLoading(true)

      const token = await login({
        userPhone: cleanPhone,
        userPassword: password,
      })

      if (!token) {
        throw new Error('ไม่ได้รับ token จาก Backend')
      }

      // ใช้ JWT ตัวเดียวกับระบบ User
      localStorage.setItem(
        'petshop_token',
        token
      )

      localStorage.setItem(
        'petshop_user_auth',
        'true'
      )

      navigate(redirectTo, {
        replace: true,
      })
    } catch (err) {
      console.error(
        'Admin password login failed:',
        err
      )

      setError(
        err?.message ||
        'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง'
      )
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // Loading
  // ========================================
  if (loading) {
    return <BoxLoader />
  }

  return (
    <main className="min-h-[100svh] bg-gray-100 px-0 text-gray-800 sm:flex sm:items-center sm:justify-center sm:p-6">

      <div className="mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-white sm:min-h-[820px] sm:max-h-[900px] sm:rounded-[32px] sm:shadow-xl">

        {/* =====================================
            Header
        ===================================== */}
        <section className="relative flex h-[38svh] min-h-[280px] max-h-[330px] flex-col items-center justify-center overflow-hidden bg-violet-600 px-6 text-white">

          <div className="absolute -right-16 -top-16 size-40 rounded-full bg-white/10" />

          <div className="absolute -bottom-20 -left-12 size-48 rounded-full bg-white/10" />

          <div className="relative z-10 text-center">

            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/15 shadow-sm">
              <i className="fa-solid fa-paw text-2xl" />
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight">
              Petshop Admin
            </h1>

            <p className="mt-2 text-sm text-white/90">
              ระบบจัดการร้านค้าสำหรับผู้ดูแล
            </p>

          </div>
        </section>

        {/* =====================================
            Login Form
        ===================================== */}
        <section className="relative z-10 -mt-7 flex flex-1 flex-col rounded-t-[30px] bg-white px-5 pb-6 pt-7 sm:px-7">

          <div className="mb-6 text-center">

            <h2 className="text-xl font-extrabold text-gray-900">
              เข้าสู่ระบบผู้ดูแลระบบ
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              เลือกวิธีเข้าสู่ระบบที่คุณต้องการ
            </p>

          </div>

          {/* =====================================
              Phone Login
          ===================================== */}
          <form
            onSubmit={handlePhoneLogin}
            className="space-y-4"
          >

            <label className="block">

              <span className="mb-2 block text-xs font-bold text-gray-600">
                เบอร์โทร
              </span>

              <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-50">

                <i className="fa-solid fa-phone mr-3 text-sm text-gray-400" />

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="กรอกเบอร์โทร"
                  autoComplete="tel"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300"
                />

              </div>
            </label>

            <label className="block">

              <span className="mb-2 block text-xs font-bold text-gray-600">
                รหัสผ่าน
              </span>

              <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-50">

                <i className="fa-solid fa-lock mr-3 text-sm text-gray-400" />

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300"
                />

              </div>
            </label>

            <button
              type="submit"
              className="h-12 w-full rounded-2xl bg-violet-600 text-sm font-extrabold text-white shadow-sm transition hover:bg-violet-700 active:scale-[.98]"
            >
              เข้าสู่ระบบ
            </button>

          </form>

          {/* =====================================
              Divider
          ===================================== */}
          <div className="my-6 flex items-center gap-3">

            <div className="h-px flex-1 bg-gray-100" />

            <span className="text-[11px] text-gray-400">
              หรือ
            </span>

            <div className="h-px flex-1 bg-gray-100" />

          </div>

          {/* =====================================
              LINE Login
          ===================================== */}
          <button
            type="button"
            onClick={handleLineLogin}
            disabled={loading || !lineReady}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-green-500 bg-white text-sm font-bold text-green-600 transition hover:bg-green-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
          >

            <i className="fa-brands fa-line text-lg" />

            {lineReady
              ? 'เข้าสู่ระบบด้วย LINE'
              : 'กำลังเชื่อมต่อ LINE...'}

          </button>

          {/* =====================================
              Error
          ===================================== */}
          {error && (
            <p className="mt-4 text-center text-xs text-red-500">
              {error}
            </p>
          )}

          {/* =====================================
              Back
          ===================================== */}
          <div className="mt-auto pt-6 text-center">

            <Link
              to="/home"
              className="text-xs font-bold text-gray-400 transition hover:text-violet-600"
            >
              <i className="fa-solid fa-arrow-left mr-1.5" />
              กลับหน้าร้าน
            </Link>

          </div>

        </section>
      </div>
    </main>
  )
}