// Revival One service worker: makes the app installable and keeps it opening
// when the connection drops. Pages are network-first (fresh when online, the
// cached shell when offline); built assets and icons are cache-first; the
// Bible API is stale-while-revalidate so chapters you've read open offline.
// API calls and Supabase (accounts, posts, chat) always go to the network.
const VERSION = 'revival-v1'
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
