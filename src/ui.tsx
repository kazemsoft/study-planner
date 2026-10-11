import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

const P: Record<string, ReactNode> = {
  home: <><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></>,
  cal: <><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4M8 3v4M4 11h16" /></>,
  book: <><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /><path d="M3 6v13M12 6v13M21 6v13" /></>,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>,
  chart: <><path d="M3 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M9 8m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M15 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /></>,
  bell: <><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></>,
  refresh: <><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
  history: <><path d="M12 8v4l2 2" /><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /></>,
  right: <path d="M9 6l6 6l-6 6" />,
  left: <path d="M15 6l-6 6l6 6" />,
  x: <path d="M18 6l-12 12M6 6l12 12" />,
  play: <path d="M7 4v16l13 -8z" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>,
  alert: <><path d="M12 9v4M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.84 2.75" /></>,
}
export function Icon({ n, size = 22, sw = 1.75 }: { n: keyof typeof P; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[n]}
    </svg>
  )
}

export const cvar = (c: string) => ({ '--c': c }) as CSSProperties

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'

/** Dialog keyboard behaviour: focus moves in, Tab stays inside, Esc closes, focus returns to the opener. */
export function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const opener = document.activeElement as HTMLElement | null
    if (!el.contains(document.activeElement)) (el.querySelector<HTMLElement>('[autofocus],' + FOCUSABLE) ?? el).focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close.current()
      } else if (e.key === 'Tab') {
        const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null)
        if (!items.length) return e.preventDefault()
        const first = items[0], last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) (e.preventDefault(), last.focus())
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
      }
    }
    el.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('keydown', onKey)
      if (opener?.isConnected) opener.focus()
    }
  }, [])
  return ref
}

export function Sheet({ children, onClose, center, label }: { children: ReactNode; onClose: () => void; center?: boolean; label: string }) {
  const ref = useDialog(onClose)
  return (
    <div className={'scrim' + (center ? ' center' : '')} onClick={onClose}>
      <div ref={ref} tabIndex={-1} className="sheet" role="dialog" aria-modal aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function Confirm(p: { title: string; body: string; yes: string; no?: string; danger?: boolean; onYes: () => void; onNo: () => void }) {
  return (
    <Sheet center onClose={p.onNo} label={p.title}>
      <h3 className="section-title">{p.title}</h3>
      <p className="muted" style={{ fontSize: 14 }}>{p.body}</p>
      <div className="row" style={{ gap: 12 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={p.onNo}>{p.no ?? 'انصراف'}</button>
        <button className={'btn ' + (p.danger ? 'danger' : 'primary')} style={{ flex: 1 }} onClick={p.onYes}>{p.yes}</button>
      </div>
    </Sheet>
  )
}

export function Empty({ icon, title, hint, action }: { icon: keyof typeof P; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="art"><Icon n={icon} size={40} /></div>
      <strong style={{ color: 'var(--ink)', fontSize: 16 }}>{title}</strong>
      {hint && <span style={{ fontSize: 14 }}>{hint}</span>}
      {action}
    </div>
  )
}
