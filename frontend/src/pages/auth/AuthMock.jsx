import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../../api/auth.js'
import BoxLoader from '../../components/ui/box-loader.jsx'

export default function AuthMock() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (error) setError('')
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setError('')
    const username = form.username.trim()
    const email = form.email.trim().toLowerCase()
    const phone = form.phone.replace(/\D/g, '')

    if (!username || !email || !phone || !form.password || !form.confirmPassword) return setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
    if (!/^\d{10}$/.test(phone)) return setError('กรุณากรอกเบอร์โทร 10 หลัก')
    if (form.password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    if (form.password !== form.confirmPassword) return setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน')

    try {
      setLoading(true)
      await register({ username, email, phone, password: form.password })
      setSubmitted(true)
    } catch (err) {
      setError(err?.message || 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <BoxLoader />

  return (
    <main className="min-h-[100svh] bg-gray-100 px-0 text-gray-800 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-white sm:min-h-[820px] sm:max-h-[900px] sm:rounded-[32px] sm:shadow-xl">
        <section className="relative flex min-h-[210px] flex-col items-center justify-center overflow-hidden bg-orange-500 px-6 text-white">
          <div className="absolute -right-16 -top-16 size-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-12 size-48 rounded-full bg-white/10" />
          <div className="relative z-10 text-center">
            <h1 className="text-3xl font-black tracking-tight">Petshop</h1>
            <p className="mt-2 text-sm text-white/90">สร้างบัญชีเพื่อเริ่มใช้งาน Petshop</p>
          </div>
        </section>

        <section className="relative z-10 -mt-6 flex flex-1 flex-col rounded-t-[30px] bg-white px-5 pb-6 pt-7 sm:px-7">
          <button type="button" onClick={() => navigate('/login')} className="mb-5 self-start text-sm font-semibold text-gray-500 hover:text-orange-500">
            <i className="fa-solid fa-arrow-left mr-2 text-xs" />กลับหน้าเข้าสู่ระบบ
          </button>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold text-gray-900">สมัครสมาชิก</h2>
            <p className="mt-1 text-xs text-gray-400">กรอกข้อมูลเพื่อสร้างบัญชีใหม่</p>
          </div>

          {submitted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-[330px] rounded-2xl bg-white p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-green-50 text-green-500"><i className="fa-solid fa-check text-lg" /></div>
                <h3 className="mt-4 text-lg font-extrabold text-gray-900">สมัครสมาชิกสำเร็จ</h3>
                <p className="mt-1.5 text-sm text-gray-500">บัญชีของคุณถูกสร้างเรียบร้อยแล้ว</p>
                <button type="button" onClick={() => navigate('/login')} className="mt-5 h-11 w-full rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-[.98]">ยืนยัน</button>
              </div>
            </div>
          )}

          {!submitted && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label="ชื่อผู้ใช้งาน" icon="fa-user" value={form.username} onChange={updateField('username')} placeholder="ชื่อของคุณ" />
              <Field label="อีเมล" icon="fa-envelope" type="email" value={form.email} onChange={updateField('email')} placeholder="example@email.com" />
              <Field label="เบอร์โทร" icon="fa-phone" type="tel" inputMode="numeric" value={form.phone} onChange={updateField('phone')} placeholder="08xxxxxxxx" maxLength={10} />

              <PasswordField
                label="รหัสผ่าน"
                value={form.password}
                onChange={updateField('password')}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                show={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
              />

              <PasswordField
                label="ยืนยันรหัสผ่าน"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
              />

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <button type="submit" className="h-12 w-full rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[.98]">สมัครสมาชิก</button>
            </form>
          )}

          {!submitted && (
            <p className="mt-auto pt-6 text-center text-xs text-gray-400">
              มีบัญชีอยู่แล้ว?
              <button type="button" onClick={() => navigate('/login')} className="ml-1 font-bold text-orange-500 hover:underline">เข้าสู่ระบบ</button>
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

function ErrorMessage({ children }) {
  return <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-center text-xs font-semibold text-red-500">{children}</div>
}

function Field({ label, icon, type = 'text', value, onChange, placeholder, inputMode, maxLength }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-gray-600">{label}</span>
      <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">
        <i className={`fa-solid ${icon} mr-3 text-sm text-gray-400`} />
        <input required type={type} value={value} onChange={onChange} placeholder={placeholder} inputMode={inputMode} maxLength={maxLength} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" />
      </div>
    </label>
  )
}

function PasswordField({ label, value, onChange, placeholder, show, onToggle }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-gray-600">{label}</span>
      <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">
        <i className="fa-solid fa-lock mr-3 text-sm text-gray-400" />
        <input required type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300" />
        <button type="button" onClick={onToggle} className="ml-2 shrink-0 text-gray-400 hover:text-orange-500" aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
          <i className={`fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
        </button>
      </div>
    </label>
  )
}
