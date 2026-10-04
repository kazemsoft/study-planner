import { jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js'

export const JMONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
export const WD_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

export const fa = (v: string | number) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
const p2 = (n: number) => String(n).padStart(2, '0')

export const iso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const today = () => iso(new Date())
/** 0 = شنبه … 6 = جمعه */
export const weekdayOf = (s: string) => (parse(s).getDay() + 1) % 7
export const weekStart = (s: string) => addDays(s, -weekdayOf(s))

export const toJ = (s: string) => {
  const d = parse(s)
  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return { jy, jm, jd }
}
export const fromJ = (jy: number, jm: number, jd: number) => {
  const g = toGregorian(jy, jm, jd)
  return `${g.gy}-${p2(g.gm)}-${p2(g.gd)}`
}
export const jMonthLen = (jy: number, jm: number) => jalaaliMonthLength(jy, jm)

export const fmtJ = (s: string, withYear = true) => {
  const { jy, jm, jd } = toJ(s)
  return fa(`${jd} ${JMONTHS[jm - 1]}${withYear ? ' ' + jy : ''}`)
}
export const fmtJWd = (s: string) => `${WEEKDAYS[weekdayOf(s)]} ${fmtJ(s, false)}`

export const toMin = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (m: number) => `${p2(Math.floor(m / 60))}:${p2(m % 60)}`
export const faTime = (hm: string) => fa(hm)
/** minutes → «۱:۳۰» */
export const fmtHM = (min: number) => fa(`${Math.floor(min / 60)}:${p2(Math.round(min % 60))}`)
export const fmtClock = (sec: number) =>
  fa(`${p2(Math.floor(sec / 3600))}:${p2(Math.floor((sec % 3600) / 60))}:${p2(Math.floor(sec % 60))}`)
/** seconds → «۱ ساعت و ۱۵ دقیقه» */
export const fmtDur = (sec: number) => {
  const m = Math.round(sec / 60)
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return fa(`${r} دقیقه`)
  return fa(r ? `${h} ساعت و ${r} دقیقه` : `${h} ساعت`)
}
