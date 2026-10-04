import { useState } from 'react'
import { useApp, weekOf } from '../ctx'
import { WD_SHORT, fa, fmtDur, fmtJ, fmtJWd, faTime, fmtClock } from '../lib/dates'
import { perCourse, perDay, totalSec } from '../lib/stats'
import { Empty, Icon, cvar } from '../ui'

export default function Stats() {
  const { s } = useApp()
  const [off, setOff] = useState(0)
  const [all, setAll] = useState(false)
  const wk = weekOf(off)
  const total = totalSec(s.logs, wk.from, wk.to)
  const days = perDay(s.logs, wk.from)
  const max = Math.max(...days, 1)
  const shares = perCourse(s.logs, wk.from, wk.to)
  const sessions = s.logs.filter((l) => l.date >= wk.from && l.date <= wk.to).sort((a, b) => b.startTs - a.startTs)
  const shown = all ? sessions : sessions.slice(0, 3)

  return (
    <div className="screen">
      <header><h1 className="page-title">آمار مطالعه</h1></header>
      <div className="seg">
        <button className={off === 0 ? 'on' : ''} onClick={() => setOff(0)}>این هفته</button>
        <button className={off === -1 ? 'on' : ''} onClick={() => setOff(-1)}>هفته قبل</button>
      </div>
      <span className="muted">{fmtJ(wk.from, false)} تا {fmtJ(wk.to)}</span>

      <section className="hero">
        <span style={{ fontWeight: 500 }}>مجموع مطالعه هفته</span>
        <strong style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, direction: 'ltr', textAlign: 'right' }}>{fmtClock(total)}</strong>
        <span style={{ fontSize: 14 }}>{fmtDur(total)} • {fa(sessions.length)} جلسه</span>
      </section>

      {!sessions.length ? (
        <Empty icon="chart" title="هنوز مطالعه‌ای ثبت نشده" hint="با کرنومتر یک جلسه را تمام کن تا اینجا ببینی." />
      ) : (
        <>
          <section className="card col">
            <h2 className="section-title">مطالعه روزانه</h2>
            <div className="cols">
              {days.map((sec, i) => (
                <div key={i} className={sec ? '' : 'zero'}>
                  <span className="num">{sec ? fa((sec / 3600).toFixed(1)) : ''}</span>
                  <i style={{ height: `${(sec / max) * 100 * 0.78}%` }} />
                  <b style={{ color: 'var(--ink)' }}>{WD_SHORT[i]}</b>
                </div>
              ))}
            </div>
            <span className="muted">محور: ساعت</span>
          </section>

          <section className="card col">
            <h2 className="section-title">سهم هر درس</h2>
            {shares.map((c) => (
              <div key={c.courseId} className="col" style={{ gap: 4, ...cvar(c.color) }}>
                <div className="row between"><strong>{c.name}</strong><span className="muted">{fmtDur(c.sec)} • {fa(c.pct)}٪</span></div>
                <div className="bar dark"><i style={{ width: c.pct + '%' }} /></div>
              </div>
            ))}
          </section>

          <section className="col">
            <h2 className="section-title">جلسه‌های انجام‌شده</h2>
            {shown.map((l) => (
              <div key={l.id} className="card row" style={cvar(l.color)}>
                <span className="course-ico tint"><Icon n="book" /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row"><strong>{l.name}</strong><span className="badge">{l.type === 'test' ? 'تستی' : 'تشریحی'}</span></div>
                  <div className="muted">{fmtJWd(l.date)} • {faTime(new Date(l.startTs).toTimeString().slice(0, 5))}</div>
                </div>
                <span className="badge ok"><Icon n="check" size={16} sw={2.2} />{fmtDur(l.durationSec)}</span>
              </div>
            ))}
            {sessions.length > 3 && <button className="btn outline" onClick={() => setAll(!all)}>{all ? 'نمایش کمتر' : `نمایش همه‌ی ${fa(sessions.length)} جلسه`}</button>}
          </section>
        </>
      )}
    </div>
  )
}
