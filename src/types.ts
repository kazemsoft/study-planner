export type StudyType = 'essay' | 'test'
export type Course = { id: string; name: string; color: string }
export type Override = { start: string; end: string } | 'deleted'
export type Rule = {
  id: string
  courseId: string
  kind: 'weekly' | 'once'
  weekday?: number // 0 = شنبه … 6 = جمعه
  date?: string // ISO, kind=once
  start: string // HH:MM
  end: string
  type: StudyType
  from: string // ISO, first valid date
  until?: string // ISO, last valid date (closed when edited "from here on")
  overrides: Record<string, Override>
}
export type Log = {
  id: string
  courseId: string
  name: string // snapshot: survives course deletion
  color: string
  type: StudyType
  date: string
  startTs: number
  durationSec: number
  ruleId?: string
}
export type Timer = {
  courseId: string
  ruleId?: string
  date?: string
  type: StudyType
  status: 'running' | 'paused'
  startedAt: number // ms; valid while running
  accMs: number
}
export type State = {
  v: 1
  courses: Course[]
  rules: Rule[]
  logs: Log[]
  timer: Timer | null
  alarmLead: number // minutes, 0 = off
}
export type Occurrence = {
  ruleId: string
  courseId: string
  date: string
  start: string
  end: string
  type: StudyType
}
