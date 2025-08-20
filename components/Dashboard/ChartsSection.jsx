import HeartRateChart from '../HeartRateChart'
import Spo2Chart from '../Spo2Chart'
import LoadingSpinner from '../LoadingSpinner'
import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/dashboard.module.css'

const ChartsSection = ({ records, rangeHours, dataLoading }) => {
  if (dataLoading) {
    return (
      <AnimatedElement animation="fadeInUp" className={styles.chartLoading}>
        <div className={styles.loadingSpinner}>
          <LoadingSpinner size="large" color="#0070f3" />
        </div>
        <div className={styles.loadingText}>Đang tải dữ liệu biểu đồ...</div>
        <div className={styles.loadingSubtext}>Vui lòng chờ trong giây lát</div>
      </AnimatedElement>
    )
  }

  return (
    <AnimatedElement animation="fadeInUp" delay={200} className={styles.chartsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>📊 Biểu đồ theo dõi</h2>
        <div className={styles.sectionSubtitle}>
          Dữ liệu {rangeHours} giờ gần nhất • {records?.length || 0} điểm dữ liệu
        </div>
      </div>
      
      <div className={styles.chartsGrid}>
        <AnimatedElement animation="slideInLeft" delay={100} className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartIcon}>💓</div>
            <div className={styles.chartInfo}>
              <h3 className={styles.chartTitle}>Nhịp tim (BPM)</h3>
              <div className={styles.chartMeta}>Real-time monitoring</div>
            </div>
            <div className={styles.chartStatus}>
              <div className={styles.statusIndicator}></div>
              <span>Đang hoạt động</span>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <HeartRateChart records={records} rangeHours={rangeHours} />
          </div>
        </AnimatedElement>

        <AnimatedElement animation="slideInRight" delay={200} className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartIcon}>🫁</div>
            <div className={styles.chartInfo}>
              <h3 className={styles.chartTitle}>SpO₂ (%)</h3>
              <div className={styles.chartMeta}>Oxygen saturation</div>
            </div>
            <div className={styles.chartStatus}>
              <div className={styles.statusIndicator}></div>
              <span>Đang hoạt động</span>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <Spo2Chart records={records} rangeHours={rangeHours} />
          </div>
        </AnimatedElement>
      </div>

      {(!records || records.length === 0) && (
        <div className={styles.noData}>
          <div className={styles.noDataIcon}>📈</div>
          <h3>Chưa có dữ liệu</h3>
          <p>Hãy kết nối thiết bị để bắt đầu theo dõi sức khỏe</p>
          <button className={styles.btnSetupDevice}>
            Thiết lập thiết bị
          </button>
        </div>
      )}
    </AnimatedElement>
  )
}

export default ChartsSection
