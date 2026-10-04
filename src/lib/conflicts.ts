import type { Occurrence, Rule } from '../types'
import { addDays } from './dates'
import { occurrencesInRange } from './occurrences'

const HORIZON = 56 // days a weekly candidate is checked ahead

/** First existing session overlapping the candidate rule, or null. `rules` should exclude the rule being edited. */
export function findConflict(rules: Rule[], cand: Rule): Occurrence | null {
  const last = cand.kind === 'once' ? cand.from : addDays(cand.from, HORIZON)
  const mine = occurrencesInRange([cand], cand.from, last)
  const others = occurrencesInRange(rules, cand.from, last)
  for (const a of mine)
    for (const b of others)
      if (a.date === b.date && a.start < b.end && b.start < a.end) return b
  return null
}
