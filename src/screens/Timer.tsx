import { useState } from 'react'
import { useApp, useNow } from '../ctx'
import { fa, faTime, fmtClock, fmtDur, toMin, today } from '../lib/dates'
import { occurrencesInRange } from '../lib/occurrences'
import { elapsedMs } from '../lib/store'
import type { StudyType } from '../types'
import { Confirm, Empty, Icon, cvar } from '../ui'

export default function Timer() {
  const { s, dispatch, toast, go } = useApp()
  const t = s.timer
  const now = useNow(250)
  const [pick, setPick] = useState(s.courses[0]?.id ?? '')
  const [type, setType] = useState<StudyType>('essay')
  const [ask, setAsk] = useState<'finish' | 'cancel' | null>(null)
  const day = today()
  const logs = s.logs.filter((l) => l.date === day)
  const total = logs.reduce((a, l) => a + l.durationSec, 0)

  if (!t) {
    const upcoming = occurrencesInRange(s.rules, day, day).filter((o) => !s.logs.some((l) => l.ruleId === o.ruleId && l.date === day))
    return (
      <div className="screen">
        <header className="row between"><h1 className="page-title">کرنومتر</h1><span className="badge" style={{ height: 28 }}>آماده‌ی شروع</span></header>
        {!s.courses.length ? (
          <Empty icon="timer" title="اول یک درس اضافه کن" action={<button className="btn primary" onClick={() => go('courses')}>رفتن به درس‌ها</button>} />
        ) : (
          <>
            <div className="card col" style={{ alignItems: 'stretch' }}>
              <div className="clock" style={{ color: '#9ca3af' }}>{fmtClock(0)}</div>
              <div className="chips">
                {s.courses.map((c) => (
                  <button key={c.id} className={'chip' + (pick === c.id ? ' on' : '')} aria-pressed={pick === c.id} onClick={() => setPick(c.id)}>
                    <i style={{ width: 10, height: 10, borderRadius: 5, background: c.color }} />{c.name}
                  </button>
                ))}
              </div>
              <div className="seg">
                <button className={type === 'essay' ? 'on' : ''} onClick={() => setType('essay')}>تشریحی</button>
                <button className={type === 'test' ? 'on' : ''} onClick={() => setType('test')}>تستی</button>
              </div>
              <button className="btn success block" disabled={!pick} onClick={() => dispatch({ t: 'timer/start', courseId: pick, type })}><Icon n="play" size={18} />شروع</button>
            </div>
            {!!upcoming.length && (
              <section className="col">
                <h2 className="section-title">از برنامه‌ی امروز شروع کن</h2>
                {upcoming.map((o) => {
                  const c = s.courses.find((x) => x.id === o.courseId)
                  return (
                    <button key={o.ruleId} className="card tap row" style={cvar(c?.color ?? '#999')} onClick={() => dispatch({ t: 'timer/start', courseId: o.courseId, type: o.type, ruleId: o.ruleId, date: o.date })}>
                      <span className="course-ico tint"><Icon n="book" /></span>
                      <div style={{ flex: 1, textAlign: 'right' }}><strong>{c?.name}</strong><div className="muted">{faTime(o.start)} – {faTime(o.end)}</div></div>
                      <Icon n="play" size={18} />
                    </button>
                  )
                })}
              </section>
            )}
          </>
        )}
        <Today logs={logs} total={total} />
      </div>
    )
  }

  const c = s.courses.find((x) => x.id === t.courseId)
  const ms = elapsedMs(t, now)
  const rule = t.ruleId ? occurrencesInRange(s.rules, t.date ?? day, t.date ?? day).find((o) => o.ruleId === t.ruleId) : undefined
  const planned = rule ? (toMin(rule.end) - toMin(rule.start)) * 60 : 0
  const pct = planned ? Math.min(100, Math.round(ms / 10 / planned)) : 0
  const running = t.status === 'running'

  return (
    <div className="screen">
      <header className="row between">
        <h1 className="page-title">کرنومتر</h1>
        <span className="badge" style={{ height: 28, background: running ? 'var(--success-soft)' : 'var(--danger-soft)', color: running ? 'var(--success-ink)' : '#b91c1c' }}>
          {running ? 'در حال مطالعه' : 'متوقف شده'}
        </span>
      </header>
      <div className="card col" style={{ alignItems: 'stretch', ...cvar(c?.color ?? '#999') }}>
        <div className="row" style={{ justifyContent: 'center' }}>
          <span className="course-ico tint"><Icon n="book" /></span>
          <strong style={{ fontSize: 22 }}>{c?.name ?? 'درس حذف‌شده'}</strong>
          <span className="badge">{t.type === 'test' ? 'تستی' : 'تشریحی'}</span>
        </div>
        {rule && <div className="muted" style={{ textAlign: 'center' }}>برنامه: {faTime(rule.start)} – {faTime(rule.end)}</div>}
        <div className="clock" style={{ color: running ? 'var(--primary-dark)' : 'var(--danger)' }} role="timer">{fmtClock(ms / 1000)}</div>
        {planned > 0 && (
          <>
            <div className="bar dark" style={{ '--c': c?.color } as React.CSSProperties}><i style={{ width: pct + '%' }} /></div>
            <div className="muted" style={{ textAlign: 'center' }}>{fa(pct)}٪ از زمان برنامه</div>
          </>
        )}
        <div className="row" style={{ gap: 12 }}>
          <button className={'btn block ' + (running ? 'outline' : 'success')} style={{ flex: 1 }} onClick={() => dispatch({ t: running ? 'timer/pause' : 'timer/resume' })}>
            <Icon n={running ? 'pause' : 'play'} size={18} />{running ? 'توقف موقت' : 'ادامه'}
          </button>
          <button className="btn danger" style={{ flex: 1 }} onClick={() => setAsk('finish')}>اتمام جلسه</button>
        </div>
        <button className="btn" style={{ color: 'var(--ink-2)', minHeight: 44 }} onClick={() => setAsk('cancel')}>لغو بدون ذخیره</button>
      </div>
      <Today logs={logs} total={total} />

      {ask === 'finish' && (
        <Confirm
          title="جلسه تمام شود؟" body={`${fmtDur(ms / 1000)} مطالعه‌ی «${c?.name}» ذخیره و در آمار ثبت می‌شود.`} yes="ذخیره و پایان" no="ادامه مطالعه"
          onNo={() => setAsk(null)}
          onYes={() => { dispatch({ t: 'timer/finish' }); setAsk(null); toast(`جلسه‌ی ${c?.name} (${fmtDur(ms / 1000)}) در آمار ثبت شد`) }}
        />
      )}
      {ask === 'cancel' && (
        <Confirm danger title="لغو جلسه؟" body="زمان این جلسه ذخیره نمی‌شود." yes="لغو جلسه" no="بازگشت" onNo={() => setAsk(null)} onYes={() => { dispatch({ t: 'timer/cancel' }); setAsk(null) }} />
      )}
    </div>
  )
}

function Today({ logs, total }: { logs: import('../types').Log[]; total: number }) {
  return (
    <section className="col">
      <div className="row between"><h2 className="section-title">جلسه‌های امروز</h2><span className="muted">مجموع: {fmtDur(total)}</span></div>
      {!logs.length && <span className="muted">هنوز جلسه‌ای ثبت نشده.</span>}
      {logs.map((l) => (
        <div key={l.id} className="card row" style={cvar(l.color)}>
          <span className="course-ico tint"><Icon n="book" /></span>
          <strong style={{ flex: 1 }}>{l.name}</strong>
          <span className="badge ok">{fmtDur(l.durationSec)}</span>
        </div>
      ))}
    </section>
  )
}
