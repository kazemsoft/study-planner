import { Provider, useApp, type Tab } from './ctx'
import ErrorBoundary from './ErrorBoundary'
import Add from './screens/Add'
import Courses from './screens/Courses'
import Home from './screens/Home'
import Schedule from './screens/Schedule'
import Stats from './screens/Stats'
import Timer from './screens/Timer'
import { useEffect, useState } from 'react'
import { applyUpdate, onUpdateReady } from './pwa'
import { Icon } from './ui'

const TABS: [Tab, string, 'home' | 'cal' | 'book' | 'timer' | 'chart'][] = [
  ['home', 'خانه', 'home'], ['schedule', 'جدول', 'cal'], ['courses', 'درس‌ها', 'book'], ['timer', 'کرنومتر', 'timer'], ['stats', 'آمار', 'chart'],
]
const SCREENS = { home: Home, schedule: Schedule, courses: Courses, timer: Timer, stats: Stats }

function UpdateToast() {
  const [ready, setReady] = useState(false)
  useEffect(() => onUpdateReady(() => setReady(true)), [])
  if (!ready) return null
  return (
    <div className="update-toast" role="alert">
      <Icon n="refresh" />
      <div style={{ flex: 1 }}>
        <strong style={{ fontSize: 14 }}>نسخه‌ی جدید آماده است</strong>
        <div style={{ fontSize: 12, color: '#d1d5db' }}>برای استفاده از آن، بروزرسانی کن.</div>
      </div>
      <button className="btn primary" style={{ minHeight: 40, padding: '0 14px' }} onClick={applyUpdate}>بروزرسانی</button>
    </div>
  )
}

function Shell() {
  const { tab, go, adding } = useApp()
  const Screen = SCREENS[tab]
  return (
    <div className="app">
      <Screen />
      <nav className="nav" aria-label="ناوبری اصلی">
        {TABS.map(([k, label, ic]) => (
          <button key={k} className={'ni' + (tab === k ? ' on' : '')} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>
            <Icon n={ic} />{label}<span className="ind" />
          </button>
        ))}
      </nav>
      <UpdateToast />
      {adding && <Add key={JSON.stringify(adding)} />}
    </div>
  )
}

export default function App() {
  return <ErrorBoundary><Provider><Shell /></Provider></ErrorBoundary>
}
