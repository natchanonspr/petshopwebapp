import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'

const PROFILE_KEY = 'petshop_profile'

function readProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export default function EditProfile() {
  const navigate = useNavigate()
  const avatarInputRef = useRef(null)
  const [profile, setProfile] = useState(readProfile)
  const [form, setForm] = useState(() => ({
    name: profile.name || 'กระเทียม เจียว',
    phone: profile.phone || '',
    email: profile.email || 'krathiam@email.com',
    gender: profile.gender || '',
    birthDate: profile.birthDate || '',
  }))
  const [message, setMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [cropSource, setCropSource] = useState(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState(null)
  const cropImageRef = useRef(null)

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropSource(reader.result)
      setCropZoom(1)
      setCropOffset({ x: 0, y: 0 })
      setAvatarError('')
    }
    reader.readAsDataURL(file)
  }

  const finishCrop = () => {
    const image = cropImageRef.current
    if (!image || !cropSource) return

    const size = 280
    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight)
    const scale = baseScale * cropZoom
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) return

    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    const drawX = (size - drawWidth) / 2 + cropOffset.x
    const drawY = (size - drawHeight) / 2 + cropOffset.y
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

    const avatar = canvas.toDataURL('image/jpeg', 0.9)
    try {
      const current = readProfile()
      const next = { ...current, avatar }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
      setProfile(next)
      window.dispatchEvent(new Event('petshop-profile-updated'))
      setCropSource(null)
      setAvatarError('')
    } catch {
      setAvatarError('ไม่สามารถบันทึกรูปโปรไฟล์ได้ กรุณาลองรูปที่เล็กลง')
    }
  }

  const save = (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setShowConfirm(true)
  }

  const confirmSave = () => {
    const current = readProfile()
    const next = { ...current, ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    setProfile(next)
    window.dispatchEvent(new Event('petshop-profile-updated'))
    setShowConfirm(false)
    setMessage('')
    setShowSuccess(true)
  }

  const inputClass = 'mt-1.5 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100'

  const successModalStyles = `
    @keyframes successBackdropIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes successCardIn { 0% { opacity: 0; transform: translateY(18px) scale(.92) } 65% { transform: translateY(-3px) scale(1.02) } 100% { opacity: 1; transform: translateY(0) scale(1) } }
    @keyframes successIconIn { 0% { opacity: 0; transform: scale(.35) rotate(-18deg) } 70% { transform: scale(1.12) rotate(4deg) } 100% { opacity: 1; transform: scale(1) rotate(0) } }
    @keyframes successCheck { from { stroke-dashoffset: 30 } to { stroke-dashoffset: 0 } }
  `

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="shrink-0 rounded-b-[28px] border-b border-slate-100 bg-white px-4 py-5 shadow-[0_3px_12px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-[44px_1fr_44px] items-center">
          <Link to="/profile" aria-label="กลับโปรไฟล์" className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-700 active:scale-90">
            <i className="fa-solid fa-arrow-left text-[17px]" />
          </Link>
          <h1 className="m-0 text-center text-[18px] font-extrabold text-slate-900">แก้ไขข้อมูลส่วนตัว</h1>
          <span className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500">
            <i className="fa-solid fa-user-pen text-[17px]" />
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <form onSubmit={save} className="space-y-4">
          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="m-0 text-base font-extrabold text-slate-900">ข้อมูลส่วนตัว</h2>

            <div className="mt-4 flex flex-col items-center">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                aria-label="เลือกรูปโปรไฟล์"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="group relative grid size-[92px] place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-yellow-200 to-orange-300 text-5xl shadow-md transition active:scale-95"
                aria-label="เปลี่ยนรูปโปรไฟล์"
              >
                {profile.avatar ? <img src={profile.avatar} alt="รูปโปรไฟล์" className="size-full object-cover" /> : '👩🏻'}
                <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-slate-900/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <i className="fa-solid fa-camera text-xs" />
                </span>
              </button>
              <p className="mt-2 mb-0 text-xs font-bold text-slate-400">แตะเพื่อเปลี่ยนรูปโปรไฟล์</p>
              {avatarError && <p className="mt-1 mb-0 text-xs font-bold text-red-500">{avatarError}</p>}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-800">ชื่อ-นามสกุล</span>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="ชื่อ-นามสกุล" />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-800">เบอร์โทรศัพท์</span>
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} inputMode="tel" placeholder="เบอร์โทรศัพท์" />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-800">อีเมล</span>
              <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} placeholder="อีเมล" />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">เพศ</span>
                <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className={inputClass}>
                  <option value="">เลือกเพศ</option>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                  <option value="ไม่ระบุ">ไม่ระบุ</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">วันเกิด</span>
                <input type="date" value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} className={inputClass} />
              </label>
            </div>
          </section>

          <Link to="/profile/addresses" className="flex items-center justify-between rounded-3xl bg-white px-4 py-5 shadow-sm active:scale-[0.99]">
            <span><strong className="block text-sm font-extrabold text-slate-900">ที่อยู่สำหรับจัดส่ง</strong><small className="mt-1 block text-xs text-slate-400">จัดการที่อยู่จัดส่ง</small></span>
            <i className="fa-solid fa-chevron-right text-xs text-slate-400" />
          </Link>

          {message && <p className="m-0 rounded-2xl bg-green-50 px-4 py-3 text-center text-xs font-bold text-green-600">{message}</p>}

          <button type="submit" className="h-14 w-full rounded-2xl bg-orange-500 text-base font-extrabold text-white shadow-sm shadow-orange-500/20 active:scale-[0.99]">
            บันทึกข้อมูล
          </button>
        </form>
      </main>

      <BottomNavigation />

      {cropSource && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="crop-avatar-title">
          <div className="w-full max-w-[390px] rounded-[28px] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="crop-avatar-title" className="m-0 text-lg font-extrabold text-slate-900">ครอปรูปโปรไฟล์</h2>
                <p className="mt-1 mb-0 text-xs text-slate-400">ลากภาพเพื่อจัดตำแหน่ง และเลื่อนเพื่อซูม</p>
              </div>
              <button type="button" onClick={() => setCropSource(null)} className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500 active:scale-90" aria-label="ปิด">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div
              className="relative mx-auto mt-5 size-[280px] touch-none overflow-hidden rounded-3xl bg-slate-100 shadow-inner"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                setDragStart({ pointerX: event.clientX, pointerY: event.clientY, x: cropOffset.x, y: cropOffset.y })
              }}
              onPointerMove={(event) => {
                if (!dragStart) return
                setCropOffset({ x: dragStart.x + event.clientX - dragStart.pointerX, y: dragStart.y + event.clientY - dragStart.pointerY })
              }}
              onPointerUp={() => setDragStart(null)}
              onPointerCancel={() => setDragStart(null)}
            >
              <img
                ref={cropImageRef}
                src={cropSource}
                alt="ตัวอย่างรูปที่กำลังครอป"
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: `${Math.max(280 / (cropImageRef.current?.naturalWidth || 1) * (cropImageRef.current?.naturalHeight || 1), 280)}px`,
                  height: `${Math.max(280 / (cropImageRef.current?.naturalHeight || 1) * (cropImageRef.current?.naturalWidth || 1), 280)}px`,
                  transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                }}
                draggable="false"
              />
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-white/90" />
              <div className="pointer-events-none absolute inset-0 rounded-full border-[3px] border-white/95 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <i className="fa-solid fa-image text-xs text-slate-400" />
              <input aria-label="ซูมรูปโปรไฟล์" type="range" min="1" max="3" step="0.01" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} className="h-2 flex-1 accent-orange-500" />
              <i className="fa-solid fa-magnifying-glass-plus text-xs text-slate-400" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setCropSource(null)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-600 active:scale-[0.98]">ยกเลิก</button>
              <button type="button" onClick={finishCrop} className="h-12 rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm shadow-orange-500/20 active:scale-[0.98]">ใช้รูปนี้</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="save-success-title" style={{ animation: 'successBackdropIn .22s ease-out both' }}>
          <style>{successModalStyles}</style>
          <div className="w-full max-w-[380px] rounded-[28px] bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.22)]" style={{ animation: 'successCardIn .48s cubic-bezier(.2,.8,.2,1) both' }}>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500" style={{ animation: 'successIconIn .55s cubic-bezier(.2,.8,.2,1) .12s both' }}>
              <svg viewBox="0 0 24 24" className="size-8" fill="none" aria-hidden="true">
                <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset="0" style={{ animation: 'successCheck .38s ease-out .35s both' }} />
              </svg>
            </div>
            <h2 id="save-success-title" className="mt-4 mb-0 text-xl font-extrabold text-slate-900">บันทึกข้อมูลเรียบร้อยแล้ว</h2>
            <p className="mt-2 mb-0 text-sm text-slate-500">ข้อมูลส่วนตัวของคุณถูกบันทึกเรียบร้อย</p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="mt-6 h-12 w-full rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm shadow-orange-500/20 active:scale-[0.98]"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-save-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowConfirm(false)
          }}
        >
          <div className="w-full max-w-[380px] rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.22)] animate-[fadeIn_.18s_ease-out]">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500">
              <i className="fa-solid fa-floppy-disk text-2xl" />
            </div>

            <div className="mt-4 text-center">
              <h2 id="confirm-save-title" className="m-0 text-xl font-extrabold text-slate-900">ยืนยันการบันทึก?</h2>
              <p className="mt-2 mb-0 text-sm leading-6 text-slate-500">คุณต้องการบันทึกข้อมูลส่วนตัวที่แก้ไขไว้หรือไม่?</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-600 active:scale-[0.98]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmSave}
                className="h-12 rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm shadow-orange-500/20 active:scale-[0.98]"
              >
                ยืนยันบันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
