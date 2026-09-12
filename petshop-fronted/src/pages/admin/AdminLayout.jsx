import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getUnreadCount, subscribeNotifications } from '../../lib/notifications.js'
import { loadAdminData } from '../../admin/data.js'
import { fuzzyProductScore } from '../../lib/fuzzySearch.js'

const PROFILE_KEY = 'petshop_profile'

const menus = [
  { title: 'MENU', items: [
    { to: '/home/admin', icon: 'fa-chart-pie', label: 'Dashboard', end: true },
    { to: '/home/admin/orders', icon: 'fa-cart-shopping', label: 'คำสั่งซื้อ' },
    { to: '/home/admin/products', icon: 'fa-box-open', label: 'สินค้า' },
    { to: '/home/admin/customers', icon: 'fa-users', label: 'ผู้ใช้งาน' },
  ]},
  { title: 'MANAGEMENT', items: [
    { to: '/home/admin/coupons', icon: 'fa-ticket', label: 'โปรโมชั่น' },
    { to: '/home/admin/notifications', icon: 'fa-bell', label: 'การแจ้งเตือน' },
    { to: '/home/admin/reports', icon: 'fa-chart-line', label: 'รายงานและสถิติ' },
    { to: '/home/admin/settings', icon: 'fa-wand-magic-sparkles', label: 'จัดการ AI' },
    { to: '/home/admin/store', icon: 'fa-store', label: 'ข้อมูลร้านค้า' },
  ]},
]

const normalizeSearch = (value = '') => String(value).toLowerCase().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[^\p{L}\p{N}]+/gu, '')

function searchScore(query, value) {
  const q = normalizeSearch(query)
  const text = normalizeSearch(value)
  if (!q || !text) return 0
  if (text.includes(q)) return 1
  if (q.includes(text)) return text.length / q.length * 0.9
  let previous = Array.from({ length: text.length + 1 }, (_, i) => i)
  for (let i = 1; i <= q.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= text.length; j += 1) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (q[i - 1] === text[j - 1] ? 0 : 1))
    }
    previous = current
  }
  return 1 - previous[text.length] / Math.max(q.length, text.length)
}

