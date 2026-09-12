import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import NotificationBadge from './NotificationBadge.jsx'

const readProfile = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('petshop_profile') || '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export default function ProfileHero() {
  const [profile, setProfile] = useState(readProfile)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef(null)
  useEffect(() => {
    const refresh = () => setProfile(readProfile())
    window.addEventListener('petshop-profile-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('petshop-profile-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

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
      try {
        const current = readProfile()
        const next = { ...current, avatar: reader.result }
        localStorage.setItem('petshop_profile', JSON.stringify(next))
        setProfile(next)
        setAvatarError('')
        window.dispatchEvent(new Event('petshop-profile-updated'))
      } catch {
        setAvatarError('ไม่สามารถบันทึกรูปโปรไฟล์ได้ กรุณาลองรูปที่เล็กลง')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="px-5 pb-5 pt-3 text-center text-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="size-11" aria-hidden="true" />

        <Link
          to="/notifications"
          aria-label="การแจ้งเตือน"
          className="relative grid size-11 place-items-center rounded-full bg-white/80 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white active:scale-90"
        >
          <NotificationBadge>
            <i className="fa-solid fa-bell text-[18px]" />
          </NotificationBadge>
        </Link>
      </div>

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
        className="group relative mx-auto block size-[92px] overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-yellow-200 to-orange-300 text-5xl shadow-md transition active:scale-95"
        aria-label="เปลี่ยนรูปโปรไฟล์"
      >
        {profile.avatar ? <img src={profile.avatar} alt="รูปโปรไฟล์" className="size-full object-cover" /> : '👩🏻'}
        <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-slate-900/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <i className="fa-solid fa-camera text-xs" />
        </span>
      </button>
      {avatarError && <p className="mx-auto mt-2 max-w-[280px] text-xs font-bold text-red-500">{avatarError}</p>}
      <h1 className="mt-3 text-[24px] font-bold tracking-tight text-slate-800">{profile.name || 'กระเทียม เจียว'}</h1>
      <p className="mt-1 text-sm text-slate-400">{profile.email || 'krathiam@email.com'}</p>
    </section>
  )
}
