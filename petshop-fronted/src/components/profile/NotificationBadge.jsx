import { useEffect, useState } from 'react'
import { getUnreadNotificationCount } from '../../api/notifications.js'

export default function NotificationBadge({
  children,
  count,
}) {
  const [unreadCount, setUnreadCount] = useState(
    count ?? 0
  )

  useEffect(() => {
    if (count !== undefined) {
      setUnreadCount(count)
      return
    }

    let active = true

    const loadUnreadCount = async () => {
      try {
        const unread = await getUnreadNotificationCount()

        if (active) {
          setUnreadCount(unread)
        }
      } catch (error) {
        console.error(
          'Load unread notification count error:',
          error
        )

        if (active) {
          setUnreadCount(0)
        }
      }
    }

    loadUnreadCount()

    return () => {
      active = false
    }
  }, [count])

  const visibleCount =
    count !== undefined
      ? count
      : unreadCount

  if (!visibleCount) {
    return children
  }

  return (
    <span className="relative inline-grid place-items-center">
      {children}

      <span
        className="absolute -right-3.5 -top-3.5 z-30 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white"
        aria-label={`${visibleCount} การแจ้งเตือน`}
      >
        {visibleCount > 99
          ? '99+'
          : visibleCount}
      </span>
    </span>
  )
}