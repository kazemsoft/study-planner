import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { addDays, fa, fromMin, iso, toMin, today } from './lib/dates'
import { occurrencesInRange } from './lib/occurrences'
import { load, reducer, save, type Action } from './lib/store'
import type { State } from './types'

export type Tab = 'home' | 'schedule' | 'courses' | 'timer' | 'stats'
export type EditTarget = { ruleId: string; date: string; scope: 'one' | 'from' }
type Ctx = {
  s: State
  dispatch: (a: Action) => void
  tab: Tab
  go: (t: Tab) => void
  adding: false | { edit?: EditTarget; date?: string }
  openAdd: (o?: { edit?: EditTarget; date?: string }) => void
  closeAdd: () => void
  toast: (msg: string, err?: boolean) => void
}
const C = createContext<Ctx>(null!)
export const useApp = () => useContext(C)

export function Provider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, undefined, load)
  const [tab, go] = useState<Tab>('home')
  const [adding, setAdding] = useState<Ctx['adding']>(false)
  const [msg, setMsg] = useState<{ text: string; err: boolean } | null>(null)
  const timer = useRef<number>(0)

  useEffect(() => save(s), [s])

  const toast = useCallback((text: string, err = false) => {
    setMsg({ text, err })
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 3500)
  }, [])

  // reminders: only while the app is open (no service worker in MVP)
  const notified = useRef(new Set<string>())
  useEffect(() => {
    if (!s.alarmLead) return
    const tick = () => {
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      for (const o of occurrencesInRange(s.rules, today(), today())) {
        const left = toMin(o.start) - nowMin
        const key = o.ruleId + o.date + o.start
        if (left < 0 || left > s.alarmLead || notified.current.has(key)) continue
        notified.current.add(key)
        const name = s.courses.find((c) => c.id === o.courseId)?.name ?? ''
        const text = `${name} تا ${fa(left)} دقیقه‌ی دیگر (${fa(fromMin(toMin(o.start)))})`
        toast('⏰ ' + text)
        if ('Notification' in window && Notification.permission === 'granted') new Notification('برنامه‌ریز هوشا', { body: text })
      }
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [s.rules, s.courses, s.alarmLead, toast])

  const v = useMemo<Ctx>(
    () => ({ s, dispatch, tab, go, adding, openAdd: (o = {}) => setAdding(o), closeAdd: () => setAdding(false), toast }),
    [s, tab, adding, toast],
  )
  return (
    <C.Provider value={v}>
      {children}
      {msg && (
        <div className={'toast' + (msg.err ? ' err' : '')} role="status">
          {msg.text}
        </div>
      )}
    </C.Provider>
  )
}

export const weekOf = (offset: number) => {
  const ws = addDays(iso(new Date()), -((new Date().getDay() + 1) % 7) + offset * 7)
  return { from: ws, to: addDays(ws, 6) }
}

export function useNow(ms = 1000) {
  const [n, setN] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setN(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return n
}
