import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/landing.module.css'

const HeroSection = ({ onShowAuthModal }) => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.particles}>
          {[...Array(50)].map((_, i) => (
            <div key={i} className={`${styles.particle} ${styles[`particle${i % 5}`]}`}></div>
          ))}
        </div>
      </div>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInUp" delay={200} className="hero-content">
          <div className={styles.heroBadge}>
            <span className="badge-text">🚀 Công nghệ IoT tiên tiến</span>
          </div>
          <h1>
            Theo dõi sức khỏe <br/>
            <span className={styles.gradientText}>thông minh với AI</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Hệ thống giám sát nhịp tim và SpO2 tiên tiến với ESP32, 
            cung cấp phân tích AI và lời khuyên sức khỏe cá nhân hóa
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statNumber}>24/7</span>
              <span className={styles.statLabel}>Giám sát</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statNumber}>90%</span>
              <span className={styles.statLabel}>Độ chính xác</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statNumber}>AI</span>
              <span className={styles.statLabel}>Phân tích</span>
            </div>
          </div>
          <div className={styles.heroButtons}>
            <button 
              className={`${styles.btnPrimary} ${styles.shimmerBtn}`}
              onClick={onShowAuthModal}
            >
              <span>Bắt đầu ngay</span>
              <div className={styles.btnShine}></div>
            </button>
            <button className={`${styles.btnSecondary} ${styles.glassBtn}`}>
              <span>📹 Xem demo</span>
            </button>
          </div>
        </AnimatedElement>
        <AnimatedElement animation="scaleIn" delay={400} className="hero-image">
          <div className={styles.deviceMockup}>
            <div className={styles.deviceGlow}></div>
            <div className={styles.screen}>
              <div className={styles.screenHeader}>
                <div className={styles.statusIndicator}></div>
                <span className={styles.deviceTitle}>HealthSense Monitor</span>
                <div className={styles.signalBars}>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              </div>
              <div className={styles.healthStats}>
                <div className={`${styles.stat} ${styles.pulseAnimation}`}>
                  <div className={styles.statIcon}>💓</div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Nhịp tim</span>
                    <div className={styles.statMain}>
                      <span className={styles.statValue} data-value="72">110</span>
                      <span className={styles.statUnit}>BPM</span>
                    </div>
                    <div className={`${styles.statTrend} ${styles.up}`}>↗ +2 từ hôm qua</div>
                  </div>
                  <div className={styles.statChart}>
                    <svg width="60" height="30" viewBox="0 0 60 30">
                      <polyline
                        points="0,15 10,10 20,5 30,12 40,8 50,15 60,10"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        className={styles.heartbeatLine}
                      />
                    </svg>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statIcon}>🫁</div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>SpO₂</span>
                    <div className={styles.statMain}>
                      <span className={styles.statValue} data-value="98">100</span>
                      <span className={styles.statUnit}>%</span>
                    </div>
                    <div className={`${styles.statTrend} ${styles.stable}`}>→ Bình thường</div>
                  </div>
                  <div className={styles.oxygenLevel}>
                    <div className={styles.oxygenBar}>
                      <div className={styles.oxygenFill} style={{width: '98%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.aiInsights}>
                <div className={styles.insightHeader}>
                  <span className={styles.aiIcon}>🤖</span>
                  <span>Phân tích AI</span>
                </div>
                <div className={styles.insightText}>Chỉ số sức khỏe của bạn trong tình trạng tốt</div>
              </div>
            </div>
          </div>
        </AnimatedElement>
      </div>
    </section>
  )
}

export default HeroSection