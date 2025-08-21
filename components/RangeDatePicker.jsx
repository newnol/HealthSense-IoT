import { useState, useMemo, useEffect } from 'react'

// Lightweight single-calendar range picker using native Date without deps
// UX: click start → click end; supports navigating months
export default function RangeDatePicker({ value, onChange, onClose, className = '' }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-11
  const [tempStart, setTempStart] = useState(value?.start || '')
  const [tempEnd, setTempEnd] = useState(value?.end || '')
  const start = tempStart ? new Date(tempStart) : null
  const end = tempEnd ? new Date(tempEnd) : null

  useEffect(() => {
    setTempStart(value?.start || '')
    setTempEnd(value?.end || '')
  }, [value?.start, value?.end])

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay() // 0:Sun

  const grid = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth)
    const firstDow = firstDayOfMonth(viewYear, viewMonth)
    const cells = []
    const leading = (firstDow + 6) % 7 // make Monday-first
    for (let i = 0; i < leading; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(viewYear, viewMonth, d))
    const trailing = (7 - (cells.length % 7)) % 7
    for (let i = 0; i < trailing; i++) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const isInRange = (d) => {
    if (!d || !start || !end) return false
    const ds = d.setHours(0,0,0,0)
    const ss = new Date(start).setHours(0,0,0,0)
    const es = new Date(end).setHours(0,0,0,0)
    return ds >= ss && ds <= es
  }

  const handleDayClick = (d) => {
    if (!d) return
    const iso = d.toISOString().slice(0, 10)
    // First click or reset: set start only, do not commit
    if (!start || (start && end)) {
      setTempStart(iso)
      setTempEnd('')
      return
    }
    // Second click: determine order, set both and commit
    const startDate = new Date(start)
    if (d < startDate) {
      setTempStart(iso)
      setTempEnd(start.toISOString().slice(0, 10))
      onChange?.({ start: iso, end: start.toISOString().slice(0, 10) })
      onClose?.()
    } else {
      setTempEnd(iso)
      onChange?.({ start: start.toISOString().slice(0, 10), end: iso })
      onClose?.()
    }
  }

  const prevMonth = () => {
    const m = viewMonth - 1
    if (m < 0) { setViewMonth(11); setViewYear(viewYear - 1) } else { setViewMonth(m) }
  }
  const nextMonth = () => {
    const m = viewMonth + 1
    if (m > 11) { setViewMonth(0); setViewYear(viewYear + 1) } else { setViewMonth(m) }
  }

  const clear = () => { setTempStart(''); setTempEnd(''); onChange?.({ start: '', end: '' }); onClose?.() }

  return (
    <div className={`range-date-picker ${className}`}>
      <div className="rdp-toolbar">
        <button className="rdp-nav" onClick={prevMonth} aria-label="Tháng trước">‹</button>
        <div className="rdp-title">
          {new Date(viewYear, viewMonth, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </div>
        <button className="rdp-nav" onClick={nextMonth} aria-label="Tháng sau">›</button>
      </div>
      <div className="rdp-weekdays">
        {['T2','T3','T4','T5','T6','T7','CN'].map((d) => (<div key={d} className="rdp-wd">{d}</div>))}
      </div>
      <div className="rdp-grid">
        {grid.map((d, i) => {
          const selectedStart = d && start && isSameDay(d, start)
          const selectedEnd = d && end && isSameDay(d, end)
          const inRange = d && isInRange(new Date(d))
          return (
            <button
              key={i}
              className={`rdp-cell ${!d ? 'empty' : ''} ${selectedStart ? 'start' : ''} ${selectedEnd ? 'end' : ''} ${inRange ? 'in-range' : ''}`}
              disabled={!d}
              onClick={() => handleDayClick(d)}
            >
              {d ? d.getDate() : ''}
            </button>
          )
        })}
      </div>
      <div className="rdp-actions">
        <div className="rdp-selected">
          <span>{tempStart || '—'}</span>
          <span className="sep">→</span>
          <span>{tempEnd || '—'}</span>
        </div>
        <button className="rdp-btn" onClick={clear}>Xóa</button>
      </div>

      <style jsx>{`
        .range-date-picker { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        .rdp-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .rdp-title { font-weight: 700; color: #111827; text-transform: capitalize; }
        .rdp-nav { border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px; padding: 4px 10px; cursor: pointer; }
        .rdp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin: 6px 0; color: #6b7280; font-size: 0.85rem; }
        .rdp-wd { text-align: center; padding: 4px 0; }
        .rdp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .rdp-cell { height: 36px; border-radius: 8px; border: 1px solid transparent; background: #fff; cursor: pointer; color: #111827; }
        .rdp-cell.empty { cursor: default; background: transparent; border: none; }
        .rdp-cell:hover:not(.empty) { background: #f3f4f6; }
        .rdp-cell.in-range { background: #e0ecff; }
        .rdp-cell.start, .rdp-cell.end { background: #3b82f6; color: #fff; }
        .rdp-actions { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; }
        .rdp-selected { color: #374151; display: flex; align-items: center; gap: 6px; }
        .rdp-btn { border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
        .sep { color: #9ca3af; }
      `}</style>
    </div>
  )
}


