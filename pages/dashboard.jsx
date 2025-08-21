import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAdmin } from '../contexts/AdminContext'
import { useRouter } from 'next/router'
import useRecords from '../hooks/useRecords'
import { useAnime } from '../hooks/useAnime.jsx'

// Dashboard Components
import DashboardHeader from '../components/Dashboard/DashboardHeader'
import ChartsSection from '../components/Dashboard/ChartsSection'
import HealthInsights from '../components/Dashboard/HealthInsights'
import StatsCards from '../components/StatsCards'
import RangeDatePicker from '../components/RangeDatePicker'
import AnimatedElement from '../components/AnimatedElement'

// Styles
import styles from '../styles/components/dashboard.module.css'

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const [range, setRange] = useState(null) // hours quick preset; now unused
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)

  // Close picker on outside click / ESC
  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])
  const { records, loading: dataLoading } = useRecords({ limit: 1000, pollMs: 15000 })
  const { animate } = useAnime()

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing')
    }
  }, [user, loading, router])

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

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/landing')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div>⏳</div>
        </div>
        <div className={styles.loadingText}>Đang tải dashboard...</div>
        <div className={styles.loadingSubtext}>Vui lòng chờ trong giây lát</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className={styles.dashboard}>
      <DashboardHeader 
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <div className={styles.container}>
        {/* Stats Cards */}
        <AnimatedElement animation="fadeInUp" delay={100}>
          <StatsCards records={records} rangeHours={range} dateRange={dateRange} loading={dataLoading} />
        </AnimatedElement>

        {/* Time Range Selector */}
        <AnimatedElement animation="fadeInUp" delay={200} className={styles.rangePickerSection}>
          <div className={styles.rangePickerLayer} style={{ position: 'relative', display: 'inline-block' }} ref={pickerRef}>
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className={styles.rangeToggleBtn}
              aria-expanded={pickerOpen}
            >
              {dateRange?.start && dateRange?.end
                ? `${dateRange.start} → ${dateRange.end}`
                : 'Chọn khoảng thời gian'}
            </button>
            {pickerOpen && (
              <div className={styles.rangePopover} role="dialog" aria-label="Chọn khoảng thời gian">
                <RangeDatePicker value={dateRange} onChange={setDateRange} onClose={() => setPickerOpen(false)} />
              </div>
            )}
          </div>
        </AnimatedElement>

        {/* Charts Section */}
        <ChartsSection 
          records={records} 
          rangeHours={range} 
          dateRange={dateRange}
          dataLoading={dataLoading} 
        />

        {/* Health Insights */}
        <HealthInsights 
          records={records} 
          rangeHours={range} 
          dateRange={dateRange}
        />
      </div>
    </div>
  )
}
