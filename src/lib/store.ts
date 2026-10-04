import type { Course, Log, Override, Rule, State, StudyType, Timer } from '../types'
import { addDays, iso } from './dates'

const KEY = 'hosha:v1'
export const initial: State = { v: 1, courses: [], rules: [], logs: [], timer: null, alarmLead: 10 }

export function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (s && s.v === 1) return { ...initial, ...s }
  } catch {
    /* corrupt or blocked storage → start empty */
  }
  return initial
}
export function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* quota/blocked: app still works in memory */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export type Action =
  | { t: 'course/save'; course: Course }
  | { t: 'course/delete'; id: string }
  | { t: 'rule/add'; rule: Rule }
  | { t: 'rule/editOne'; id: string; date: string; start: string; end: string }
  | { t: 'rule/editFrom'; id: string; date: string; patch: Partial<Pick<Rule, 'courseId' | 'start' | 'end' | 'type'>> }
  | { t: 'rule/deleteOne'; id: string; date: string }
  | { t: 'rule/deleteFrom'; id: string; date: string }
  | { t: 'timer/start'; courseId: string; type: StudyType; ruleId?: string; date?: string }
  | { t: 'timer/pause' }
  | { t: 'timer/resume' }
  | { t: 'timer/cancel' }
  | { t: 'timer/finish' }
  | { t: 'alarm'; lead: number }

export const elapsedMs = (t: Timer, now = Date.now()) => t.accMs + (t.status === 'running' ? now - t.startedAt : 0)

export function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'course/save': {
      const has = s.courses.some((c) => c.id === a.course.id)
      return { ...s, courses: has ? s.courses.map((c) => (c.id === a.course.id ? a.course : c)) : [...s.courses, a.course] }
    }
    case 'course/delete':
      // logs are history: kept (they carry a name/color snapshot)
      return {
        ...s,
        courses: s.courses.filter((c) => c.id !== a.id),
        rules: s.rules.filter((r) => r.courseId !== a.id),
        timer: s.timer?.courseId === a.id ? null : s.timer,
      }
    case 'rule/add':
      return { ...s, rules: [...s.rules, a.rule] }
    case 'rule/editOne':
      return {
        ...s,
        rules: s.rules.map((r) => {
          if (r.id !== a.id) return r
          return r.kind === 'once'
            ? { ...r, start: a.start, end: a.end }
            : { ...r, overrides: { ...r.overrides, [a.date]: { start: a.start, end: a.end } } }
        }),
      }
    case 'rule/editFrom': {
      const r = s.rules.find((x) => x.id === a.id)
      if (!r) return s
      if (r.kind === 'once' || a.date <= r.from)
        return { ...s, rules: s.rules.map((x) => (x.id === a.id ? { ...x, ...a.patch } : x)) }
      const carried: Record<string, Override> = {}
      for (const [d, o] of Object.entries(r.overrides)) if (d >= a.date) carried[d] = o
      const closed = { ...r, until: addDays(a.date, -1) } // past stays untouched
      const next: Rule = { ...r, ...a.patch, id: uid(), from: a.date, overrides: carried }
      return { ...s, rules: s.rules.map((x) => (x.id === a.id ? closed : x)).concat(next) }
    }
    case 'rule/deleteOne':
      return {
        ...s,
        rules: s.rules.flatMap((r) => {
          if (r.id !== a.id) return [r]
          if (r.kind === 'once') return []
          return [{ ...r, overrides: { ...r.overrides, [a.date]: 'deleted' as const } }]
        }),
      }
    case 'rule/deleteFrom':
      return {
        ...s,
        rules: s.rules.flatMap((r) => {
          if (r.id !== a.id) return [r]
          if (r.kind === 'once' || a.date <= r.from) return []
          return [{ ...r, until: addDays(a.date, -1) }]
        }),
      }
    case 'timer/start':
      return {
        ...s,
        timer: { courseId: a.courseId, type: a.type, ruleId: a.ruleId, date: a.date, status: 'running', startedAt: Date.now(), accMs: 0 },
      }
    case 'timer/pause':
      return s.timer?.status === 'running'
        ? { ...s, timer: { ...s.timer, status: 'paused', accMs: elapsedMs(s.timer), startedAt: 0 } }
        : s
    case 'timer/resume':
      return s.timer?.status === 'paused' ? { ...s, timer: { ...s.timer, status: 'running', startedAt: Date.now() } } : s
    case 'timer/cancel':
      return { ...s, timer: null }
    case 'timer/finish': {
      const t = s.timer
      if (!t) return s
      const c = s.courses.find((x) => x.id === t.courseId)
      const ms = elapsedMs(t)
      const log: Log = {
        id: uid(),
        courseId: t.courseId,
        name: c?.name ?? '—',
        color: c?.color ?? '#9ca3af',
        type: t.type,
        date: t.date ?? iso(new Date(Date.now() - ms)),
        startTs: Date.now() - ms,
        durationSec: Math.round(ms / 1000),
        ruleId: t.ruleId,
      }
      return { ...s, timer: null, logs: log.durationSec > 0 ? [...s.logs, log] : s.logs }
    }
    case 'alarm':
      return { ...s, alarmLead: a.lead }
  }
}
