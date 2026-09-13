import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import liff from '@line/liff'

import { loginWithLine } from '../../api/auth.js'
import BoxLoader from '../../components/ui/box-loader.jsx'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [lineReady, setLineReady] = useState(false)
  const [error, setError] = useState('')

  // ----------------------------------------
  // Login ด้วย LINE แล้วเก็บ JWT
  // ----------------------------------------
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

      // เก็บ JWT
      localStorage.setItem('petshop_token', token)

      // ข้อมูลนี้ใช้เฉพาะสถานะ Login
      // ไม่ใช้เป็นแหล่งข้อมูล Profile อีกต่อไป
      localStorage.setItem(
        'petshop_user_auth',
        'true'
      )

      // ไปหน้าที่ผู้ใช้กำลังจะเข้า
      const redirectTo =
        location.state?.from || '/home'

      navigate(redirectTo, {
        replace: true,
      })
    } catch (err) {
      console.error('LINE login failed:', err)

      setError(
        err?.message ||
        'เข้าสู่ระบบ LINE ไม่สำเร็จ'
      )
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------
  // Initialize LIFF
  // ----------------------------------------
  useEffect(() => {
    const liffId = import.meta.env.VITE_LIFF_ID

    console.log('LIFF ID:', liffId)

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

        console.log('LIFF init success')
        console.log(
          'LIFF is logged in:',
          liff.isLoggedIn()
        )
        console.log(
          'LIFF is in client:',
          liff.isInClient()
        )

        setLineReady(true)

        // กรณีเปิดผ่าน LIFF และ Login LINE อยู่แล้ว
        if (liff.isLoggedIn()) {
          await saveLineUser()
        }
      } catch (err) {
        console.error('LIFF init failed:', err)

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

  // ----------------------------------------
  // กด Login ด้วย LINE
  // ----------------------------------------
  const handleLineLogin = async () => {
    if (!lineReady) {
      setError(
        'กำลังเชื่อมต่อ LINE กรุณารอสักครู่'
      )
      return
    }

    try {
      setError('')
      setLoading(true)

      if (!liff.isLoggedIn()) {
        const redirectUri =
          `${window.location.origin}/login`

        console.log(
          'LINE login redirect:',
          redirectUri
        )

        liff.login({
          redirectUri,
        })

        return
      }

      await saveLineUser()
    } catch (err) {
      console.error(
        'LINE login button failed:',
        err
      )

      setLoading(false)

      setError(
        err?.message ||
        'เข้าสู่ระบบ LINE ไม่สำเร็จ'
      )
    }
  }

  // ----------------------------------------
  // Login ด้วยเบอร์โทร
  // ----------------------------------------
  const handlePhoneLogin = () => {
    setError('')

    if (!phone.trim() || !password) {
      setError(
        'กรุณากรอกเบอร์โทรและรหัสผ่าน'
      )
      return
    }

    // ยังไม่ได้เชื่อม Backend
    setError(
      'ระบบเข้าสู่ระบบด้วยเบอร์โทรจะเชื่อมต่อ Backend ต่อไป'
    )
  }

  // ----------------------------------------
  // Loading
  // ----------------------------------------
  if (loading) {
    return <BoxLoader />
  }

  return (
    <main className="min-h-[100svh] bg-gray-100 px-0 text-gray-800 sm:flex sm:items-center sm:justify-center sm:p-6">

      <div className="mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-white sm:min-h-[820px] sm:max-h-[900px] sm:rounded-[32px] sm:shadow-xl">

        {/* =====================================
            Header
        ===================================== */}
        <section className="relative flex h-[42svh] min-h-[300px] max-h-[360px] flex-col items-center justify-center overflow-hidden bg-orange-500 px-6 text-white">

          <div className="absolute -right-16 -top-16 size-40 rounded-full bg-white/10" />

          <div className="absolute -bottom-20 -left-12 size-48 rounded-full bg-white/10" />

          <div className="relative z-10 text-center">

            <h1 className="text-3xl font-black tracking-tight">
              Petshop
            </h1>

            <p className="mt-2 text-sm text-white/90">
              ดูแลสัตว์เลี้ยงของคุณให้ง่ายขึ้น
            </p>

          </div>
        </section>

        {/* =====================================
            Login Form
        ===================================== */}
        <section className="relative z-10 -mt-7 flex flex-1 flex-col rounded-t-[30px] bg-white px-5 pb-6 pt-7 sm:px-7">

          <div className="mb-6 text-center">

            <h2 className="text-xl font-extrabold text-gray-900">
              เข้าสู่ระบบ
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              เข้าสู่บัญชี Petshop ของคุณ
            </p>

          </div>

          {/* =====================================
              Phone Login
          ===================================== */}
          <div className="space-y-4">

            <label className="block">

              <span className="mb-2 block text-xs font-bold text-gray-600">
                เบอร์โทร
              </span>

              <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">

                <i className="fa-solid fa-phone mr-3 text-sm text-gray-400" />

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="กรอกเบอร์โทร"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300"
                />

              </div>
            </label>

            <label className="block">

              <span className="mb-2 block text-xs font-bold text-gray-600">
                รหัสผ่าน
              </span>

              <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">

                <i className="fa-solid fa-lock mr-3 text-sm text-gray-400" />

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300"
                />

              </div>
            </label>

            <button
              type="button"
              className="w-full text-right text-xs font-semibold text-orange-500"
            >
              ลืมรหัสผ่าน?
            </button>

            <button
              type="button"
              onClick={handlePhoneLogin}
              className="h-12 w-full rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[.98]"
            >
              เข้าสู่ระบบ
            </button>

          </div>

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
              Register
          ===================================== */}
          <p className="mt-auto pt-6 text-center text-xs text-gray-400">

            ยังไม่มีบัญชี?

            <Link
              to="/register"
              className="ml-1 font-bold text-orange-500"
            >
              สมัครสมาชิก
            </Link>

          </p>

          {/* =====================================
              Admin
          ===================================== */}
          <button
            type="button"
            onClick={() =>
              navigate('/home/admin/login')
            }
            className="mt-2 text-xs font-semibold text-gray-400 hover:text-orange-500"
          >
            เข้าสู่ระบบ Admin
          </button>

        </section>
      </div>
    </main>
  )
}