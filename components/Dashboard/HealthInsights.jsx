import { useMemo } from 'react'
import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/dashboard.module.css'

const HealthInsights = ({ records, rangeHours }) => {
  const insights = useMemo(() => {
    if (!records || records.length === 0) return null

    const toMs = (ts) => (!ts ? 0 : ts < 1e12 ? ts * 1000 : ts)
    const nowMs = Date.now()
    const cutoffMs = nowMs - rangeHours * 3600 * 1000
    const filtered = records.filter((r) => toMs(r.ts) >= cutoffMs)

    if (filtered.length === 0) return null

    const avgBpm = Math.round(
      filtered.reduce((sum, r) => sum + (r.heart_rate ?? r.bpm ?? 0), 0) /
        filtered.length
    )
    const avgSpo2 = Math.round(
      (filtered.reduce((sum, r) => sum + (r.spo2 ?? 0), 0) / filtered.length) * 10
    ) / 10

    const minBpm = Math.min(...filtered.map(r => r.heart_rate ?? r.bpm ?? 0))
    const maxBpm = Math.max(...filtered.map(r => r.heart_rate ?? r.bpm ?? 0))
    const minSpo2 = Math.min(...filtered.map(r => r.spo2 ?? 0))
    const maxSpo2 = Math.max(...filtered.map(r => r.spo2 ?? 0))

    return {
      avgBpm,
      avgSpo2,
      minBpm,
      maxBpm,
      minSpo2,
      maxSpo2,
      dataPoints: filtered.length,
      lastUpdate: new Date(Math.max(...filtered.map(r => toMs(r.ts))))
    }
  }, [records, rangeHours])

  if (!insights) {
    return (
      <AnimatedElement animation="fadeInUp" className={styles.noInsights}>
        <div className={styles.noInsightsIcon}>📋</div>
        <h3>Chưa có đủ dữ liệu</h3>
        <p>Cần ít nhất một số dữ liệu để hiển thị nhận xét sức khỏe</p>
      </AnimatedElement>
    )
  }

  const getHeartRateStatus = (bpm) => {
    if (bpm < 60) return { 
      status: 'warning', 
      icon: '⚠️', 
      message: 'Nhịp tim hơi chậm. Nên tham khảo ý kiến bác sĩ.',
      color: '#f59e0b'
    }
    if (bpm > 100) return { 
      status: 'warning', 
      icon: '⚠️', 
      message: 'Nhịp tim hơi nhanh. Hãy nghỉ ngơi và thư giãn.',
      color: '#ef4444'
    }
    return { 
      status: 'good', 
      icon: '✅', 
      message: 'Nhịp tim trong giới hạn bình thường.',
      color: '#10b981'
    }
  }

  const getSpo2Status = (spo2) => {
    if (spo2 < 95) return { 
      status: 'warning', 
      icon: '⚠️', 
      message: 'Nồng độ oxy trong máu thấp. Cần kiểm tra sức khỏe.',
      color: '#ef4444'
    }
    return { 
      status: 'good', 
      icon: '✅', 
      message: 'Nồng độ oxy trong máu tốt.',
      color: '#10b981'
    }
  }

  const heartRateStatus = getHeartRateStatus(insights.avgBpm)
  const spo2Status = getSpo2Status(insights.avgSpo2)

  return (
    <AnimatedElement animation="fadeInUp" delay={300} className={styles.insights}>
      <div className={styles.insightsHeader}>
        <div className={styles.insightsTitle}>
          <h3>📋 Nhận xét sức khỏe</h3>
          <div className={styles.aiLabel}>
            <span className={styles.aiIcon}>🤖</span>
            <span>AI Analysis</span>
          </div>
        </div>
        <div className={styles.insightsMeta}>
          Dựa trên {rangeHours} giờ gần nhất • {insights.dataPoints} điểm dữ liệu
          <br />
          Cập nhật lúc {insights.lastUpdate.toLocaleString('vi-VN')}
        </div>
      </div>

      <div className={styles.insightsGrid}>
        <AnimatedElement animation="slideInLeft" delay={100} className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <div className={styles.insightIcon} style={{ color: heartRateStatus.color }}>
              {heartRateStatus.icon}
            </div>
            <div className={styles.insightTitle}>
              <h4>Nhịp tim</h4>
              <div className={styles.insightSubtitle}>Heart Rate Analysis</div>
            </div>
          </div>
          
          <div className={styles.insightStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Trung bình</span>
              <span className={styles.statValue}>{insights.avgBpm} BPM</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Khoảng</span>
              <span className={styles.statValue}>{insights.minBpm} - {insights.maxBpm} BPM</span>
            </div>
          </div>
          
          <div className={styles.insightMessage} style={{ borderLeftColor: heartRateStatus.color }}>
            {heartRateStatus.message}
          </div>
          
          <div className={styles.insightProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ 
                  width: `${Math.min((insights.avgBpm / 120) * 100, 100)}%`,
                  backgroundColor: heartRateStatus.color
                }}
              ></div>
            </div>
            <div className={styles.progressLabels}>
              <span>0</span>
              <span>60</span>
              <span>100</span>
              <span>120+</span>
            </div>
          </div>
        </AnimatedElement>
        
        <AnimatedElement animation="slideInRight" delay={200} className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <div className={styles.insightIcon} style={{ color: spo2Status.color }}>
              {spo2Status.icon}
            </div>
            <div className={styles.insightTitle}>
              <h4>SpO₂</h4>
              <div className={styles.insightSubtitle}>Oxygen Saturation</div>
            </div>
          </div>
          
          <div className={styles.insightStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Trung bình</span>
              <span className={styles.statValue}>{insights.avgSpo2}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Khoảng</span>
              <span className={styles.statValue}>{insights.minSpo2} - {insights.maxSpo2}%</span>
            </div>
          </div>
          
          <div className={styles.insightMessage} style={{ borderLeftColor: spo2Status.color }}>
            {spo2Status.message}
          </div>
          
          <div className={styles.insightProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ 
                  width: `${Math.min(((insights.avgSpo2 - 90) / 10) * 100, 100)}%`,
                  backgroundColor: spo2Status.color
                }}
              ></div>
            </div>
            <div className={styles.progressLabels}>
              <span>90%</span>
              <span>95%</span>
              <span>98%</span>
              <span>100%</span>
            </div>
          </div>
        </AnimatedElement>
      </div>

      <div className={styles.insightsFooter}>
        <div className={styles.disclaimerIcon}>ℹ️</div>
        <div className={styles.disclaimer}>
          <strong>Lưu ý:</strong> Những nhận xét này chỉ mang tính chất tham khảo. 
          Hãy tham khảo ý kiến bác sĩ nếu có bất kỳ lo lắng nào về sức khỏe.
        </div>
      </div>
    </AnimatedElement>
  )
}

export default HealthInsights
