import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function PasswordLoginMock() {
  const navigate = useNavigate()
  const location = useLocation()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน')
      return
    }
    setSubmitted(true)
  }

  const goHome = () => {
    const from = location.state?.from || '/home'
    const user = JSON.parse(localStorage.getItem('petshop_user') || '{}')
    localStorage.setItem('petshop_user', JSON.stringify({ ...user, loggedIn: true, loginProvider: 'password' }))
    localStorage.setItem('petshop_user_auth', 'true')
    navigate(from, { replace: true })
  }

  return (
    <main className="min-h-[100svh] bg-white px-4 py-6 text-gray-900 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[420px] items-center justify-center">
        <section className="w-full rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_18px_55px_rgba(17,24,39,0.08)] sm:p-8">
          <button type="button" onClick={() => navigate('/login')} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-orange-500">
            <i className="fa-solid fa-arrow-left text-xs" /> กลับหน้าเข้าสู่ระบบ
          </button>

          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-orange-500">
              <i className="fa-solid fa-envelope text-2xl" />
            </div>
            <h1 className="mt-5 text-2xl font-black">เข้าสู่ระบบ</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน</p>
          </div>

          {submitted ? (
            <div className="mt-7 rounded-2xl border border-green-100 bg-green-50 p-5 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-white text-green-500 shadow-sm"><i className="fa-solid fa-check" /></div>
              <h2 className="mt-4 font-extrabold">เข้าสู่ระบบสำเร็จ</h2>
              <p className="mt-1 text-sm text-gray-500">นี่เป็นระบบ Mock สำหรับการนำเสนอโปรเจกต์</p>
              <button type="button" onClick={goHome} className="mt-5 h-11 w-full rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600">เข้าสู่หน้าหลัก</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-600">
                  <i className="fa-solid fa-circle-exclamation mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-gray-600">อีเมล</span>
                <div className="flex h-12 items-center rounded-xl border border-gray-200 px-3 focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-50">
                  <i className="fa-regular fa-envelope mr-3 text-gray-400" />
                  <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" placeholder="example@email.com" autoComplete="email" />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-gray-600">รหัสผ่าน</span>
                <div className="flex h-12 items-center rounded-xl border border-gray-200 px-3 focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-50">
                  <i className="fa-solid fa-lock mr-3 text-gray-400" />
                  <input value={password} onChange={(event) => setPassword(event.target.value)} required type={showPassword ? 'text' : 'password'} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" placeholder="รหัสผ่าน" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="ml-2 text-gray-400 hover:text-orange-500" aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
              </label>
              <button type="button" onClick={() => navigate('/forgot-password')} className="w-full text-right text-xs font-semibold text-orange-500 hover:underline">ลืมรหัสผ่าน?</button>
              <button type="submit" className="h-12 w-full rounded-xl bg-orange-500 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 active:scale-[.98]">เข้าสู่ระบบ</button>
            </form>
          )}

          {!submitted && <p className="mt-6 text-center text-xs text-gray-400">ยังไม่มีบัญชี? <button onClick={() => navigate('/register')} className="font-bold text-orange-500 hover:underline">สมัครสมาชิก</button></p>}
          <p className="mt-6 text-center text-[10px] leading-5 text-gray-300">การเข้าสู่ระบบถือว่ายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</p>
          <p className="mt-1 text-center text-[10px] text-gray-300">Pet Shop • Mock Authentication</p>
        </section>
      </div>
    </main>
  )
}
