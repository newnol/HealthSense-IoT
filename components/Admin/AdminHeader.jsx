import { useRouter } from 'next/router'
import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/admin.module.css'

const AdminHeader = ({ user, stats }) => {
  const router = useRouter()

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInLeft" className={styles.headerTitle}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>🛠️</div>
            <div>
              <h1>Admin Dashboard</h1>
              <div className={styles.subtitle}>Quản lý hệ thống HealthSense</div>
            </div>
          </div>
        </AnimatedElement>
        
        <AnimatedElement animation="fadeInRight" className={styles.headerActions}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.adminDetails}>
              <span className={styles.adminLabel}>Admin</span>
              <span className={styles.adminEmail}>{user?.email}</span>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/dashboard')}
            className={styles.btnBack}
          >
            <span className={styles.btnIcon}>←</span>
            <span className={styles.btnLabel}>Dashboard</span>
          </button>
        </AnimatedElement>
      </div>
      
      {/* Quick Stats Bar */}
      {stats && (
        <div className={styles.quickStats}>
          <div className={styles.container}>
            <div className={styles.statsGrid}>
              <AnimatedElement animation="fadeInUp" delay={100} className={styles.quickStat}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.userCount || 0}</div>
                  <div className={styles.statLabel}>Người dùng</div>
                </div>
              </AnimatedElement>
              
              <AnimatedElement animation="fadeInUp" delay={200} className={styles.quickStat}>
                <div className={styles.statIcon}>📱</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.deviceCount || 0}</div>
                  <div className={styles.statLabel}>Thiết bị</div>
                </div>
              </AnimatedElement>
              
              <AnimatedElement animation="fadeInUp" delay={300} className={styles.quickStat}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.totalRecords || 0}</div>
                  <div className={styles.statLabel}>Bản ghi</div>
                </div>
              </AnimatedElement>
              
              <AnimatedElement animation="fadeInUp" delay={400} className={styles.quickStat}>
                <div className={styles.statIcon}>⚡</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>99.9%</div>
                  <div className={styles.statLabel}>Uptime</div>
                </div>
              </AnimatedElement>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default AdminHeader
