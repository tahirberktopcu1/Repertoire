// Service Worker — Push Notifications

self.addEventListener('push', (event) => {
  let data = { title: 'Repertoire', body: 'Yeni bildirim', url: '/dashboard' }

  try {
    data = event.data.json()
  } catch {}

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
