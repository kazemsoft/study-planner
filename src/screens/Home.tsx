import { useState } from 'react'
import { useApp, useNow } from '../ctx'
import { fa, fmtDur, fmtHM, faTime, fmtJWd, toMin, today } from '../lib/dates'
import { occurrencesInRange } from '../lib/occurrences'
import { elapsedMs } from '../lib/store'
import { totalSec } from '../lib/stats'
import { Empty, Icon, Sheet, cvar } from '../ui'

export default function Home() {
  const { s, dispatch, go, openAdd, toast } = useApp()
  const now = useNow(30_000)
  const [bell, setBell] = useState(false)
  const d = new Date(now)
  const t = today()
  const hr = d.getHours()
  const greet = hr < 12 ? 'صبح بخیر!' : hr < 17 ? 'ظهر بخیر!' : hr < 21 ? 'عصر بخیر!' : 'شب بخیر!'
  const list = occurrencesInRange(s.rules, t, t)
  const isDone = (ruleId: string) => s.logs.some((l) => l.ruleId === ruleId && l.date === t)
  const planned = list.reduce((a, o) => a + toMin(o.end) - toMin(o.start), 0)
  const live = s.timer && s.timer.date === t ? elapsedMs(s.timer) / 1000 : 0
  const studied = totalSec(s.logs, t, t) + live
  const nDone = list.filter((o) => isDone(o.ruleId)).length
  const pct = planned ? Math.min(100, Math.round(studied / 60 / planned * 100)) : 0
  const clock = fa(`${String(hr).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)

  return (
    <div className="screen">
      <header className="row between">
        <div>
          <span className="muted" style={{ fontWeight: 500 }}>{fmtJWd(t)} • {clock}</span>
          <h1 className="page-title" style={{ fontSize: 22 }}>{greet} آماده‌ی مطالعه‌ای؟</h1>
        </div>
        <button className="ib white" aria-label="یادآورها" onClick={() => setBell(true)}><Icon n="bell" /></button>
      </header>

      <section className="hero" aria-label="زمان مطالعه امروز">
        <div className="row between"><span style={{ fontWeight: 500 }}>زمان مطالعه امروز</span><Icon n="clock" /></div>
        <div className="row" style={{ alignItems: 'baseline' }}>
          <strong style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>{fmtHM(Math.floor(studied / 60))}</strong>
          <span style={{ fontSize: 14 }}>{planned ? `ساعت از ${fmtHM(planned)} برنامه‌ریزی‌شده` : 'ساعت — برنامه‌ای برای امروز نداری'}</span>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: pct + '%' }} /></div>
        <div className="row" style={{ borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 14 }}>
          <div className="row" style={{ flex: 1 }}><Icon n="check" /><div><strong>{fa(nDone)} جلسه</strong><div style={{ fontSize: 12 }}>انجام‌شده</div></div></div>
          <div className="row" style={{ flex: 1 }}><Icon n="history" /><div><strong>{fa(list.length - nDone)} جلسه</strong><div style={{ fontSize: 12 }}>باقی‌مانده</div></div></div>
        </div>
      </section>

      <section className="col">
        <div className="row between">
          <h2 className="section-title">برنامه امروز</h2>
          <button className="btn" style={{ color: 'var(--primary)', padding: 0 }} onClick={() => go('schedule')}>جدول هفتگی<Icon n="left" size={16} /></button>
        </div>
        {!list.length ? (
          <Empty icon="cal" title="برای امروز برنامه‌ای نیست" hint="یک جلسه اضافه کن." action={<button className="btn primary" onClick={() => openAdd({ date: t })}>برنامه جدید</button>} />
        ) : (
          list.map((o) => {
            const c = s.courses.find((x) => x.id === o.courseId)
            const done = isDone(o.ruleId)
            const running = s.timer?.ruleId === o.ruleId && s.timer.date === o.date
            return (
              <div key={o.ruleId} className="card tap row" style={{ ...cvar(c?.color ?? '#999'), gap: 12 }}>
                <span className="course-ico tint"><Icon n="book" /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{c?.name}</strong>
                  <div className="row"><span className="muted">{faTime(o.start)} – {faTime(o.end)}</span><span className="badge">{o.type === 'test' ? 'تستی' : 'تشریحی'}</span></div>
                </div>
                {done ? (
                  <span className="badge ok"><Icon n="check" size={16} sw={2.2} />انجام شد</span>
                ) : running ? (
                  <button className="btn outline" style={{ minHeight: 44 }} onClick={() => go('timer')}>در حال مطالعه</button>
                ) : (
                  <button
                    className="ib" style={{ background: 'var(--primary)', color: '#fff' }} aria-label={'شروع ' + c?.name}
                    onClick={() => {
                      if (s.timer) return toast('یک جلسه در حال اجراست؛ اول آن را تمام کن', true)
                      dispatch({ t: 'timer/start', courseId: o.courseId, type: o.type, ruleId: o.ruleId, date: o.date })
                      go('timer')
                    }}
                  ><Icon n="play" size={18} /></button>
                )}
              </div>
            )
          })
        )}
      </section>
      {s.timer && (
        <button className="card tap row between" onClick={() => go('timer')}>
          <span>⏱ یک جلسه در حال اجراست</span><Icon n="left" size={18} />
        </button>
      )}

      {bell && (
        <Sheet onClose={() => setBell(false)} label="یادآور">
          <h3 className="section-title">یادآور جلسه‌ها</h3>
          <span className="muted">چند دقیقه قبل از شروع جلسه خبر بده؟ (فقط وقتی برنامه باز است)</span>
          <div className="chips">
            {[0, 5, 10, 15, 30].map((m) => (
              <button key={m} className={'chip' + (s.alarmLead === m ? ' on' : '')} aria-pressed={s.alarmLead === m} onClick={() => dispatch({ t: 'alarm', lead: m })}>
                {m ? fa(m) + ' دقیقه' : 'خاموش'}
              </button>
            ))}
          </div>
          {'Notification' in window && Notification.permission === 'default' && (
            <button className="btn outline" onClick={() => Notification.requestPermission().then((p) => toast(p === 'granted' ? 'اعلان فعال شد' : 'اعلان فعال نشد', p !== 'granted'))}>فعال‌سازی اعلان مرورگر</button>
          )}
          {'Notification' in window && Notification.permission === 'denied' && <span className="muted">اعلان مرورگر مسدود است؛ فقط پیام درون‌برنامه نمایش داده می‌شود.</span>}
          <span className="muted">امروز {fmtDur(studied)} مطالعه کرده‌ای.</span>
          <button className="btn primary" onClick={() => setBell(false)}>تمام</button>
        </Sheet>
      )}
    </div>
  )
}
