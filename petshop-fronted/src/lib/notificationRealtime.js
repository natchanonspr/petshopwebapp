import { addNotification } from './notifications.js'

const WS_PATH = '/petshop-notifications'
let socket = null
let reconnectTimer = null

function getUrl() {
  if (typeof window === 'undefined') return null
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Use the exact origin that served PetShop. This is important for the
  // Cloudflare Quick Tunnel: public HTTPS :443 is forwarded to local :5175.
  return `${protocol}//${window.location.host}${WS_PATH}`
}

export function connectNotificationRealtime() {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return () => {}
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return () => disconnectNotificationRealtime()

  const url = getUrl()
  try { socket = new WebSocket(url) } catch { return () => {} }

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      if (message?.type === 'notification' && message.notification) {
        addNotification({ ...message.notification, sound: true, notifyBrowser: true })
      }
    } catch {}
  }

  socket.onclose = () => {
    socket = null
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connectNotificationRealtime, 2500)
  }

  return () => disconnectNotificationRealtime()
}

export function disconnectNotificationRealtime() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = null
  if (socket) { socket.onclose = null; socket.close(); socket = null }
}

export function sendNotificationRealtime(notification) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false
  socket.send(JSON.stringify({ type: 'notification', notification }))
  return true
}
