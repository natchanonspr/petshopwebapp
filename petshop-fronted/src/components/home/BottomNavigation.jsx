import { NavLink } from 'react-router-dom'

const items = [
  ['/home', 'fa-house', 'หน้าแรก'],
  ['/products', 'fa-store', 'ร้านค้า'],
  ['/recommendation', 'fa-wand-magic-sparkles', 'AI'],
  ['/orders', 'fa-clipboard-list', 'ประวัติ'],
  ['/profile', 'fa-user', 'โปรไฟล์'],
]

export default function BottomNavigation() {
  return (
    <nav
      aria-label="เมนูหลัก"
      className="relative z-30 mx-3 mb-3 shrink-0 rounded-[28px] border border-slate-100 bg-white/95 px-2 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md"
    >
      <div className="flex h-[66px] items-center justify-around gap-1">
        {items.map(([to, icon, label]) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `group flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 transition-all duration-200 active:scale-90 ${
                isActive ? 'text-orange-500' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid size-10 place-items-center rounded-2xl transition-all duration-200 group-hover:-translate-y-1 group-hover:scale-110 ${
                    isActive
                      ? 'bg-orange-50 text-orange-500 shadow-sm'
                      : to === '/recommendation'
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-transparent text-slate-700'
                  } ${to === '/recommendation' ? 'size-12 rounded-full' : ''}`}
                >
                  <i className={`fa-solid ${icon} ${to === '/recommendation' ? 'text-[21px]' : 'text-[19px]'}`} />
                </span>
                <small
                  className={`text-[10px] leading-none transition-all duration-200 ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {label}
                </small>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
