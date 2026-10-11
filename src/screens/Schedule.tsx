import { useState } from 'react'
import { useApp, weekOf } from '../ctx'
import { JMONTHS, WD_SHORT, WEEKDAYS, addDays, fa, fmtJ, fmtJWd, faTime, fromJ, jMonthLen, toJ, toMin, today, weekdayOf } from '../lib/dates'
import { occurrencesInRange } from '../lib/occurrences'
import type { Occurrence } from '../types'
import { Confirm, Empty, Icon, Sheet, cvar } from '../ui'

const HH = 52 // px per hour

export default function Schedule() {
  const { s, dispatch, openAdd, go, toast } = useApp()
  const [off, setOff] = useState(0)
  const [view, setView] = useState<'week' | 'month'>('week')
  const [moff, setMoff] = useState(0)
  const [day, setDay] = useState(today())
  const [sel, setSel] = useState<Occurrence | null>(null)
  const [del, setDel] = useState<Occurrence | null>(null)
  const wk = weekOf(off)
  const occ = occurrencesInRange(s.rules, wk.from, wk.to)
  const t = today()
  const base = toJ(t)
  const mi = base.jy * 12 + base.jm - 1 + moff
  const my = Math.floor(mi / 12), mm = (mi % 12) + 1
  const mFrom = fromJ(my, mm, 1), mLen = jMonthLen(my, mm), mTo = fromJ(my, mm, mLen)
  const mOcc = occurrencesInRange(s.rules, mFrom, mTo)
  const course = (id: string) => s.courses.find((c) => c.id === id)
  const done = (o: Occurrence) => s.logs.some((l) => l.ruleId === o.ruleId && l.date === o.date)

  const h0 = Math.min(8, ...occ.map((o) => Math.floor(toMin(o.start) / 60)))
  const h1 = Math.max(20, ...occ.map((o) => Math.ceil(toMin(o.end) / 60)))
  const hours = Array.from({ length: h1 - h0 }, (_, i) => h0 + i)

  const a = toJ(wk.from), b = toJ(wk.to)
  const range = a.jm === b.jm ? `${fa(a.jd)} تا ${fa(b.jd)} ${fmtJ(wk.to).split(' ')[1]} ${fa(b.jy)}` : `${fmtJ(wk.from, false)} تا ${fmtJ(wk.to)}`

  // side-by-side lanes for overlapping sessions in a day
  const lanes = (list: Occurrence[]) => {
    const res = new Map<Occurrence, { i: number; n: number }>()
    let group: Occurrence[] = [], gEnd = 0
    const flush = () => group.forEach((o, i) => res.set(o, { i, n: group.length }))
    for (const o of list) {
      if (group.length && toMin(o.start) >= gEnd) { flush(); group = []; gEnd = 0 }
      group.push(o); gEnd = Math.max(gEnd, toMin(o.end))
    }
    flush()
    return res
  }

  const rule = sel && s.rules.find((r) => r.id === sel.ruleId)
  const c = sel && course(sel.courseId)

  return (
    <div className="screen">
      <header className="row between">
        <div>
          <h1 className="page-title">جدول هفتگی</h1>
          <span className="muted">{view === 'week' ? `${fa(occ.length)} جلسه • ${range}` : `${fa(mOcc.length)} جلسه در ${JMONTHS[mm - 1]}`}</span>
        </div>
        <button className="ib white" aria-label="برنامه جدید" onClick={() => openAdd()}><Icon n="plus" /></button>
      </header>
      <div className="seg" style={{ alignSelf: 'center', width: 180 }}>
        <button className={view === 'week' ? 'on' : ''} aria-pressed={view === 'week'} onClick={() => setView('week')}>هفتگی</button>
        <button className={view === 'month' ? 'on' : ''} aria-pressed={view === 'month'} onClick={() => setView('month')}>ماهانه</button>
      </div>
      {view === 'week' ? (
        <div className="row between">
          <button className="ib white" aria-label="هفته قبل" onClick={() => setOff(off - 1)}><Icon n="right" /></button>
          <button className={'chip' + (off === 0 ? ' on' : '')} onClick={() => setOff(0)}>هفته جاری</button>
          <button className="ib white" aria-label="هفته بعد" onClick={() => setOff(off + 1)}><Icon n="left" /></button>
        </div>
      ) : (
        <div className="row between">
          <button className="ib white" aria-label="ماه قبل" onClick={() => setMoff(moff - 1)}><Icon n="right" /></button>
          <button className={'chip' + (moff === 0 ? ' on' : '')} onClick={() => { setMoff(0); setDay(t) }}>{JMONTHS[mm - 1]} {fa(my)}</button>
          <button className="ib white" aria-label="ماه بعد" onClick={() => setMoff(moff + 1)}><Icon n="left" /></button>
        </div>
      )}

      {view === 'month' && (
        <>
          <div className="card cal" style={{ gap: 4 }}>
            {WD_SHORT.map((w) => <span key={w} className="wd">{w}</span>)}
            {Array.from({ length: weekdayOf(mFrom) }, (_, i) => <span key={'e' + i} />)}
            {Array.from({ length: mLen }, (_, i) => {
              const d = fromJ(my, mm, i + 1)
              const list = mOcc.filter((o) => o.date === d)
              return (
                <button key={d} className={(d === day ? 'sel ' : '') + (d === t ? 'today' : '')} style={{ height: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }} aria-label={fmtJ(d) + (list.length ? `، ${fa(list.length)} جلسه` : '')} aria-pressed={d === day} onClick={() => setDay(d)}>
                  {fa(i + 1)}
                  <span className="row" style={{ gap: 2, height: 6 }}>
                    {list.slice(0, 3).map((o) => <i key={o.ruleId + o.start} style={{ width: 6, height: 6, borderRadius: 3, background: d === day ? '#fff' : course(o.courseId)?.color ?? '#999' }} />)}
                  </span>
                </button>
              )
            })}
          </div>
          <section className="col">
            <h2 className="section-title">{fmtJWd(day)}</h2>
            {!mOcc.some((o) => o.date === day) && <span className="muted">در این روز جلسه‌ای نیست.</span>}
            {mOcc.filter((o) => o.date === day).map((o) => {
              const c = course(o.courseId)
              return (
                <button key={o.ruleId + o.start} className="card tap row" style={cvar(c?.color ?? '#999')} onClick={() => setSel(o)}>
                  <span className="course-ico tint"><Icon n="book" /></span>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <strong>{c?.name}</strong>
                    <div className="muted">{faTime(o.start)} – {faTime(o.end)}</div>
                  </div>
                  {done(o) ? <span className="badge ok"><Icon n="check" size={16} sw={2.2} />انجام شد</span> : <span className="badge">{o.type === 'test' ? 'تستی' : 'تشریحی'}</span>}
                </button>
              )
            })}
            <button className="btn outline" onClick={() => openAdd({ date: day })}><Icon n="plus" size={18} />برنامه برای این روز</button>
          </section>
        </>
      )}

      {view === 'week' && <div className="week" style={{ '--hh': HH + 'px' } as React.CSSProperties}>
        <div className="dh" />
        {WD_SHORT.map((w, i) => {
          const d = addDays(wk.from, i)
          return <div key={w} className={'dh' + (d === t ? ' today' : '')}>{w}<b>{fa(toJ(d).jd)}</b></div>
        })}
        <div className="hours">{hours.map((h) => <div key={h}>{fa(h)}</div>)}</div>
        {WD_SHORT.map((_, i) => {
          const d = addDays(wk.from, i)
          const list = occ.filter((o) => o.date === d)
          const ln = lanes(list)
          return (
            <div key={d} className={'day' + (d === t ? ' today' : '')} style={{ height: hours.length * HH }}>
              {list.map((o) => {
                const cc = course(o.courseId)
                const { i: li, n } = ln.get(o)!
                return (
                  <button
                    key={o.ruleId + o.start}
                    className={'occ' + (done(o) ? ' done' : '')}
                    style={{ ...cvar(cc?.color ?? '#9ca3af'), top: ((toMin(o.start) - h0 * 60) * HH) / 60, height: Math.max(((toMin(o.end) - toMin(o.start)) * HH) / 60 - 2, 18), width: `calc(${100 / n}% - 2px)`, right: `${(100 / n) * li}%` }}
                    aria-label={`${cc?.name} ${WEEKDAYS[i]} ${faTime(o.start)} تا ${faTime(o.end)}`}
                    onClick={() => setSel(o)}
                  >
                    {cc?.name}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>}
      {view === 'week' && !occ.length && <Empty icon="cal" title="این هفته برنامه‌ای نداری" hint="با دکمه‌ی + یک جلسه اضافه کن." />}

      {sel && c && rule && (
        <Sheet onClose={() => setSel(null)} label="جزئیات جلسه">
          <div className="row" style={cvar(c.color)}>
            <span className="course-ico tint"><Icon n="book" /></span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 18 }}>{c.name}</strong>
              <div className="muted">{fmtJWd(sel.date)} • {faTime(sel.start)} – {faTime(sel.end)}</div>
            </div>
            <span className="badge">{sel.type === 'test' ? 'تستی' : 'تشریحی'}</span>
            <button className="ib" aria-label="بستن" onClick={() => setSel(null)}><Icon n="x" /></button>
          </div>
          <button className="btn primary block" onClick={() => { dispatch({ t: 'timer/start', courseId: sel.courseId, type: sel.type, ruleId: sel.ruleId, date: sel.date }); setSel(null); go('timer') }}>
            <Icon n="play" size={18} />شروع مطالعه
          </button>
          {rule.kind === 'weekly' ? (
            <>
              <button className="btn outline block" onClick={() => { openAdd({ edit: { ruleId: sel.ruleId, date: sel.date, scope: 'one' } }); setSel(null) }}>ویرایش فقط این جلسه</button>
              <button className="btn outline block" onClick={() => { openAdd({ edit: { ruleId: sel.ruleId, date: sel.date, scope: 'from' } }); setSel(null) }}>ویرایش از این تاریخ به بعد</button>
            </>
          ) : (
            <button className="btn outline block" onClick={() => { openAdd({ edit: { ruleId: sel.ruleId, date: sel.date, scope: 'from' } }); setSel(null) }}>ویرایش</button>
          )}
          <button className="btn danger-o block" onClick={() => { setDel(sel); setSel(null) }}><Icon n="trash" size={18} />حذف</button>
        </Sheet>
      )}

      {del && s.rules.find((r) => r.id === del.ruleId)?.kind === 'weekly' && (
        <Sheet onClose={() => setDel(null)} label="حذف جلسه">
          <h3 className="section-title">کدام جلسه‌ها حذف شود؟</h3>
          <span className="muted">سابقه‌ی مطالعه‌ی انجام‌شده هرگز حذف نمی‌شود.</span>
          <button className="btn danger-o block" onClick={() => { dispatch({ t: 'rule/deleteOne', id: del.ruleId, date: del.date }); setDel(null); toast('جلسه حذف شد') }}>فقط همین جلسه</button>
          <button className="btn danger block" onClick={() => { dispatch({ t: 'rule/deleteFrom', id: del.ruleId, date: del.date }); setDel(null); toast('جلسه‌ها حذف شد') }}>این جلسه و همه‌ی بعدی‌ها</button>
          <button className="btn ghost block" onClick={() => setDel(null)}>انصراف</button>
        </Sheet>
      )}
      {del && s.rules.find((r) => r.id === del.ruleId)?.kind === 'once' && (
        <Confirm danger title="حذف جلسه؟" body="این جلسه از جدول حذف می‌شود." yes="حذف" onNo={() => setDel(null)} onYes={() => { dispatch({ t: 'rule/deleteOne', id: del.ruleId, date: del.date }); setDel(null); toast('جلسه حذف شد') }} />
      )}
    </div>
  )
}
