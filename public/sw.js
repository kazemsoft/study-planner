// Offline support: pages network-first (fall back to cache), other files cache-first.
// __BUILD__ is replaced at build time, so every release gives the browser a new file and triggers an update
const CACHE = 'hosha-__BUILD__'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest'])))
  // wait for the user's OK (message below) before replacing the running version
})

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  const save = (res) => {
    if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()))
    return res
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(save).catch(() => caches.match('/')))
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(save)))
})
