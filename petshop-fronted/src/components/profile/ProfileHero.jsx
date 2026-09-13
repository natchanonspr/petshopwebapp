import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NotificationBadge from './NotificationBadge.jsx'
import { getProfile } from '../../api/user.js'

export default function ProfileHero() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getProfile()

      setProfile(data || {})
    } catch (err) {
      console.error('load profile hero error:', err)
      setError(err.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()

    const refresh = () => {
      loadProfile()
    }

    window.addEventListener('petshop-profile-updated', refresh)

    return () => {
      window.removeEventListener('petshop-profile-updated', refresh)
    }
  }, [])

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

      <button
        type="button"
        className="group relative mx-auto block size-[132px] overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-yellow-200 to-orange-300 text-6xl shadow-lg"
        aria-label="รูปโปรไฟล์"
      >
        {loading ? (
          <i className="fa-solid fa-spinner fa-spin text-2xl text-orange-500" />
        ) : profile?.picture_url ? (
          <img
            src={profile.picture_url}
            alt="รูปโปรไฟล์"
            className="size-full object-cover"
          />
        ) : (
          '👩🏻'
        )}
      </button>

      {error && (
        <p className="mx-auto mt-2 max-w-[280px] text-xs font-bold text-red-500">
          {error}
        </p>
      )}

      <h1 className="mt-3 text-[24px] font-bold tracking-tight text-slate-800">
        {loading
          ? 'กำลังโหลด...'
          : profile?.username || 'ยังไม่มีชื่อ'}
      </h1>

    </section>
  )
}