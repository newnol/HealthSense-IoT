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
    </header>
  )
}

export default AdminHeader
