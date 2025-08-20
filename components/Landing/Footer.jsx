import styles from '../../styles/components/landing.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>💓 HealthSense</h3>
            <p>Hệ thống giám sát sức khỏe thông minh với công nghệ AI</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Liên hệ</h4>
            <p>Email: support@HealthSense.com</p>
            <p>Phone: +84 123 456 789</p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 HealthSense. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer