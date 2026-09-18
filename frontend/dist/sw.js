self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/notifications'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client)
      if (existing) {
        existing.navigate(target)
        return existing.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})

// Reserved for real Web Push events once a VAPID endpoint is connected.
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Pet Shop', body: event.data.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Pet Shop', {
      body: data.body || data.detail || '',
      icon: data.icon || '/favicon.ico',
      data: { url: data.url || '/notifications' },
    }),
  )
})
