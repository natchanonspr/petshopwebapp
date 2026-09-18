import { playNotificationSound } from './notificationSound.js'

const STORAGE_KEY = 'petshop.notifications.v1'
const EVENT_NAME = 'petshop:notifications'

function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function readStored() {
  if (!hasStorage()) return []
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function save(items) {
  if (!hasStorage()) return items
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }))
  return items
}

export function getNotifications(seed = [], audience = null) {
  const stored = readStored()
  const visible = audience ? stored.filter((item) => item.audience === audience) : stored
  if (visible.length || stored.length) return visible
  if (!seed.length) return []
  const seeded = audience ? seed.map((item) => ({ ...item, audience })) : seed
  return save(seeded)
}

export function getUnreadCount(audience = null) {
  return getNotifications([], audience).filter((item) => item.unread).length
}

export function subscribeNotifications(listener, audience = null) {
  if (typeof window === 'undefined') return () => {}
  const visible = (items) => audience ? items.filter((item) => item.audience === audience) : items
  const handler = (event) => listener(visible(event.detail || readStored()))
  const storageHandler = (event) => {
    if (event.key === STORAGE_KEY) listener(visible(readStored()))
  }
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', storageHandler)
  listener(visible(readStored()))
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', storageHandler)
  }
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isStandalonePWA() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function notificationPermissionStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'

  // iPhone/iPad only exposes Web Push notifications to Home Screen web apps.
  // Calling requestPermission from a normal Safari tab is not a supported path.
  if (isIOS() && !isStandalonePWA()) return 'ios-home-screen-required'

  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission || 'denied'
  }
}

async function showBrowserNotification(item) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(item.title, {
        body: item.detail,
        tag: `petshop-${item.id}`,
        icon: '/favicon.ico',
        data: { url: '/notifications' },
      })
      return
    } catch {}
  }

  if (!isIOS()) {
    const notification = new Notification(item.title, {
      body: item.detail,
      tag: `petshop-${item.id}`,
      icon: '/favicon.ico',
    })
    notification.onclick = () => {
      window.focus()
      window.location.href = '/notifications'
      notification.close()
    }
  }
}

export function addNotification(notification) {
  const item = {
    id: notification.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: notification.type ?? 'system',
    icon: notification.icon ?? 'fa-bell',
    title: notification.title ?? 'มีการแจ้งเตือนใหม่',
    detail: notification.detail ?? '',
    time: notification.time ?? 'เมื่อสักครู่นี้',
    unread: notification.unread ?? true,
    ...(notification.orderId != null ? { orderId: notification.orderId } : {}),
    ...(notification.customerId != null ? { customerId: notification.customerId } : {}),
    ...(notification.audience ? { audience: notification.audience } : {}),
    ...(notification.meta && typeof notification.meta === 'object' ? { meta: notification.meta } : {}),
  }

  const items = [item, ...readStored().filter((existing) => existing.id !== item.id)].slice(0, 100)
  save(items)
  if (notification.sound !== false) void playNotificationSound()
  if (notification.notifyBrowser !== false) showBrowserNotification(item)
  return item
}

export function markNotificationRead(id) {
  save(readStored().map((item) => item.id === id ? { ...item, unread: false } : item))
}

export function markAllNotificationsRead(audience = null) {
  save(readStored().map((item) => !audience || item.audience === audience ? { ...item, unread: false } : item))
}

export function removeNotification(id) {
  save(readStored().filter((item) => item.id !== id))
}

export function clearNotifications() {
  save([])
}

if (typeof window !== 'undefined') {
  window.petshopNotify = addNotification
}