function readProfile() {
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

function SidebarItem({ item, expanded, closeMobile }) {
  return <NavLink to={item.to} end={item.end} onClick={closeMobile} title={!expanded ? item.label : undefined}
    className={({ isActive }) => `group flex h-11 items-center rounded-xl px-3 transition-all ${expanded ? 'gap-3' : 'justify-center'} ${isActive ? 'bg-violet-50 text-violet-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-violet-600'}`}>
    <i className={`fa-solid ${item.icon} w-5 shrink-0 text-center text-sm`} />
    {expanded && <span className="whitespace-nowrap text-[13px] font-semibold">{item.label}</span>}
  </NavLink>
}

export default function AdminLayout() {
  const location = useLocation(); const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false); const [hovered, setHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false); const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState(() => readProfile())
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount('admin'))
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const expanded = !collapsed || hovered

  const searchResults = (() => {
    const query = normalizeSearch(search)
    if (query.length < 2) return []
    const data = loadAdminData()
    const results = [
      ...data.products.map(item => ({ type: 'สินค้า', icon: 'fa-box-open', title: item.name, meta: item.category, to: `/home/admin/products?search=${encodeURIComponent(item.name)}`, score: fuzzyProductScore(item, query) })),
      ...data.users.map(item => ({ type: 'ลูกค้า', icon: 'fa-user', title: item.name, meta: item.phone || item.email || 'ข้อมูลลูกค้า', to: `/home/admin/customers/${item.id}`, score: Math.max(searchScore(query, item.name), searchScore(query, item.phone), searchScore(query, item.email)) * 0.96 })),
      ...data.orders.map(item => ({ type: 'คำสั่งซื้อ', icon: 'fa-cart-shopping', title: item.id, meta: item.customer || item.status, to: `/home/admin/orders/${encodeURIComponent(item.id)}`, score: Math.max(searchScore(query, item.id), searchScore(query, item.customer)) * 0.94 })),
      ...data.coupons.map(item => ({ type: 'คูปอง', icon: 'fa-ticket', title: item.code, meta: `${item.type} ${item.value}`, to: '/home/admin/coupons', score: searchScore(query, item.code) * 0.9 })),
    ]
    return results.filter(item => item.score >= (query.length <= 3 ? 0.5 : 0.38)).sort((a, b) => b.score - a.score).slice(0, 7)
  })()

  const submitSearch = (result = searchResults[0]) => {
    if (!result) return
    setSearchOpen(false)
    setSearch('')
    navigate(result.to)
  }
  useEffect(() => setMobileOpen(false), [location.pathname])
  useEffect(() => {
    const refreshUnread = () => setUnreadCount(getUnreadCount('admin'))
    const unsubscribe = subscribeNotifications(() => refreshUnread(), 'admin')
    window.addEventListener('storage', refreshUnread)
    return () => {
      unsubscribe()
      window.removeEventListener('storage', refreshUnread)
    }
  }, [])
  useEffect(() => {
    const refreshProfile = () => setProfile(readProfile())
    window.addEventListener('storage', refreshProfile)
    window.addEventListener('petshop-profile-updated', refreshProfile)
    return () => {
      window.removeEventListener('storage', refreshProfile)
      window.removeEventListener('petshop-profile-updated', refreshProfile)
    }
  }, [])
  const logout = () => { localStorage.removeItem('petshop_admin_auth'); navigate('/home/admin/login', { replace: true }) }

  return <div className="admin-panel min-h-screen bg-[#f8f9fc] text-gray-900">
    <header className={`fixed inset-x-0 top-0 z-[60] h-[72px] border-b border-gray-100 bg-white/95 backdrop-blur transition-all duration-200 ${expanded ? 'lg:pl-[290px]' : 'lg:pl-[90px]'}`}>
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="grid size-10 place-items-center rounded-xl border border-gray-200 text-gray-500 lg:hidden"><i className="fa-solid fa-bars" /></button>
          <button onClick={() => setCollapsed(v => !v)} className="hidden size-10 place-items-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 lg:grid"><i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'} text-xs`} /></button>
          <div className="relative hidden sm:block w-[280px] md:w-[360px]">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"/>
            <input
              value={search}
              onChange={event => { setSearch(event.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={event => { if (event.key === 'Enter') submitSearch(); if (event.key === 'Escape') setSearchOpen(false) }}
              className="h-10 w-full rounded-xl bg-gray-50 pl-9 pr-9 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-violet-100"
              placeholder="ค้นหาในระบบ..."
              aria-label="ค้นหาในระบบ"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setSearchOpen(false) }} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-gray-400 hover:bg-gray-100" aria-label="ล้างการค้นหา"><i className="fa-solid fa-xmark text-[10px]"/></button>}
            {searchOpen && search.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-12 z-[100] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                {searchResults.length ? searchResults.map((result, index) => (
                  <button key={`${result.type}-${result.title}-${index}`} type="button" onClick={() => submitSearch(result)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-violet-50 active:bg-violet-100">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-500"><i className={`fa-solid ${result.icon} text-xs`}/></span>
                    <span className="min-w-0 flex-1"><b className="block truncate text-xs text-gray-800">{result.title}</b><small className="mt-0.5 block truncate text-[10px] text-gray-400">{result.type} · {result.meta}</small></span>
                    <i className="fa-solid fa-arrow-right text-[9px] text-gray-300"/>
                  </button>
                )) : <div className="px-4 py-5 text-center"><i className="fa-solid fa-magnifying-glass mb-2 text-gray-300"/><p className="m-0 text-xs font-semibold text-gray-500">ไม่พบข้อมูล</p><p className="m-0 mt-1 text-[10px] text-gray-400">ลองใช้คำค้นอื่นหรือสะกดให้ใกล้เคียงมากขึ้น</p></div>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/home/admin/notifications" className="relative grid size-10 place-items-center rounded-xl text-gray-500 hover:bg-gray-50"><i className="fa-regular fa-bell text-[15px]"/>{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 h-4 rounded-full bg-red-500 px-1 text-[9px] font-extrabold leading-4 text-white text-center ring-2 ring-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</NavLink>
          <div className="relative"><button onClick={() => setProfileOpen(v => !v)} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-gray-50"><span className="grid size-9 place-items-center rounded-full bg-violet-100 text-violet-600"><i className="fa-solid fa-user text-xs"/></span><span className="hidden text-left sm:block"><b className="block max-w-[150px] truncate text-xs">{profile.name || 'Admin'}</b><small className="block max-w-[150px] truncate text-[10px] text-gray-400">{profile.email || profile.phone || 'ผู้ดูแลระบบ'}</small></span><i className="fa-solid fa-chevron-down hidden text-[9px] text-gray-400 sm:block"/></button>
            {profileOpen && <div className="absolute right-0 top-12 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl"><div className="border-b border-gray-100 px-3 py-2"><div className="text-[11px] font-extrabold text-gray-900">{profile.name || 'Admin'}</div><div className="mt-0.5 truncate text-[10px] text-gray-400">{profile.email || profile.phone || 'บัญชีผู้ดูแลระบบ'}</div></div><button onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"><i className="fa-solid fa-right-from-bracket w-4"/> ออกจากระบบ</button></div>}
          </div>
        </div>
      </div>
    </header>
    {mobileOpen && <button onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู" className="fixed inset-0 z-[65] bg-black/30 lg:hidden"/>}
    <aside onMouseEnter={() => collapsed && setHovered(true)} onMouseLeave={() => setHovered(false)} className={`fixed inset-y-0 left-0 z-[70] border-r border-gray-100 bg-white transition-all duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${expanded ? 'w-[290px]' : 'w-[90px]'}`}>
      <div className={`flex h-[72px] items-center border-b border-gray-100 ${expanded ? 'px-6' : 'justify-center'}`}><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200"><i className="fa-solid fa-paw text-sm"/></div>{expanded && <div className="ml-3"><b className="block text-[15px]">Pet Shop</b><small className="text-[8px] font-bold tracking-[.18em] text-gray-400">ADMIN PANEL</small></div>}<button onClick={() => setMobileOpen(false)} className="ml-auto grid size-8 place-items-center text-gray-400 lg:hidden"><i className="fa-solid fa-xmark"/></button></div>
      <div className="h-[calc(100%-72px)] overflow-y-auto px-3 py-5">{menus.map(group => <div key={group.title} className="mb-6">{expanded && <p className="mb-2 px-3 text-[10px] font-bold tracking-wider text-gray-400">{group.title}</p>}<nav className="space-y-1">{group.items.map(item => <SidebarItem key={item.to} item={item} expanded={expanded} closeMobile={() => setMobileOpen(false)}/>)}</nav></div>)}</div>
    </aside>
    <main className={`min-h-screen pt-[72px] transition-all duration-200 ${expanded ? 'lg:pl-[290px]' : 'lg:pl-[90px]'}`}><div className="mx-auto max-w-[1600px] p-4 pb-24 md:p-6 md:pb-8"><Outlet/></div></main>
  </div>
}
