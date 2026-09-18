// =========================
// Login Page: จัดการการเข้าสู่ระบบด้วยโทรศัพท์และ LINE
// =========================
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import liff from '@line/liff'

import { login, loginWithLine } from '../../api/auth.js'
import { getProfile, updateProfile } from '../../api/profile.js'
import BoxLoader from '../../components/ui/box-loader.jsx'

function getRedirectPath(location) {
  if (typeof location.state?.from === 'string') return location.state.from
  if (location.state?.from?.pathname) {
    const { pathname, search = '', hash = '' } = location.state.from
    return `${pathname}${search}${hash}`
  }
  return '/home'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = getRedirectPath(location)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lineReady, setLineReady] = useState(false)
  const [error, setError] = useState('')

  const [showCompleteProfile, setShowCompleteProfile] = useState(false)
  const [completeSaving, setCompleteSaving] = useState(false)
  const [completeError, setCompleteError] = useState('')
  const [showCompletePassword, setShowCompletePassword] = useState(false)
  const [showCompleteConfirmPassword, setShowCompleteConfirmPassword] = useState(false)
  const [showConfirmComplete, setShowConfirmComplete] = useState(false)
  const [isLineProfile, setIsLineProfile] = useState(false)
  const [completeForm, setCompleteForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', pictureUrl: '' })

  const finishLogin = async (token, defaultUsername = '', fromLine = false) => {
    localStorage.setItem('petshop_token', token)
    localStorage.setItem('petshop_user_auth', 'true')
    const profile = await getProfile()
    const incomplete = !profile?.email || !profile?.phone || !profile?.profile_complete

    if (incomplete) {
      setIsLineProfile(fromLine)
      setCompleteForm({
        name: profile?.username || defaultUsername || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        password: '',
        confirmPassword: '',
        pictureUrl: profile?.picture_url || '',
      })
      setCompleteError('')
      setShowCompleteProfile(true)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  const saveLineUser = async () => {
    try {
      setLoading(true)
      setError('')
      if (!liff.isLoggedIn()) {
        // ใช้ /login เป็น callback และไม่ส่ง authorization code เก่ากลับไปซ้ำ
        liff.login({ redirectUri: `${window.location.origin}/login` })
        return
      }
      const profile = await liff.getProfile()
      if (!profile?.userId) throw new Error('ไม่พบ LINE User ID')
      const token = await loginWithLine({
        lineUserId: profile.userId,
        displayName: profile.displayName || '',
        pictureUrl: profile.pictureUrl || '',
      })
      await finishLogin(token, profile.displayName || '', true)
    } catch (err) {
      console.error('LINE login failed:', err)
      setError(err?.message || 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
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

        const url = new URL(window.location.href)
        if (url.searchParams.has('code') || url.searchParams.has('state')) {
          url.searchParams.delete('code')
          url.searchParams.delete('state')
          window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
        }

        setLineReady(true)

        if (liff.isLoggedIn()) {
          await saveLineUser()
        }
      })
      .catch((err) => {
        console.error('LIFF init failed:', err)
        if (active) {
          setLineReady(false)
          setError(err?.message || 'เชื่อมต่อ LINE ไม่สำเร็จ')
        }
      })
    return () => { active = false }
  }, [])

  const handleLineLogin = async () => {
    if (!lineReady) {
      setError('กำลังเชื่อมต่อ LINE กรุณารอสักครู่')
      return
    }
    await saveLineUser()
  }

  const handlePhoneLogin = async (event) => {
    event.preventDefault()
    setError('')
    const cleanPhone = phone.replace(/\D/g, '')
    if (!/^\d{10}$/.test(cleanPhone) || !password) {
      setError('กรุณากรอกเบอร์โทร 10 หลักและรหัสผ่าน')
      return
    }
    try {
      setLoading(true)
      const token = await login({ userPhone: cleanPhone, userPassword: password })
      await finishLogin(token)
    } catch (err) {
      console.error('Phone login failed:', err)
      setError(err?.message || 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  const saveCompletedProfile = (event) => {
    event.preventDefault()
    setCompleteError('')
    const cleanPhone = completeForm.phone.replace(/\D/g, '')
    if (!completeForm.name.trim()) return setCompleteError('กรุณากรอกชื่อผู้ใช้งาน')
    if (!completeForm.email.trim()) return setCompleteError('กรุณากรอกอีเมล')
    if (!/^\d{10}$/.test(cleanPhone)) return setCompleteError('กรุณากรอกเบอร์โทร 10 หลัก')
    if (!isLineProfile) {
      if (completeForm.password.length < 6) return setCompleteError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      if (completeForm.password !== completeForm.confirmPassword) return setCompleteError('รหัสผ่านไม่ตรงกัน')
    }
    setCompleteForm((current) => ({ ...current, phone: cleanPhone }))
    setShowConfirmComplete(true)
  }

  const confirmCompletedProfile = async () => {
    try {
      setCompleteSaving(true)
      setShowConfirmComplete(false)
      await updateProfile({
        name: completeForm.name.trim(),
        phone: completeForm.phone.replace(/\D/g, ''),
        email: completeForm.email.trim(),
        password: isLineProfile ? '' : completeForm.password,
        pictureUrl: completeForm.pictureUrl,
      })
      setShowCompleteProfile(false)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      console.error('complete profile error:', err)
      const message = err?.message || 'ไม่สามารถบันทึกข้อมูลได้'
      if (message.includes('เบอร์โทรนี้ถูกใช้งานแล้ว')) {
        setCompleteError('เบอร์โทรนี้ถูกใช้งานแล้ว กรุณาใช้เบอร์อื่น')
      } else if (message.includes('อีเมลนี้ถูกใช้งานแล้ว')) {
        setCompleteError('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้เมลอื่น')
      } else {
        setCompleteError(message)
      }
    } finally {
      setCompleteSaving(false)
    }
  }

  if (loading && !showCompleteProfile) return <BoxLoader />

  return (
    <main className="min-h-[100svh] bg-gray-100 px-0 text-gray-800 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-white sm:min-h-[820px] sm:max-h-[900px] sm:rounded-[32px] sm:shadow-xl">
        <section className="relative flex h-[42svh] min-h-[300px] max-h-[360px] flex-col items-center justify-center overflow-hidden bg-orange-500 px-6 text-white">
          <div className="absolute -right-16 -top-16 size-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-12 size-48 rounded-full bg-white/10" />
          <div className="relative z-10 text-center">
            <h1 className="text-3xl font-black tracking-tight">Petshop</h1>
            <p className="mt-2 text-sm text-white/90">ดูแลสัตว์เลี้ยงของคุณให้ง่ายขึ้น</p>
          </div>
        </section>

        <section className="relative z-10 -mt-7 flex flex-1 flex-col rounded-t-[30px] bg-white px-5 pb-6 pt-7 sm:px-7">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold text-gray-900">เข้าสู่ระบบ</h2>
            <p className="mt-1 text-xs text-gray-400">เข้าสู่บัญชี Petshop ของคุณ</p>
          </div>

          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-600">เบอร์โทร</span>
              <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">
                <i className="fa-solid fa-phone mr-3 text-sm text-gray-400" />
                <input type="tel" value={phone} maxLength={10} inputMode="numeric" onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="กรอกเบอร์โทร" className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-600">รหัสผ่าน</span>
              <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">
                <i className="fa-solid fa-lock mr-3 text-sm text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="กรอกรหัสผ่าน" className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="ml-2 text-gray-400 hover:text-orange-500"><i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} /></button>
              </div>
            </label>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="w-full text-right text-xs font-semibold text-orange-500 hover:text-orange-600">ลืมรหัสผ่าน?</Link>
            </div>

            {error && <p className="text-center text-xs text-red-500">{error}</p>}

            <button type="submit" disabled={loading} className="h-12 w-full rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[.98] disabled:opacity-60">{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
          </form>

          <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-gray-100" /><span className="text-[11px] text-gray-400">หรือ</span><div className="h-px flex-1 bg-gray-100" /></div>

          <button type="button" onClick={handleLineLogin} disabled={loading || !lineReady} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-green-500 bg-white text-sm font-bold text-green-600 transition hover:bg-green-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60">
            <i className="fa-brands fa-line text-lg" />
            {lineReady ? 'เข้าสู่ระบบด้วย LINE' : 'กำลังเชื่อมต่อ LINE...'}
          </button>

          <p className="mt-auto pt-6 text-right text-xs text-gray-400">ยังไม่มีบัญชี? <Link to="/register" className="ml-1 font-bold text-orange-500 hover:text-orange-600">สมัครสมาชิก</Link></p>
        </section>
      </div>

      {showCompleteProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 pt-1 text-center"><div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-orange-100 text-orange-500"><i className="fa-solid fa-user-pen" /></div><h2 className="text-xl font-bold">กรอกข้อมูลให้ครบก่อนใช้งาน</h2><p className="mt-1 text-xs text-slate-400">กรุณากรอกข้อมูลที่จำเป็นก่อนเข้าใช้งาน Petshop</p></div>
            <form onSubmit={saveCompletedProfile} className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-semibold">ชื่อผู้ใช้งาน</label><input value={completeForm.name} onChange={(e) => setCompleteForm({ ...completeForm, name: e.target.value })} placeholder="ชื่อผู้ใช้งาน" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></div>
              <div><label className="mb-1.5 block text-sm font-semibold">อีเมล</label><input type="email" value={completeForm.email} onChange={(e) => setCompleteForm({ ...completeForm, email: e.target.value })} placeholder="example@email.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></div>
              <div><label className="mb-1.5 block text-sm font-semibold">เบอร์โทรศัพท์</label><input value={completeForm.phone} onChange={(e) => setCompleteForm({ ...completeForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" maxLength={10} placeholder="เบอร์โทร 10 หลัก" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></div>
              {!isLineProfile && <>
                <div><label className="mb-1.5 block text-sm font-semibold">รหัสผ่าน</label><div className="relative"><input type={showCompletePassword ? 'text' : 'password'} value={completeForm.password} onChange={(e) => setCompleteForm({ ...completeForm, password: e.target.value })} placeholder="อย่างน้อย 6 ตัวอักษร" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /><button type="button" onClick={() => setShowCompletePassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500"><i className={`fa-solid ${showCompletePassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} /></button></div></div>
                <div><label className="mb-1.5 block text-sm font-semibold">ยืนยันรหัสผ่าน</label><div className="relative"><input type={showCompleteConfirmPassword ? 'text' : 'password'} value={completeForm.confirmPassword} onChange={(e) => setCompleteForm({ ...completeForm, confirmPassword: e.target.value })} placeholder="กรอกรหัสผ่านอีกครั้ง" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /><button type="button" onClick={() => setShowCompleteConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500"><i className={`fa-solid ${showCompleteConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} /></button></div></div>
              </>}
              {completeError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{completeError}</div>}
              <button type="submit" disabled={completeSaving} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60">ดำเนินการต่อ</button>
            </form>
          </div>
        </div>
      )}

      {showConfirmComplete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-orange-100 text-orange-500"><i className="fa-solid fa-circle-check" /></div>
            <h3 className="text-lg font-bold">ยืนยันข้อมูล</h3><p className="mt-2 text-sm text-slate-500">ต้องการบันทึกข้อมูลและเข้าใช้งาน Petshop ใช่หรือไม่?</p>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowConfirmComplete(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">ยกเลิก</button><button type="button" onClick={confirmCompletedProfile} disabled={completeSaving} className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{completeSaving ? 'กำลังบันทึก...' : 'ยืนยัน'}</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
