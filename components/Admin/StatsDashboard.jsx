import { useState, useEffect } from 'react'
import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/admin.module.css'

const StatsDashboard = ({ stats, users, devices }) => {
  const [timeRange, setTimeRange] = useState('7d') // 1d, 7d, 30d
  
  // Calculate additional stats
  const activeUsers = users?.filter(user => !user.disabled).length || 0
  const adminUsers = users?.filter(user => user.admin).length || 0
  const recentDevices = devices?.filter(device => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return new Date(device.registeredAt) > oneWeekAgo
  }).length || 0

  const chartData = [
    { label: 'Người dùng hoạt động', value: activeUsers, total: users?.length || 0, color: '#10b981', icon: '👥' },
    { label: 'Admin', value: adminUsers, total: users?.length || 0, color: '#8b5cf6', icon: '🛡️' },
    { label: 'Thiết bị mới (7 ngày)', value: recentDevices, total: devices?.length || 0, color: '#f59e0b', icon: '📱' },
    { label: 'Thiết bị hoạt động', value: devices?.length || 0, total: devices?.length || 0, color: '#06b6d4', icon: '⚡' }
  ]

  return (
    <div className={styles.statsDashboard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <h2>📊 Thống kê tổng quan</h2>
          <p>Dữ liệu realtime của hệ thống</p>
        </div>
        
        <div className={styles.timeRangeSelector}>
          {['1d', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`${styles.timeBtn} ${timeRange === range ? styles.active : ''}`}
            >
              {range === '1d' ? '24h' : range === '7d' ? '7 ngày' : '30 ngày'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {/* Main Stats Cards */}
        <AnimatedElement animation="fadeInUp" delay={100} className={styles.mainStatCard}>
          <div className={styles.statCardHeader}>
            <div className={styles.statCardIcon}>👥</div>
            <div className={styles.statCardTitle}>
              <h3>Tổng người dùng</h3>
              <div className={styles.statTrend}>
                <span className={styles.trendIcon}>↗</span>
                <span className={styles.trendText}>+12% tuần này</span>
              </div>
            </div>
          </div>
          <div className={styles.statCardValue}>
            {stats?.userCount || 0}
          </div>
          <div className={styles.statCardProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: '75%', backgroundColor: '#10b981' }}
              ></div>
            </div>
            <span className={styles.progressText}>{activeUsers} hoạt động</span>
          </div>
        </AnimatedElement>

        <AnimatedElement animation="fadeInUp" delay={200} className={styles.mainStatCard}>
          <div className={styles.statCardHeader}>
            <div className={styles.statCardIcon}>📱</div>
            <div className={styles.statCardTitle}>
              <h3>Tổng thiết bị</h3>
              <div className={styles.statTrend}>
                <span className={styles.trendIcon}>↗</span>
                <span className={styles.trendText}>+{recentDevices} mới</span>
              </div>
            </div>
          </div>
          <div className={styles.statCardValue}>
            {stats?.deviceCount || 0}
          </div>
          <div className={styles.statCardProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: '90%', backgroundColor: '#f59e0b' }}
              ></div>
            </div>
            <span className={styles.progressText}>90% hoạt động</span>
          </div>
        </AnimatedElement>

        <AnimatedElement animation="fadeInUp" delay={300} className={styles.mainStatCard}>
          <div className={styles.statCardHeader}>
            <div className={styles.statCardIcon}>📊</div>
            <div className={styles.statCardTitle}>
              <h3>Dữ liệu thu thập</h3>
              <div className={styles.statTrend}>
                <span className={styles.trendIcon}>↗</span>
                <span className={styles.trendText}>+2.5k hôm nay</span>
              </div>
            </div>
          </div>
          <div className={styles.statCardValue}>
            {stats?.totalRecords ? (stats.totalRecords / 1000).toFixed(1) + 'k' : '0'}
          </div>
          <div className={styles.statCardProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: '85%', backgroundColor: '#8b5cf6' }}
              ></div>
            </div>
            <span className={styles.progressText}>85% mục tiêu</span>
          </div>
        </AnimatedElement>
      </div>

      {/* Detailed Charts */}
      <div className={styles.chartsGrid}>
        <AnimatedElement animation="fadeInLeft" delay={400} className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Phân tích người dùng</h3>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#10b981' }}></div>
                <span>Hoạt động</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#ef4444' }}></div>
                <span>Vô hiệu hóa</span>
              </div>
            </div>
          </div>
          <div className={styles.chartContent}>
            <div className={styles.pieChart}>
              <div className={styles.pieSlice} style={{ 
                background: `conic-gradient(#10b981 0deg ${(activeUsers / (users?.length || 1)) * 360}deg, #ef4444 ${(activeUsers / (users?.length || 1)) * 360}deg 360deg)` 
              }}>
                <div className={styles.pieCenter}>
                  <div className={styles.pieValue}>{activeUsers}</div>
                  <div className={styles.pieLabel}>Hoạt động</div>
                </div>
              </div>
            </div>
            <div className={styles.chartStats}>
              <div className={styles.chartStat}>
                <span className={styles.chartStatValue}>{activeUsers}</span>
                <span className={styles.chartStatLabel}>Hoạt động</span>
              </div>
              <div className={styles.chartStat}>
                <span className={styles.chartStatValue}>{(users?.length || 0) - activeUsers}</span>
                <span className={styles.chartStatLabel}>Vô hiệu hóa</span>
              </div>
              <div className={styles.chartStat}>
                <span className={styles.chartStatValue}>{adminUsers}</span>
                <span className={styles.chartStatLabel}>Admin</span>
              </div>
            </div>
          </div>
        </AnimatedElement>

        <AnimatedElement animation="fadeInRight" delay={500} className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Hoạt động thiết bị</h3>
            <div className={styles.chartSubtitle}>7 ngày gần đây</div>
          </div>
          <div className={styles.chartContent}>
            <div className={styles.barChart}>
              {[...Array(7)].map((_, i) => {
                const height = Math.random() * 80 + 20
                const day = new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000)
                return (
                  <div key={i} className={styles.barItem}>
                    <div 
                      className={styles.bar} 
                      style={{ height: `${height}%`, backgroundColor: '#06b6d4' }}
                    ></div>
                    <div className={styles.barLabel}>
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={styles.chartFooter}>
              <div className={styles.chartMetric}>
                <span className={styles.metricValue}>2.4k</span>
                <span className={styles.metricLabel}>Trung bình/ngày</span>
              </div>
              <div className={styles.chartMetric}>
                <span className={styles.metricValue}>+15%</span>
                <span className={styles.metricLabel}>So với tuần trước</span>
              </div>
            </div>
          </div>
        </AnimatedElement>
      </div>
    </div>
  )
}

export default StatsDashboard
