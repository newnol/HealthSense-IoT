import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/landing.module.css'

const Header = ({ onShowAuthModal }) => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInLeft" className={styles.logo}>
          <h2>💓 HealthSense</h2>
        </AnimatedElement>
        <AnimatedElement animation="fadeInRight" className="nav">
          <button 
            className={styles.btnLogin}
            onClick={onShowAuthModal}
          >
            Đăng nhập
          </button>
        </AnimatedElement>
      </div>
    </header>
  )
}

export default Header
