import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAdmin } from '../contexts/AdminContext'
import { useRouter } from 'next/router'
import useRecords from '../hooks/useRecords'
import HeartRateChart from '../components/HeartRateChart'
import Spo2Chart from '../components/Spo2Chart'
import StatsCards from '../components/StatsCards'
import TimeRangeControls from '../components/TimeRangeControls'
import AnimatedElement from '../components/AnimatedElement'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAnime } from '../hooks/useAnime.jsx'

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const [range, setRange] = useState(24) // hours
  const { records, loading: dataLoading } = useRecords({ limit: 1000, pollMs: 15000 })
  const { animate } = useAnime()

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing')
    }
  }, [user, loading, router])

  // Records fetching is handled by useRecords

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/landing')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Animate stats when data loads
  useEffect(() => {
    if (!dataLoading && records.length > 0) {
      animate('.stat-value', {
        innerHTML: [0, (el) => el.getAttribute('data-value')],
        duration: 1500,
        easing: 'easeOutExpo',
        round: 1
      })
    }
  }, [dataLoading, records, animate])

  if (loading) {
    return (
      <div className="loading-container">
        <div>Đang tải...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  // Calculate filtered records and averages for Health Insights
  const toMs = (ts) => (!ts ? 0 : ts < 1e12 ? ts * 1000 : ts)
  const nowMs = Date.now()
  const cutoffMs = nowMs - range * 3600 * 1000
  const filtered = (records || []).filter((r) => toMs(r.ts) >= cutoffMs)

  const avgBpm = filtered.length > 0
    ? Math.round(
        filtered.reduce((sum, r) => sum + (r.heart_rate ?? r.bpm ?? 0), 0) /
          filtered.length
      )
    : 0
  const avgSpo2 = filtered.length > 0
    ? Math.round(
        (filtered.reduce((sum, r) => sum + (r.spo2 ?? 0), 0) / filtered.length) * 10
      ) / 10
    : 0

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="container">
          <AnimatedElement animation="fadeInLeft" className="header-title">
            <h1>💓 Dashboard Sức khỏe</h1>
          </AnimatedElement>
          <AnimatedElement animation="fadeInRight" className="user-info">
            <span>Xin chào, {user.email}</span>
            <button 
              onClick={() => router.push('/profile')}
              className="btn-profile"
            >
              Hồ sơ
            </button>
            <button 
              onClick={() => router.push('/device-setup')}
              className="btn-setup"
            >
              Thiết bị
            </button>
            <button 
              onClick={() => router.push('/ai')}
              className="btn-admin"
            >
              AI Chat
            </button>
            {isAdmin && (
              <button 
                onClick={() => router.push('/admin')}
                className="btn-admin"
              >
                Admin Panel
              </button>
            )}
            <button onClick={handleLogout} className="btn-logout">
              Đăng xuất
            </button>
          </AnimatedElement>
        </div>
      </header>

      <div className="container">
        {/* Stats Cards */}
        <StatsCards records={records} rangeHours={range} loading={dataLoading} />

        {/* Time Range Selector */}
        <TimeRangeControls range={range} setRange={setRange} />

        {/* Chart */}
        {dataLoading ? (
          <div className="chart-loading">
            <LoadingSpinner size="large" color="#0070f3" />
            <div style={{ marginTop: '0.75rem' }}>Đang tải dữ liệu...</div>
          </div>
        ) : (
          <div className="charts-grid">
            <HeartRateChart records={records} rangeHours={range} />
            <Spo2Chart records={records} rangeHours={range} />
          </div>
        )}

        {/* Health Insights */}
        {filtered.length > 0 && (
          <div className="insights">
            <div className="insights-header">
              <h3>📋 Nhận xét sức khỏe</h3>
              <div className="insights-meta">Dựa trên {range} giờ gần nhất • Cập nhật lúc {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Nhịp tim</h4>
                <p>
                  {avgBpm < 60 
                    ? '⚠️ Nhịp tim hơi chậm. Nên tham khảo ý kiến bác sĩ.'
                    : avgBpm > 100
                    ? '⚠️ Nhịp tim hơi nhanh. Hãy nghỉ ngơi và thư giãn.'
                    : '✅ Nhịp tim trong giới hạn bình thường.'
                  }
                </p>
              </div>
              
              <div className="insight-card">
                <h4>SpO₂</h4>
                <p>
                  {avgSpo2 < 95
                    ? '⚠️ Nồng độ oxy trong máu thấp. Cần kiểm tra sức khỏe.'
                    : '✅ Nồng độ oxy trong máu tốt.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background-color: #f8f9fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header {
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 1rem 0;
          margin-bottom: 2rem;
        }

        .header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header h1 {
          color: #333;
          margin: 0;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info span {
          color: #666;
        }

        .btn-logout, .btn-setup, .btn-admin, .btn-profile {
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;
          font-weight: 500;
        }

        .btn-profile {
          background: #17a2b8;
          color: white;
        }

        .btn-profile:hover {
          background: #138496;
        }

        .btn-logout {
          background: #dc3545;
          color: white;
        }

        .btn-logout:hover {
          background: #c82333;
        }

        .btn-setup {
          background: #28a745;
          color: white;
          margin-right: 0.5rem;
        }
        
        .btn-admin {
          background: #6f42c1;
          color: white;
          margin-right: 0.5rem;
        }
        
        .btn-admin:hover {
          background: #5a32a3;
        }

        .btn-setup:hover {
          background: #218838;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #666;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid #eef0f2;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .controls {
          background: white;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
          position: sticky;
          top: 0.5rem;
          z-index: 5;
        }

        .time-range {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .time-range span {
          font-weight: 500;
          color: #333;
        }

        .btn-range {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #495057;
          padding: 0.45rem 0.9rem;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-range:hover {
          background: #e9ecef;
          transform: translateY(-1px);
        }

        .btn-range.active {
          background: #0070f3;
          color: white;
          border-color: #0070f3;
          box-shadow: 0 4px 12px rgba(0,112,243,0.25);
        }

        .chart-container {
          background: white;
          padding: 1rem 1rem 0.5rem 1rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          min-height: 420px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-title {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .chart-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          height: 420px;
          color: #666;
        }

        .no-data {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-data-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .no-data h3 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .insights {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .insights h3 {
          color: #333;
          margin-bottom: 1.5rem;
        }

        .insights-header { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
        .insights-meta { color: #6b7280; font-size: 0.9rem; }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .insight-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #0070f3;
        }

        .insight-card h4 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .insight-card p {
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .header .container {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .time-range {
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .insights-grid {
            grid-template-columns: 1fr;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Skeleton Loading */
        .skeleton {
          position: relative;
          overflow: hidden;
          background-color: #eef1f4;
          border-radius: 6px;
        }
        .skeleton::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0));
          animation: shimmer 1.2s infinite;
        }
        .skel-icon { width: 2.5rem; height: 2.5rem; border-radius: 999px; }
        .skel-line-lg { width: 60%; height: 22px; margin-bottom: 8px; }
        .skel-line-sm { width: 40%; height: 12px; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  )
}
