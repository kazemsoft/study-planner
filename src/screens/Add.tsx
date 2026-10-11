import { useMemo, useState } from 'react'
import { useApp } from '../ctx'
import { JMONTHS, WD_SHORT, WEEKDAYS, addDays, fa, fmtJ, fmtJWd, fromJ, jMonthLen, toJ, toMin, today, weekdayOf } from '../lib/dates'
import { findConflict } from '../lib/conflicts'
import { uid } from '../lib/store'
import type { Rule, StudyType } from '../types'
import { Empty, Icon, cvar, useDialog } from '../ui'

const nextDateOf = (wd: number) => {
  const t = today()
  return addDays(t, (wd - weekdayOf(t) + 7) % 7)
}

function Calendar({ value, onPick }: { value: string; onPick: (iso: string) => void }) {
  const init = toJ(value)
  const [ym, setYm] = useState({ y: init.jy, m: init.jm })
  const lead = weekdayOf(fromJ(ym.y, ym.m, 1))
  const len = jMonthLen(ym.y, ym.m)
  const step = (d: number) => setYm(({ y, m }) => ({ y: m + d > 12 ? y + 1 : m + d < 1 ? y - 1 : y, m: ((m + d + 11) % 12) + 1 }))
  const t = today()
  return (
    <div className="card col" style={{ gap: 6 }}>
      <div className="row between">
        <button className="ib" aria-label="ماه قبل" onClick={() => step(-1)}><Icon n="right" /></button>
        <strong>{JMONTHS[ym.m - 1]} {fa(ym.y)}</strong>
        <button className="ib" aria-label="ماه بعد" onClick={() => step(1)}><Icon n="left" /></button>
      </div>
      <div className="cal">
        {WD_SHORT.map((w) => <span key={w} className="wd">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={'e' + i} />)}
        {Array.from({ length: len }, (_, i) => {
          const d = fromJ(ym.y, ym.m, i + 1)
          return (
            <button key={d} className={(d === value ? 'sel ' : '') + (d === t ? 'today' : '')} aria-label={fmtJ(d)} aria-pressed={d === value} onClick={() => onPick(d)}>
              {fa(i + 1)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Add() {
  const { s, dispatch, adding, closeAdd, go, toast } = useApp()
  const edit = adding ? adding.edit : undefined
  const src = edit ? s.rules.find((r) => r.id === edit.ruleId) : undefined
  const cur = src && edit ? { ...src, ...(typeof src.overrides[edit.date] === 'object' ? (src.overrides[edit.date] as { start: string; end: string }) : {}) } : undefined
  const oneOnly = edit?.scope === 'one'

  const [mode, setMode] = useState<'weekly' | 'once'>('weekly')
  const [courseId, setCourseId] = useState(cur?.courseId ?? s.courses[0]?.id ?? '')
  const [weekday, setWeekday] = useState(edit ? weekdayOf(edit.date) : weekdayOf(today()))
  const [date, setDate] = useState((adding && adding.date) || today())
  const [start, setStart] = useState(cur?.start ?? '16:00')
  const [end, setEnd] = useState(cur?.end ?? '17:00')
  const [type, setType] = useState<StudyType>(cur?.type ?? 'essay')
  const [repeat, setRepeat] = useState<'from' | 'one'>('from')
  const [ack, setAck] = useState(false)
  const dlg = useDialog(closeAdd)

  const badTime = !start || !end || toMin(end) <= toMin(start)

  const cand: Rule | null = useMemo(() => {
    if (!courseId || badTime) return null
    if (edit && cur)
      return oneOnly
        ? { ...cur, kind: 'once', date: edit.date, from: edit.date, until: undefined, start, end, overrides: {} }
        : { ...cur, courseId, start, end, type, from: edit.date, overrides: {} }
    const isOnce = mode === 'once' || repeat === 'one'
    const d = mode === 'once' ? date : nextDateOf(weekday)
    return { id: 'new', courseId, kind: isOnce ? 'once' : 'weekly', weekday, date: isOnce ? d : undefined, start, end, type, from: d, overrides: {} }
  }, [courseId, badTime, edit, cur, oneOnly, start, end, type, mode, repeat, date, weekday])

  const conflict = useMemo(() => {
    if (!cand) return null
    return findConflict(s.rules.filter((r) => r.id !== edit?.ruleId), cand)
  }, [cand, s.rules, edit])
  const conflictCourse = conflict && s.courses.find((c) => c.id === conflict.courseId)?.name

  if (!s.courses.length)
    return (
      <div className="full"><div className="inner">
        <Empty icon="book" title="اول یک درس اضافه کن" hint="برای برنامه‌ریزی به حداقل یک درس نیاز داری." action={<button className="btn primary" onClick={() => { closeAdd(); go('courses') }}>رفتن به درس‌ها</button>} />
        <button className="btn ghost" onClick={closeAdd}>بستن</button>
      </div></div>
    )

  const submit = () => {
    if (!cand || !edit && !courseId) return
    if (edit) {
      if (oneOnly) dispatch({ t: 'rule/editOne', id: edit.ruleId, date: edit.date, start, end })
      else dispatch({ t: 'rule/editFrom', id: edit.ruleId, date: edit.date, patch: { courseId, start, end, type } })
      toast(oneOnly ? 'فقط همین جلسه تغییر کرد' : 'تغییر برای این جلسه و بعد از آن اعمال شد')
    } else {
      dispatch({ t: 'rule/add', rule: { ...cand, id: uid() } })
      toast('برنامه اضافه شد')
    }
    closeAdd()
    go('schedule')
  }

  return (
    <div className="full">
      <div className="inner" ref={dlg} tabIndex={-1} role="dialog" aria-modal aria-label={edit ? 'ویرایش جلسه' : 'برنامه جدید'}>
        <header className="row between">
          <h1 className="page-title">{edit ? (oneOnly ? 'ویرایش این جلسه' : 'ویرایش از این تاریخ به بعد') : 'برنامه جدید'}</h1>
          <button className="ib white" aria-label="بستن" onClick={closeAdd}><Icon n="x" /></button>
        </header>
        {edit && <span className="muted">{fmtJWd(edit.date)}</span>}

        {!edit && (
          <div className="seg">
            <button className={mode === 'weekly' ? 'on' : ''} aria-pressed={mode === 'weekly'} onClick={() => { setMode('weekly'); setAck(false) }}>برنامه هفتگی</button>
            <button className={mode === 'once' ? 'on' : ''} aria-pressed={mode === 'once'} onClick={() => { setMode('once'); setAck(false) }}>تاریخ مشخص</button>
          </div>
        )}

        {!oneOnly && (
          <div className="field">
            <span className="label">درس</span>
            <div className="chips">
              {s.courses.map((c) => (
                <button key={c.id} className={'chip' + (c.id === courseId ? ' on' : '')} style={cvar(c.color)} aria-pressed={c.id === courseId} onClick={() => { setCourseId(c.id); setAck(false) }}>
                  <i style={{ width: 10, height: 10, borderRadius: 5, background: c.color }} />{c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!edit && mode === 'weekly' && (
          <div className="field">
            <span className="label">روز هفته</span>
            <div className="chips">
              {WEEKDAYS.map((w, i) => (
                <button key={w} className={'chip' + (i === weekday ? ' on' : '')} aria-pressed={i === weekday} onClick={() => { setWeekday(i); setAck(false) }}>{w}</button>
              ))}
            </div>
          </div>
        )}
        {!edit && mode === 'once' && (
          <div className="field">
            <span className="label">تاریخ — {fmtJWd(date)}</span>
            <Calendar value={date} onPick={(d) => { setDate(d); setAck(false) }} />
          </div>
        )}

        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="st">ساعت شروع</label>
            <input id="st" className="input" type="time" aria-invalid={badTime} aria-describedby={badTime ? 'terr' : undefined} value={start} onChange={(e) => { setStart(e.target.value); setAck(false) }} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="en">ساعت پایان</label>
            <input id="en" className="input" type="time" aria-invalid={badTime} aria-describedby={badTime ? 'terr' : undefined} value={end} onChange={(e) => { setEnd(e.target.value); setAck(false) }} />
          </div>
        </div>
        {badTime && <div id="terr" className="warn bad" role="alert">ساعت پایان باید بعد از ساعت شروع باشد.</div>}

        {!oneOnly && (
          <div className="field">
            <span className="label">نوع مطالعه</span>
            <div className="seg">
              <button className={type === 'essay' ? 'on' : ''} aria-pressed={type === 'essay'} onClick={() => setType('essay')}>تشریحی</button>
              <button className={type === 'test' ? 'on' : ''} aria-pressed={type === 'test'} onClick={() => setType('test')}>تستی</button>
            </div>
          </div>
        )}

        {!edit && mode === 'weekly' && (
          <div className="field">
            <span className="label">تکرار</span>
            <div className="seg">
              <button className={repeat === 'from' ? 'on' : ''} aria-pressed={repeat === 'from'} onClick={() => { setRepeat('from'); setAck(false) }}>از این هفته به بعد</button>
              <button className={repeat === 'one' ? 'on' : ''} aria-pressed={repeat === 'one'} onClick={() => { setRepeat('one'); setAck(false) }}>فقط همین جلسه</button>
            </div>
            <span className="muted">شروع از {fmtJWd(nextDateOf(weekday))}</span>
          </div>
        )}

        {conflict && (
          <div className="warn" role="alert">
            <div className="row" style={{ gap: 8 }}><Icon n="alert" /><strong>تداخل زمانی</strong></div>
            <span>این برنامه با «{conflictCourse ?? '؟'}» در {fmtJWd(conflict.date)} ساعت {fa(conflict.start)} تا {fa(conflict.end)} هم‌زمان است.</span>
            <button className={'chip' + (ack ? ' on' : '')} aria-pressed={ack} onClick={() => setAck(!ack)}>
              {ack && <Icon n="check" size={18} sw={2.5} />}متوجه هستم، با این حال اضافه شود
            </button>
          </div>
        )}

        <button className="btn primary block" disabled={!cand || (!!conflict && !ack)} onClick={submit}>
          {edit ? 'ذخیره تغییر' : 'افزودن برنامه'}
        </button>
      </div>
    </div>
  )
}
