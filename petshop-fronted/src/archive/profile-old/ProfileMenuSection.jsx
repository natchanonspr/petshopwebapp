const groups = [
  {
    title: 'บัญชีของฉัน',
    items: [
      ['แก้ไขข้อมูลส่วนตัว', 'ชื่อ, เบอร์, อีเมล', 'fa-user-pen'],
      ['ที่อยู่จัดส่ง', 'จัดการที่อยู่สำหรับจัดส่ง', 'fa-location-dot'],
      ['วิธีชำระเงิน', 'จัดการช่องทางการชำระเงิน', 'fa-credit-card'],
    ],
  },
  {
    title: 'การสั่งซื้อ',
    items: [
      ['ประวัติการสั่งซื้อ', 'ดูคำสั่งซื้อทั้งหมด', 'fa-clock-rotate-left', '/orders'],
      ['รายการโปรด', 'สินค้าที่บันทึกไว้', 'fa-heart'],
      ['คูปองและส่วนลด', 'คูปองที่พร้อมใช้งาน', 'fa-ticket'],
    ],
  },
  {
    title: 'อื่นๆ',
    items: [
      ['การแจ้งเตือน', 'จัดการการแจ้งเตือน', 'fa-bell'],
      ['ช่วยเหลือ / FAQ', 'คำถามที่พบบ่อย', 'fa-circle-question'],
    ],
  },
]

import { Link } from 'react-router-dom'

function MenuGroup({ title, items }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[13px] font-bold text-gray-900">{title}</h2>
      <div className="overflow-hidden rounded-[22px] bg-white shadow-sm">
        {items.map(([name, subtitle, icon, to], index) => {
          const content = (
            <>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-500">
                <i className={`fa-solid ${icon} text-sm`} />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <strong className="block text-[11px] font-semibold text-gray-800">{name}</strong>
                <small className="mt-0.5 block truncate text-[9px] text-gray-400">{subtitle}</small>
              </span>
              <i className="fa-solid fa-chevron-right text-[9px] text-gray-300" />
            </>
          )
          const className = `flex min-h-[58px] w-full items-center gap-3 px-3 ${index < items.length - 1 ? 'border-b border-gray-100' : ''}`
          return to ? <Link key={name} to={to} className={className}>{content}</Link> : <button key={name} type="button" className={className}>{content}</button>
        })}
      </div>
    </section>
  )
}

export default function ProfileMenuSection() {
  return <div className="space-y-4">{groups.map((group) => <MenuGroup key={group.title} {...group} />)}</div>
}
