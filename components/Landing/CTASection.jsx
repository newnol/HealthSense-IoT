import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/landing.module.css'

const CTASection = ({ onShowAuthModal }) => {
  const features = [
    {
      icon: "✅",
      text: "Miễn phí"
    },
    {
      icon: "✅", 
      text: "Server nhanh hiệu quả"
    },
    {
      icon: "✅",
      text: "Hỗ trợ nhanh chóng"
    }
  ]

  return (
    <section className={styles.cta}>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInUp" trigger="onScroll" className={styles.ctaContent}>
          <h2>Sẵn sàng theo dõi sức khỏe của bạn?</h2>
          <p>Tham gia cùng hàng ngàn người dùng đã tin tưởng HealthSense</p>
          <div className={styles.ctaFeatures}>
            {features.map((feature, index) => (
              <div key={index} className={styles.ctaFeature}>
                <span className={styles.featureCheck}>{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
          <button 
            className={`${styles.btnPrimary} ${styles.large} ${styles.pulseBtn}`}
            onClick={onShowAuthModal}
          >
            <span>🚀 Đăng ký miễn phí</span>
          </button>
          <p className={styles.ctaNote}>
            Đã có tài khoản? <a href="#" onClick={onShowAuthModal}>Đăng nhập ngay</a>
          </p>
        </AnimatedElement>
      </div>
    </section>
  )
}

export default CTASection