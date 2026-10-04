import type { Log } from '../types'
import { addDays } from './dates'

const within = (l: Log, from: string, to: string) => l.date >= from && l.date <= to

export const totalSec = (logs: Log[], from: string, to: string) =>
  logs.filter((l) => within(l, from, to)).reduce((s, l) => s + l.durationSec, 0)

/** 7 entries starting at `weekStartIso` (شنبه). */
export const perDay = (logs: Log[], weekStartIso: string) =>
  Array.from({ length: 7 }, (_, i) => totalSec(logs, addDays(weekStartIso, i), addDays(weekStartIso, i)))

export function perCourse(logs: Log[], from: string, to: string) {
  const m = new Map<string, { name: string; color: string; sec: number }>()
  for (const l of logs.filter((l) => within(l, from, to))) {
    const e = m.get(l.courseId) ?? { name: l.name, color: l.color, sec: 0 }
    e.sec += l.durationSec
    m.set(l.courseId, e)
  }
  const total = [...m.values()].reduce((s, e) => s + e.sec, 0)
  return [...m.entries()]
    .map(([courseId, e]) => ({ courseId, ...e, pct: total ? Math.round((e.sec / total) * 100) : 0 }))
    .sort((a, b) => b.sec - a.sec)
}
