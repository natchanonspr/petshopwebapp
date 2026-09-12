import { useEffect, useState } from 'react'
import liff from '@line/liff'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginWithLine } from '../../api/auth.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [lineReady, setLineReady] = useState(false)
  const [error, setError] = useState('')

  const saveLineUser = async () => {
    const profile = await liff.getProfile()

    const token = await loginWithLine({
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || '',
    })
    localStorage.setItem('petshop_token', token)

    const existing = JSON.parse(localStorage.getItem('petshop_user') || '{}')
    const user = {
      ...existing,
      lineUserId: profile.userId,
      name: profile.displayName,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || '',
      loggedIn: true,
      loginProvider: 'line-liff',
    }

    localStorage.setItem('petshop_user', JSON.stringify(user))
    localStorage.setItem('petshop_user_auth', 'true')

    const existingProfile = JSON.parse(localStorage.getItem('petshop_profile') || '{}')
    const profileData = {
      ...existingProfile,
      name: profile.displayName,
      avatar: existingProfile.avatar || profile.pictureUrl || '',
    }
    localStorage.setItem('petshop_profile', JSON.stringify(profileData))
    window.dispatchEvent(new Event('petshop-profile-updated'))

    navigate(location.state?.from || '/home', { replace: true })
  }

  useEffect(() => {
    const liffId = import.meta.env.VITE_LIFF_ID
    if (!liffId) {
      setError('ยังไม่ได้ตั้งค่า LIFF ID')
      return
    }

    let active = true
    liff.init({ liffId })
      .then(async () => {
        if (!active) return
        setLineReady(true)
        if (liff.isLoggedIn()) {
          try {
            await saveLineUser()
          } catch (err) {
            console.error('LINE profile failed:', err)
            if (active) setError('อ่านข้อมูลบัญชี LINE ไม่สำเร็จ')
          }
        }
      })
      .catch((err) => {
        console.error('LIFF init failed:', err)
        if (active) setError('เชื่อมต่อ LINE ไม่สำเร็จ')
      })

    return () => {
      active = false
    }
  }, [])

  const handleLineLogin = async () => {
    const liffId = import.meta.env.VITE_LIFF_ID
    if (!liffId || !lineReady) {
      setError('LIFF ยังไม่พร้อม กรุณาตรวจสอบ LIFF ID และ Endpoint URL')
      return
    }

    try {
      setLoading(true)
      setError('')
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href })
        return
      }
      await saveLineUser()
    } catch (err) {
      console.error('LINE login failed:', err)
      setLoading(false)
      setError('เข้าสู่ระบบ LINE ไม่สำเร็จ')
    }
  }

  return (
    <main className="min-h-[100svh] bg-[#f4f4f4] text-[#222] sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-white sm:min-h-[820px] sm:max-h-[900px] sm:rounded-[32px] sm:shadow-xl">
        {/* Header */}
        <section className="relative h-[42svh] min-h-[315px] max-h-[380px] overflow-hidden bg-orange-500 px-6 pt-7 text-white">
        </section>

        {/* Login panel */}
        <section className="relative z-20 -mt-7 flex flex-1 flex-col rounded-t-[30px] bg-white px-6 pb-[calc(18px+env(safe-area-inset-bottom))] pt-6">
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={handleLineLogin}
              disabled={loading || !lineReady}
              aria-label="เข้าสู่ระบบด้วย LINE"
              className="flex size-16 items-center justify-center rounded-2xl bg-[#06C755] text-white shadow-sm transition hover:scale-105 hover:shadow-md active:scale-95 disabled:opacity-60"
            >
              <i className={`fa-brands ${loading ? 'fa-spinner fa-spin' : 'fa-line'} text-2xl`} />
            </button>
          </div>
          {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}
        </section>
      </div>
    </main>
  )
}
