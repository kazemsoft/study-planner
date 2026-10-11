// Offline support: pages network-first (fall back to cache), other files cache-first.
// __BUILD__ is replaced at build time, so every release gives the browser a new file and triggers an update
const CACHE = 'hosha-__BUILD__'

// Save the page plus every script, style and font it needs, so the very first visit already works offline.
async function precache() {
  const cache = await caches.open(CACHE)
  const html = await (await fetch('/', { cache: 'reload' })).text()
  const urls = new Set(['/', '/manifest.webmanifest'])
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) urls.add(m[1])
  for (const u of [...urls].filter((u) => u.endsWith('.css'))) {
    const css = await (await fetch(u)).text()
    for (const m of css.matchAll(/url\(([^)]+)\)/g)) {
      const f = m[1].replace(/["']/g, '')
      if (!f.startsWith('data:')) urls.add(new URL(f, location.origin + u).pathname)
    }
  }
  await cache.addAll([...urls])
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache())
  // then wait for the user's OK (message below) before replacing the running version
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
    if (res.status === 200 && (isPage || !type.includes('text/html'))) {
      const copy = res.clone() // must be cloned now, before the page starts reading the reply
      caches.open(CACHE).then((c) => c.put(key, copy)).catch(() => {})
    }
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
