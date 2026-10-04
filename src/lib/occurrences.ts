import type { Occurrence, Rule } from '../types'
import { addDays, weekdayOf } from './dates'

/** All sessions in [from, to] (inclusive ISO), with per-date overrides applied. */
export function occurrencesInRange(rules: Rule[], from: string, to: string): Occurrence[] {
  const out: Occurrence[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const r of rules) {
      if (d < r.from || (r.until && d > r.until)) continue
      if (r.kind === 'weekly' ? r.weekday !== weekdayOf(d) : r.date !== d) continue
      const o = r.overrides[d]
      if (o === 'deleted') continue
      out.push({
        ruleId: r.id,
        courseId: r.courseId,
        date: d,
        start: o ? o.start : r.start,
        end: o ? o.end : r.end,
        type: r.type,
      })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
}

