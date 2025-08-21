// components/StatsCards.jsx
import AnimatedElement from './AnimatedElement'

export default function StatsCards({ records, rangeHours, dateRange, loading = false }) {
  const toMs = (ts) => (!ts ? 0 : ts < 1e12 ? ts * 1000 : ts)
  const nowMs = Date.now()
  const cutoffMs = rangeHours != null ? nowMs - rangeHours * 3600 * 1000 : null
  const startMs = dateRange?.start ? new Date(`${dateRange.start}T00:00:00`).getTime() : null
  const endMs = dateRange?.end ? new Date(`${dateRange.end}T23:59:59.999`).getTime() : null
  const filtered = (records || []).filter((r) => {
    const t = toMs(r.ts)
    if (startMs != null && endMs != null) return t >= startMs && t <= endMs
    if (cutoffMs != null) return t >= cutoffMs
    return true
  })

  const hasData = filtered.length > 0
  const avgBpm = hasData
    ? Math.round(filtered.reduce((sum, r) => sum + (r.heart_rate ?? r.bpm ?? 0), 0) / filtered.length)
    : null
  const avgSpo2 = hasData
    ? Math.round((filtered.reduce((sum, r) => sum + (r.spo2 ?? 0), 0) / filtered.length) * 10) / 10
    : null
  const last = hasData ? filtered[0] : null

  if (loading) {
    return (
      <>
        <div className="stats-grid">
          {[0, 1, 2, 3].map((i) => (
            <div className="stat-card" key={`skel-${i}`}>
              <div className="stat-icon"><div className="skeleton skel-icon"/></div>
              <div className="stat-content" style={{ width: '100%' }}>
                <div className="skeleton skel-line-lg" />
                <div className="skeleton skel-line-sm" />
              </div>
            </div>
          ))}
        </div>
        <style jsx>{`
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
          .stat-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 1rem; transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid #eef0f2; }
          .stat-icon { font-size: 1.75rem; }
          .skeleton { position: relative; overflow: hidden; background-color: #eef1f4; border-radius: 6px; }
          .skeleton::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0)); animation: shimmer 1.2s infinite; }
          .skel-icon { width: 2.5rem; height: 2.5rem; border-radius: 999px; }
          .skel-line-lg { width: 60%; height: 22px; margin-bottom: 8px; }
          .skel-line-sm { width: 40%; height: 12px; }
          @keyframes shimmer { 100% { transform: translateX(100%); } }
          @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
        `}</style>
      </>
    )
  }

  return (
    <>
      <div className="stats-grid">
        <AnimatedElement animation="fadeInUp" delay={0} className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <div className="stat-value-row">
              {hasData ? (
                <>
                  <div className="stat-value" data-value={avgBpm}>{avgBpm}</div>
                  <span className="stat-unit">BPM</span>
                </>
              ) : (
                <div className="stat-empty">—</div>
              )}
            </div>
            <div className="stat-label">{hasData ? 'Nhịp tim trung bình' : (dateRange?.start && dateRange?.end ? 'Chưa đủ dữ liệu trong khoảng đã chọn' : 'Chưa đủ dữ liệu')}</div>
          </div>
        </AnimatedElement>

        <AnimatedElement animation="fadeInUp" delay={100} className="stat-card">
          <div className="stat-icon">🫁</div>
          <div className="stat-content">
            <div className="stat-value-row">
              {hasData ? (
                <>
                  <div className="stat-value" data-value={avgSpo2}>{avgSpo2}</div>
                  <span className="stat-unit">%</span>
                </>
              ) : (
                <div className="stat-empty">—</div>
              )}
            </div>
            <div className="stat-label">{hasData ? 'SpO₂ trung bình' : (dateRange?.start && dateRange?.end ? 'Chưa đủ dữ liệu trong khoảng đã chọn' : 'Chưa đủ dữ liệu')}</div>
          </div>
        </AnimatedElement>

        <AnimatedElement animation="fadeInUp" delay={200} className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{filtered.length}</div>
            <div className="stat-label">Số lần đo</div>
          </div>
        </AnimatedElement>

        <AnimatedElement animation="fadeInUp" delay={300} className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            {dateRange?.start && dateRange?.end ? (
              <div className="stat-value-row">
                <div className="stat-value">{dateRange.start}</div>
                <span className="stat-unit">→</span>
                <div className="stat-value">{dateRange.end}</div>
              </div>
            ) : (
              <div className="stat-value-row">
                <div className="stat-value">—</div>
              </div>
            )}
            <div className="stat-label">Khoảng thời gian đang xem</div>
          </div>
        </AnimatedElement>
      </div>
      <style jsx>{`
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 1rem; transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid #eef0f2; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
        .stat-icon { font-size: 1.75rem; }
        .stat-value-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
        .stat-value { font-size: 1.8rem; font-weight: 700; color: #333; display: inline-block; }
        .stat-unit { color: #6b7280; font-weight: 600; }
        .stat-label { color: #666; font-size: 0.9rem; }
        .stat-empty { font-size: 1.8rem; font-weight: 700; color: #9ca3af; }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}

 


