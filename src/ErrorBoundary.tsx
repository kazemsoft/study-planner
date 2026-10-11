import { Component, type ReactNode } from 'react'
import { STORAGE_KEY } from './lib/store'

/** Last line of defence: a visible message instead of a blank screen, with a way to keep or reset the data. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  backup = () => {
    try {
      const url = URL.createObjectURL(new Blob([localStorage.getItem(STORAGE_KEY) ?? '{}'], { type: 'application/json' }))
      Object.assign(document.createElement('a'), { href: url, download: 'hosha-backup.json' }).click()
    } catch {
      /* nothing to export */
    }
  }
  reset = () => {
    if (!confirm('همه‌ی درس‌ها، برنامه‌ها و آمار پاک می‌شود. مطمئنی؟')) return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    location.reload()
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="app" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }} role="alert">
        <h1 className="page-title">مشکلی پیش آمد</h1>
        <p className="muted">برنامه نتوانست درست باز شود. اول دوباره امتحان کن؛ اگر درست نشد، از اطلاعاتت نسخه‌ی پشتیبان بگیر.</p>
        <button className="btn primary" onClick={() => location.reload()}>بارگذاری دوباره</button>
        <button className="btn outline" onClick={this.backup}>دانلود نسخه‌ی پشتیبان</button>
        <button className="btn danger-o" onClick={this.reset}>پاک‌کردن اطلاعات و شروع دوباره</button>
      </div>
    )
  }
}
