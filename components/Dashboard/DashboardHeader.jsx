import { useRouter } from 'next/router'
import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/dashboard.module.css'

const DashboardHeader = ({ user, isAdmin, onLogout }) => {
  const router = useRouter()

  const navigationItems = [
    {
      label: "Hồ sơ",
      path: "/profile",
      className: styles.btnProfile,
      icon: "👤"
    },
    {
      label: "Quản lý thiết bị",
      path: "/device-management", 
      className: styles.btnDeviceMgmt,
      icon: "📱",
      tooltip: "Đăng ký và quản lý thiết bị"
    },
    {
      label: "AI Chat",
      path: "/ai",
      className: styles.btnAi,
      icon: "🤖"
    }
  ]

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInLeft" className={styles.headerTitle}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>💓</div>
            <div>
              <h1>Dashboard Sức khỏe</h1>
              <div className={styles.subtitle}>Theo dõi sức khỏe thông minh</div>
            </div>
          </div>
        </AnimatedElement>
        
        <AnimatedElement animation="fadeInRight" className={styles.userInfo}>
          <div className={styles.userWelcome}>
            <div className={styles.userAvatar}>
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.welcomeText}>Xin chào,</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>
          
          <div className={styles.navButtons}>
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className={`${styles.navBtn} ${item.className}`}
                title={item.tooltip || item.label}
              >
                <span className={styles.btnIcon}>{item.icon}</span>
                <span className={styles.btnLabel}>{item.label}</span>
              </button>
            ))}
            
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className={`${styles.navBtn} ${styles.btnAdmin}`}
                title="Admin Panel"
              >
                <span className={styles.btnIcon}>🛠️</span>
                <span className={styles.btnLabel}>Admin Panel</span>
              </button>
            )}
            
            <button 
              onClick={onLogout} 
              className={`${styles.navBtn} ${styles.btnLogout}`}
              title="Đăng xuất"
            >
              <span className={styles.btnIcon}>🚪</span>
              <span className={styles.btnLabel}>Đăng xuất</span>
            </button>
          </div>
        </AnimatedElement>
      </div>
    </header>
  )
}

export default DashboardHeader
