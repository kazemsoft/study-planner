let reg: ServiceWorkerRegistration | undefined
let listener: (() => void) | undefined

/** Called when a new version has been downloaded and is waiting for the user's OK. */
export const onUpdateReady = (cb: () => void) => {
  listener = cb
  if (reg?.waiting && navigator.serviceWorker.controller) cb()
}

/** Activate the waiting version; the page reloads once it takes over. */
export const applyUpdate = () => reg?.waiting?.postMessage('SKIP_WAITING')

export function registerSW() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  window.addEventListener('load', async () => {
    try {
      reg = await navigator.serviceWorker.register('/sw.js')
    } catch {
      return // offline support is optional; the app works without it
    }
    const check = () => reg?.update().catch(() => {})
    const watch = (w: ServiceWorker | null) =>
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) listener?.()
      })
    watch(reg.installing)
    reg.addEventListener('updatefound', () => watch(reg!.installing))
    if (reg.waiting && navigator.serviceWorker.controller) listener?.()
    setInterval(check, 30 * 60_000)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())

    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded || !navigator.serviceWorker.controller) return
      reloaded = true
      location.reload()
    })
  })
}
