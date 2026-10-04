import { describe, expect, it } from 'vitest'
import type { Rule, State } from '../types'
import { findConflict } from './conflicts'
import { fmtJ, fromJ, toJ, weekdayOf, weekStart } from './dates'
import { occurrencesInRange } from './occurrences'
import { initial, reducer } from './store'

const rule = (o: Partial<Rule> = {}): Rule => ({
  id: 'r1', courseId: 'c1', kind: 'weekly', weekday: 1, start: '16:30', end: '17:30',
  type: 'essay', from: '2026-10-04', overrides: {}, ...o,
})
const withRule = (r: Rule): State => ({ ...initial, courses: [{ id: 'c1', name: 'علوم', color: '#667eea' }], rules: [r] })

describe('dates', () => {
  it('۱۵ مهر ۱۴۰۵ ↔ ISO', () => {
    expect(fromJ(1405, 7, 15)).toBe('2026-10-07')
    expect(toJ('2026-10-07')).toEqual({ jy: 1405, jm: 7, jd: 15 })
    expect(fmtJ('2026-10-07')).toBe('۱۵ مهر ۱۴۰۵')
  })
  it('هفته از شنبه شروع می‌شود', () => {
    expect(weekdayOf('2026-10-03')).toBe(0) // شنبه ۱۱ مهر
    expect(weekStart('2026-10-07')).toBe('2026-10-03')
  })
})

describe('occurrences & edits', () => {
  it('یکشنبه‌ها تکرار می‌شود', () => {
    expect(occurrencesInRange([rule()], '2026-10-04', '2026-10-25').map((o) => o.date)).toEqual([
      '2026-10-04', '2026-10-11', '2026-10-18', '2026-10-25',
    ])
  })
  it('ویرایش فقط یک جلسه بقیه را دست‌نخورده می‌گذارد', () => {
    const s = reducer(withRule(rule()), { t: 'rule/editOne', id: 'r1', date: '2026-10-11', start: '17:30', end: '18:30' })
    const o = occurrencesInRange(s.rules, '2026-10-04', '2026-10-18')
    expect(o.map((x) => x.start)).toEqual(['16:30', '17:30', '16:30'])
  })
  it('ویرایش از این تاریخ به بعد، گذشته را عوض نمی‌کند', () => {
    const s = reducer(withRule(rule()), { t: 'rule/editFrom', id: 'r1', date: '2026-10-11', patch: { start: '18:00', end: '19:00' } })
    const o = occurrencesInRange(s.rules, '2026-10-04', '2026-10-18')
    expect(o.map((x) => x.start)).toEqual(['16:30', '18:00', '18:00'])
  })
  it('حذف یک جلسه و حذف از این تاریخ به بعد', () => {
    let s = reducer(withRule(rule()), { t: 'rule/deleteOne', id: 'r1', date: '2026-10-11' })
    expect(occurrencesInRange(s.rules, '2026-10-04', '2026-10-18').length).toBe(2)
    s = reducer(s, { t: 'rule/deleteFrom', id: 'r1', date: '2026-10-18' })
    expect(occurrencesInRange(s.rules, '2026-10-04', '2026-10-25').map((o) => o.date)).toEqual(['2026-10-04'])
  })
})

describe('conflicts', () => {
  it('هم‌پوشانی را پیدا می‌کند و مجاورت را نه', () => {
    const base = [rule({ start: '16:00', end: '17:00' })]
    const cand = (start: string, end: string) => rule({ id: 'n', courseId: 'c2', start, end })
    expect(findConflict(base, cand('16:30', '17:30'))).not.toBeNull()
    expect(findConflict(base, cand('17:00', '18:00'))).toBeNull()
    expect(findConflict(base, cand('16:30', '17:30', ))?.ruleId).toBe('r1')
  })
})

describe('timer', () => {
  it('پایان جلسه Log می‌سازد و تاریخچه با ویرایش برنامه عوض نمی‌شود', () => {
    let s = withRule(rule())
    s = reducer(s, { t: 'timer/start', courseId: 'c1', type: 'test', ruleId: 'r1', date: '2026-10-04' })
    s = { ...s, timer: { ...s.timer!, startedAt: Date.now() - 900_000 } }
    s = reducer(s, { t: 'timer/finish' })
    expect(s.logs[0].durationSec).toBeGreaterThanOrEqual(899)
    s = reducer(s, { t: 'rule/deleteFrom', id: 'r1', date: '2026-10-04' })
    expect(s.logs.length).toBe(1)
  })
})
