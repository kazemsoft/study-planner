import { useState } from 'react'
import { useApp, weekOf } from '../ctx'
import { fa, fmtHM, toMin } from '../lib/dates'
import { occurrencesInRange } from '../lib/occurrences'
import { uid } from '../lib/store'
import type { Course } from '../types'
import { Confirm, Empty, Icon, Sheet, cvar } from '../ui'

export const PALETTE: [string, string][] = [
  ['#667eea', 'نیلی'], ['#764ba2', 'بنفش'], ['#10b981', 'سبز'], ['#f59e0b', 'کهربایی'], ['#ef4444', 'قرمز'],
  ['#ec4899', 'صورتی'], ['#14b8a6', 'فیروزه‌ای'], ['#3b82f6', 'آبی'], ['#84cc16', 'سبز روشن'], ['#f97316', 'نارنجی'],
]
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const dist = (a: string, b: string) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]))

export default function Courses() {
  const { s, dispatch, toast } = useApp()
  const [form, setForm] = useState<Course | null>(null)
  const [del, setDel] = useState<Course | null>(null)
  const wk = weekOf(0)
  const occ = occurrencesInRange(s.rules, wk.from, wk.to)

  const meta = (c: Course) => {
    const mine = occ.filter((o) => o.courseId === c.id)
    if (!mine.length) return 'هنوز برنامه‌ای ندارد'
    const min = mine.reduce((t, o) => t + toMin(o.end) - toMin(o.start), 0)
    return `${fa(mine.length)} جلسه در هفته • ${fmtHM(min)} ساعت`
  }

  const other = form && s.courses.find((c) => c.id !== form.id && dist(c.color, form.color) < 60)
  const name = form?.name.trim() ?? ''
  const dup = form && s.courses.some((c) => c.id !== form.id && c.name.trim() === name)
  const bad = !name || !!other || !!dup

  return (
    <div className="screen">
      <header>
        <h1 className="page-title">درس‌های من</h1>
        <span className="muted">{fa(s.courses.length)} درس</span>
      </header>
      {!s.courses.length ? (
        <Empty icon="book" title="هنوز درسی اضافه نکرده‌ای" hint="با اولین درس شروع کن، مثلاً ریاضی یا علوم." />
      ) : (
        <div className="col">
          {s.courses.map((c) => (
            <div key={c.id} className="card row" style={{ ...cvar(c.color), borderRight: `4px solid ${c.color}` }}>
              <span className="course-ico tint"><Icon n="book" /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{c.name}</strong>
                <div className="muted">{meta(c)}</div>
              </div>
              <button className="ib" aria-label={'ویرایش ' + c.name} onClick={() => setForm(c)}><Icon n="edit" /></button>
              <button className="ib" aria-label={'حذف ' + c.name} style={{ color: 'var(--danger)' }} onClick={() => setDel(c)}><Icon n="trash" /></button>
            </div>
          ))}
        </div>
      )}
      <button className="fab" aria-label="درس جدید" onClick={() => setForm({ id: '', name: '', color: PALETTE.find(([h]) => !s.courses.some((c) => c.color === h))?.[0] ?? PALETTE[0][0] })}>
        <Icon n="plus" size={26} />
      </button>

      {form && (
        <Sheet onClose={() => setForm(null)} label="فرم درس">
          <h3 className="section-title">{form.id ? 'ویرایش درس' : 'درس جدید'}</h3>
          <div className="field">
            <label htmlFor="cn">نام درس</label>
            <input id="cn" className="input" aria-invalid={!!dup} aria-describedby={dup ? 'dup' : undefined} autoFocus maxLength={30} value={form.name} placeholder="مثلاً ریاضی" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <span className="label">رنگ درس</span>
            <div className="swatches">
              {PALETTE.map(([h, n]) => (
                <button key={h} className={'sw' + (form.color === h ? ' on' : '')} style={cvar(h)} aria-label={n} aria-pressed={form.color === h} onClick={() => setForm({ ...form, color: h })}>
                  {form.color === h && <Icon n="check" sw={3} />}
                </button>
              ))}
            </div>
            <label className="row muted" style={{ gap: 10 }}>
              رنگ دلخواه
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 44, height: 36, border: 0, background: 'none' }} />
            </label>
          </div>
          {other && <div className="warn bad" role="alert">این رنگ به «{other.name}» خیلی شبیه است؛ رنگ دیگری انتخاب کن.</div>}
          {dup && <div id="dup" className="warn bad" role="alert">درسی با این نام وجود دارد.</div>}
          <div className="card row" style={{ ...cvar(form.color), background: '#f7f7fa', boxShadow: 'none' }}>
            <span className="course-ico tint"><Icon n="book" /></span>
            <strong>{name || 'پیش‌نمایش'}</strong>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setForm(null)}>لغو</button>
            <button
              className="btn primary"
              style={{ flex: 2 }}
              disabled={bad}
              onClick={() => {
                dispatch({ t: 'course/save', course: { ...form, id: form.id || uid(), name } })
                toast('درس ذخیره شد')
                setForm(null)
              }}
            >
              ذخیره درس
            </button>
          </div>
        </Sheet>
      )}
      {del && (
        <Confirm
          danger
          title="حذف درس؟"
          body={`«${del.name}» و همه‌ی جلسه‌های برنامه‌ریزی‌شده‌ی آن حذف می‌شود. سابقه‌ی مطالعه‌ی قبلی در آمار می‌ماند.`}
          yes="حذف"
          onNo={() => setDel(null)}
          onYes={() => {
            dispatch({ t: 'course/delete', id: del.id })
            setDel(null)
            toast('درس حذف شد')
          }}
        />
      )}
    </div>
  )
}
