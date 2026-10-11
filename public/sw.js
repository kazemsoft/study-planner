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
  const isPage = req.mode === 'navigate'
  const save = (key, res) => {
    // only complete, successful replies; never an HTML fallback standing in for a missing file
    const type = res.headers.get('content-type') || ''
    if (res.status === 200 && (isPage || !type.includes('text/html'))) caches.open(CACHE).then((c) => c.put(key, res.clone())).catch(() => {})
    return res
  }
  if (isPage) {
    e.respondWith(
      new Promise((resolve) => {
        const fallback = () => caches.match('/').then((r) => r || Response.error())
        const timer = setTimeout(() => fallback().then(resolve), 4000) // slow network: use the saved copy
        fetch(req).then((res) => (clearTimeout(timer), resolve(save('/', res)))).catch(() => (clearTimeout(timer), fallback().then(resolve)))
      }),
    )
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res))))
})
