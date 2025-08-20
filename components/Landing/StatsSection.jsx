import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/landing.module.css'

const StatsSection = () => {
  return (
    <section className={styles.statsSection}>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInUp" trigger="onScroll" className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconLarge}>👥</div>
            <div className={styles.statNumber} data-value="10000">0</div>
            <div className={styles.statDescription}>Người dùng tin tưởng</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconLarge}>📊</div>
            <div className={styles.statNumber} data-value="1000000">0</div>
            <div className={styles.statDescription}>Dữ liệu đã phân tích</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconLarge}>⚡</div>
            <div className={styles.statNumber} data-value="99">0</div>
            <div className={styles.statDescription}>% Uptime</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconLarge}>🏥</div>
            <div className={styles.statNumber} data-value="50">0</div>
            <div className={styles.statDescription}>Bệnh viện đối tác</div>
          </div>
        </AnimatedElement>
      </div>
    </section>
  )
}

export default StatsSection
