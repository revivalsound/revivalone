// Revival Sound Tent service worker: makes the app installable and keeps it opening
// when the connection drops. Pages are network-first (fresh when online, the
// cached shell when offline); built assets and icons are cache-first; the
// Bible API is stale-while-revalidate so chapters you've read open offline.
// API calls and Supabase (accounts, posts, chat) always go to the network.
const VERSION = 'revival-v4'
const SHELL = ['/', '/home', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/assets/revival-flame-mark.png']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Pages: network first, fall back to the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => { const copy = response.clone(); caches.open(VERSION).then(cache => cache.put('/', copy)); return response })
        .catch(() => caches.match('/').then(hit => hit || caches.match('/home'))),
    )
    return
  }

  // The Bible text, notes and verse of the day.
  if (url.hostname === 'bible.helloao.org') {
    event.respondWith(caches.open(`${VERSION}-bible`).then(async cache => {
      const hit = await cache.match(request)
      const network = fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response }).catch(() => hit)
      return hit || network
    }))
    return
  }

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  // Built files have hashed names, so they never go stale.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(VERSION).then(cache => cache.put(request, copy)) }
      return response
    })))
  }
})

// Tapping a device notification opens (or focuses) the app at its link.
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const link = event.notification.data?.link || '/notifications'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const open = windows.find(client => new URL(client.url).origin === self.location.origin)
    if (open) { open.focus(); return open.navigate(link) }
    return self.clients.openWindow(link)
  }))
})

// A push from /api/push: show it, even when Revival Sound Tent is closed.
self.addEventListener('push', event => {
  let note = {}
  try { note = event.data ? event.data.json() : {} } catch { note = { title: event.data ? event.data.text() : 'Revival Sound Tent' } }
  event.waitUntil(self.registration.showNotification(note.title || 'Revival Sound Tent', {
    body: note.body || undefined,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag: note.id || undefined,
    renotify: Boolean(note.id),
    data: { link: note.link || '/notifications' },
  }))
})
