import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NotificationBadge from './NotificationBadge'

const sections = [
  {
    title: 'บัญชีของฉัน',
    items: [
      ['fa-user-pen', 'แก้ไขข้อมูลส่วนตัว', 'ชื่อ, เบอร์, อีเมล', '/profile/edit'],
      ['fa-location-dot', 'ที่อยู่จัดส่ง', '', '/profile/addresses'],
      ['fa-credit-card', 'วิธีชำระเงิน', 'จัดการช่องทางการชำระเงิน', '/profile/payment'],
    ],
  },
  {
    title: 'การสั่งซื้อ',
    items: [
      ['fa-clock-rotate-left', 'ประวัติการสั่งซื้อ', 'ดูคำสั่งซื้อทั้งหมด', '/orders'],
      ['fa-heart', 'รายการโปรด', 'สินค้าที่คุณถูกใจ', '/profile/favorites'],
      ['fa-ticket', 'คูปองและส่วนลด', 'คูปองที่พร้อมใช้งาน', '/profile/coupons'],
    ],
  },
  {
    title: 'อื่นๆ',
    items: [
      ['fa-bell', 'การแจ้งเตือน', 'การแจ้งเตือนและอัปเดต', '/notifications'],
      ['fa-circle-question', 'ช่วยเหลือ', 'คำถามที่พบบ่อยและการติดต่อ', '/profile/help'],
    ],
  },
]

export default function ProfileMenuSection() {
  const navigate = useNavigate()
  const [addressCount, setAddressCount] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('petshop_addresses') || '[]')
      return Array.isArray(saved) ? saved.length : 0
    } catch {
      return 0
    }
  })

  useEffect(() => {
    const syncAddresses = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('petshop_addresses') || '[]')
        setAddressCount(Array.isArray(saved) ? saved.length : 0)
      } catch {
        setAddressCount(0)
      }
    }
    window.addEventListener('petshop-address-updated', syncAddresses)
    window.addEventListener('storage', syncAddresses)
    return () => {
      window.removeEventListener('petshop-address-updated', syncAddresses)
      window.removeEventListener('storage', syncAddresses)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('petshop_profile')
    localStorage.removeItem('petshop_selected_coupon')
    localStorage.removeItem('petshop_user_auth')
    localStorage.removeItem('petshop_user')
    localStorage.removeItem('petshop_token')
    try {
      if (window.liff?.isLoggedIn?.()) window.liff.logout()
    } catch {
      // Mock logout should still work if LIFF is unavailable.
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative z-10 mt-1 space-y-6 px-5 pb-5">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 text-base font-bold text-slate-800">{section.title}</h2>
          <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.05)]">
            {section.items.map(([icon, title, subtitle, to], index) => {
              const itemSubtitle = title === 'ที่อยู่จัดส่ง'
                ? (addressCount > 0 ? `${addressCount} ที่อยู่ที่บันทึกไว้` : 'ยังไม่มีที่อยู่ที่บันทึกไว้')
                : subtitle
              const content = (
                <>
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                    {icon === 'fa-bell' ? (
                      <NotificationBadge>
                        <i className={`fa-solid ${icon} text-[17px]`} />
                      </NotificationBadge>
                    ) : (
                      <i className={`fa-solid ${icon} text-[17px]`} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-700">{title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-400">{itemSubtitle}</span>
                  </span>
                  <i className="fa-solid fa-chevron-right shrink-0 text-xs text-slate-300" />
                </>
              )

              const className = `relative z-10 flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-orange-50 active:bg-slate-50 ${index ? 'border-t border-slate-100' : ''}`

              return (
                <Link key={title} to={to} className={className} aria-label={title}>
                  {content}
                </Link>
              )
            })}
          </div>
        </section>
      ))}

      <button
        type="button"
        onClick={logout}
        className="relative z-10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border border-red-100 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 py-3.5 text-sm font-semibold text-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition-transform active:scale-[.99]"
      >
        <i className="fa-solid fa-right-from-bracket" />
        ออกจากระบบ
      </button>
    </div>
  )
}
