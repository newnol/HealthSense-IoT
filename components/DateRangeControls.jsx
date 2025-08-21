// components/DateRangeControls.jsx
export default function DateRangeControls({ dateRange, setDateRange }) {
  const start = dateRange?.start || ''
  const end = dateRange?.end || ''

  const onChange = (key) => (e) => {
    setDateRange({ ...dateRange, [key]: e.target.value })
  }

  const onClear = () => setDateRange({ start: '', end: '' })

  const disabled = !start || !end || new Date(`${start}T00:00:00`).getTime() > new Date(`${end}T23:59:59.999`).getTime()

  return (
    <div className="controls">
      <div className="time-range">
        <span>Khoảng thời gian:</span>
        <input
          type="date"
          value={start}
          onChange={onChange('start')}
          aria-label="Ngày bắt đầu"
          className="date-input"
        />
        <span className="sep">→</span>
        <input
          type="date"
          value={end}
          onChange={onChange('end')}
          aria-label="Ngày kết thúc"
          className="date-input"
        />
        <button
          className="btn-range"
          disabled={disabled}
          onClick={() => setDateRange({ start, end })}
        >
          Áp dụng
        </button>
        <button className="btn-range" onClick={onClear}>Xóa</button>
      </div>
      <style jsx>{`
        .time-range { display: flex; align-items: center; gap: 8px; }
        .date-input { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 6px; }
        .btn-range { padding: 6px 10px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; }
        .btn-range:disabled { opacity: 0.5; cursor: not-allowed; }
        .sep { color: #9ca3af; }
      `}</style>
    </div>
  )
}



