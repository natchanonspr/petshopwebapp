import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const modeConfig = {
  register: {
    title: 'สมัครสมาชิก',
    subtitle: 'สร้างบัญชี Pet Shop สำหรับจัดการข้อมูลของคุณ',
    button: 'สมัครสมาชิก',
  },
  forgot: {
    title: 'กู้คืนรหัสผ่าน',
    subtitle: 'กรอกอีเมลเพื่อรับลิงก์สำหรับกู้คืนรหัสผ่าน',
    button: 'ส่งคำขอกู้คืน',
  },
}

export default function AuthMock({ mode = 'register' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const config = modeConfig[mode] || modeConfig.register
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-[100svh] bg-white px-4 py-6 text-gray-900 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[430px] items-center justify-center">
        <section className="w-full rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.07)] sm:p-8">
          <button
            type="button"
            onClick={() => navigate('/login', { state: { from: location.state?.from } })}
            className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-orange-500"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            กลับหน้าเข้าสู่ระบบ
          </button>

          <div className="mb-7 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-orange-500">
              <i className={`fa-solid ${mode === 'forgot' ? 'fa-key' : 'fa-user-plus'} text-2xl`} />
            </div>
            <h1 className="mt-5 text-2xl font-black tracking-tight">{config.title}</h1>
            <p className="mx-auto mt-2 max-w-[310px] text-sm leading-6 text-gray-500">{config.subtitle}</p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-white text-green-500 shadow-sm">
                <i className="fa-solid fa-check" />
              </div>
              <h2 className="mt-4 text-base font-extrabold text-gray-800">
                {mode === 'forgot' ? 'ส่งคำขอเรียบร้อยแล้ว' : 'สมัครสมาชิกเรียบร้อยแล้ว'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {mode === 'forgot'
                  ? 'นี่เป็นหน้าจำลองสำหรับนำไปเชื่อมระบบจริงภายหลัง'
                  : 'นี่เป็นหน้าจำลอง ยังไม่มีการสร้างบัญชีจริง'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-5 h-11 w-full rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                กลับเข้าสู่ระบบ
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-gray-600">ชื่อผู้ใช้งาน</span>
                  <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-white px-3 transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-50">
                    <i className="fa-regular fa-user mr-3 text-gray-400" />
                    <input required className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" placeholder="ชื่อของคุณ" />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-gray-600">อีเมล</span>
                <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-white px-3 transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-50">
                  <i className="fa-regular fa-envelope mr-3 text-gray-400" />
                  <input required type="email" className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" placeholder="example@email.com" />
                </div>
              </label>

              {mode === 'register' && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-gray-600">รหัสผ่าน</span>
                  <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-white px-3 transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-50">
                    <i className="fa-solid fa-lock mr-3 text-gray-400" />
                    <input required type="password" minLength={6} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" placeholder="อย่างน้อย 6 ตัวอักษร" />
                  </div>
                </label>
              )}

              <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-orange-500 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-600 active:scale-[.98]">
                {config.button}
              </button>
            </form>
          )}

          {!submitted && (
            <div className="mt-6 text-center text-xs text-gray-400">
              {mode === 'register' ? (
                <>มีบัญชีอยู่แล้ว? <button onClick={() => navigate('/login')} className="font-bold text-orange-500 hover:underline">เข้าสู่ระบบ</button></>
              ) : (
                <>จำรหัสผ่านได้แล้ว? <button onClick={() => navigate('/login')} className="font-bold text-orange-500 hover:underline">เข้าสู่ระบบ</button></>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-[10px] text-gray-300">Pet Shop • Mock Authentication</div>
        </section>
      </div>
    </main>
  )
}
