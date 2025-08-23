import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/landing.module.css'

const StatsSection = () => {
  return (
    <section className={styles.statsSection}>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInUp" trigger="onScroll" className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconLarge}>📱</div>
            <div className={styles.statNumber} data-value="1">4</div>
            <div className={styles.statDescription}>Ứng dụng di động</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconLarge}>📊</div>
            <div className={styles.statNumber} data-value="2">2</div>
            <div className={styles.statDescription}>Chỉ số theo dõi</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconLarge}>⚡</div>
            <div className={styles.statNumber} data-value="24">24h</div>
            <div className={styles.statDescription}>Giờ giám sát</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconLarge}>🔬</div>
            <div className={styles.statNumber} data-value="1">10</div>
            <div className={styles.statDescription}>Cảm biến ESP32</div>
          </div>
        </AnimatedElement>
      </div>
    </section>
  )
}

export default StatsSection
