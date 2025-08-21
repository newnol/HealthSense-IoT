import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/dashboard.module.css'

const DashboardHeader = ({ user, isAdmin, onLogout }) => {
  const router = useRouter()

  // User menu state & outside-click close
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    const handleEsc = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const menuItems = [
    { label: 'Hồ sơ', path: '/profile', icon: '👤' },
    { label: 'Quản lý thiết bị', path: '/device-management', icon: '📱', tooltip: 'Đăng ký và quản lý thiết bị' },
    { label: 'Quản lý lịch trình', path: '/schedule', icon: '⏰', tooltip: 'Lập lịch thông báo cho thiết bị' }
  ]
  if (isAdmin) {
    menuItems.push({ label: 'Admin Panel', path: '/admin', icon: '🛠️' })
  }

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
          {/* Optional quick action left of avatar: AI Chat */}
          <div className={styles.navButtons}>
            <button
              onClick={() => router.push('/ai')}
              className={`${styles.navBtn} ${styles.btnAi}`}
              title="AI Chat"
            >
              <span className={styles.btnIcon}>🤖</span>
              <span className={styles.btnLabel}>AI Chat</span>
            </button>
          </div>

          {/* Avatar + dropdown menu */}
          <div className={styles.userMenuWrapper} ref={menuRef}>
            <button
              className={styles.avatarButton}
              onClick={() => setMenuOpen((o) => !o)}
              title="Tài khoản"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className={styles.userAvatar}>
                {user.email.charAt(0).toUpperCase()}
              </div>
            </button>

            {menuOpen && (
              <div className={styles.userMenu} role="menu">
                <div className={styles.userMenuHeader}>
                  <div className={styles.userMenuAvatar}>{user.email.charAt(0).toUpperCase()}</div>
                  <div className={styles.userMenuDetails}>
                    <div className={styles.userMenuWelcome}>Xin chào</div>
                    <div className={styles.userMenuEmail}>{user.email}</div>
                  </div>
                </div>
                <div className={styles.menuDivider}></div>
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push(item.path) }}
                    className={styles.userMenuItem}
                    title={item.tooltip || item.label}
                  >
                    <span className={styles.menuIcon}>{item.icon}</span>
                    <span className={styles.menuLabel}>{item.label}</span>
                  </button>
                ))}
                <div className={styles.menuDivider}></div>
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onLogout() }}
                  className={`${styles.userMenuItem} ${styles.menuLogout}`}
                  title="Đăng xuất"
                >
                  <span className={styles.menuIcon}>🚪</span>
                  <span className={styles.menuLabel}>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </AnimatedElement>
      </div>
    </header>
  )
}

export default DashboardHeader
