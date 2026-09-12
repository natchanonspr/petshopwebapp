import { useEffect, useState } from 'react'
import { getUnreadCount, subscribeNotifications } from '../../lib/notifications.js'

export default function NotificationBadge({ children, count }) {
  const [unreadCount, setUnreadCount] = useState(() => count ?? getUnreadCount('customer'))

  useEffect(() => {
    if (count !== undefined) return
    return subscribeNotifications(() => setUnreadCount(getUnreadCount('customer')), 'customer')
  }, [count])

  const visibleCount = count ?? unreadCount
  if (!visibleCount) return children

  return (
    <span className="relative inline-grid place-items-center">
      {children}
      <span
        className="absolute -right-3.5 -top-3.5 z-30 grid min-w-[17px] h-[17px] place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white"
        aria-label={`${visibleCount} การแจ้งเตือน`}
      >
        {visibleCount > 99 ? '99+' : visibleCount}
      </span>
    </span>
  )
}
