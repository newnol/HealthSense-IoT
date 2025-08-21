import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { useAdmin } from '../contexts/AdminContext'
import { useAnime } from '../hooks/useAnime.jsx'

// Import new admin components
import AdminHeader from '../components/Admin/AdminHeader'
import StatsDashboard from '../components/Admin/StatsDashboard'
import UsersManagement from '../components/Admin/UsersManagement'
import DevicesManagement from '../components/Admin/DevicesManagement'

import styles from '../styles/components/admin.module.css'

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    isAdmin, 
    loading, 
    users, 
    devices, 
    stats,
    fetchUsers, 
    fetchDevices, 
    fetchStats,
    updateUser,
    deleteUser,
    deleteDevice,
    setAdminClaim,
    getUserDevices,
    getUserProfile
  } = useAdmin()
  const { animate } = useAnime()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDevices, setUserDevices] = useState([])

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [loading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchDevices()
      fetchStats()
    }
  }, [isAdmin])

  // Animate stats when data loads
  useEffect(() => {
    if (stats && !loading) {
      animate(`.${styles.statValue}`, {
        innerHTML: [0, (el) => el.getAttribute('data-value') || el.textContent],
        duration: 2000,
        easing: 'easeOutExpo',
        round: 1
      })
    }
  }, [stats, loading, animate])

  // Fetch devices for selected user
  const handleViewUserDevices = async (userId) => {
    try {
      const result = await getUserDevices(userId)
      setUserDevices(result.devices)
      setSelectedUser(users.find(u => u.uid === userId))
    } catch (error) {
      console.error('Error fetching user devices:', error)
      alert('Lỗi khi tải danh sách thiết bị: ' + error.message)
    }
  }

  // Handle user deletion with confirmation
  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.uid === userId)
    if (!userToDelete) return

    const confirmMessage = `Bạn có chắc muốn xóa người dùng "${userToDelete.email}"?\n\nHành động này sẽ xóa:\n- Tài khoản người dùng\n- Tất cả thiết bị của họ\n- Tất cả dữ liệu liên quan\n\nKhông thể hoàn tác!`
    
    if (confirm(confirmMessage)) {
      try {
        await deleteUser(userId)
        alert('Đã xóa người dùng thành công')
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Lỗi khi xóa người dùng: ' + error.message)
      }
    }
  }

  // Handle device deletion with confirmation
  const handleDeleteDevice = async (deviceId) => {
    const deviceToDelete = devices.find(d => d.deviceId === deviceId)
    if (!deviceToDelete) return

    const confirmMessage = `Bạn có chắc muốn xóa thiết bị "${deviceId}"?\n\nHành động này sẽ xóa:\n- Thiết bị khỏi hệ thống\n- Tất cả dữ liệu của thiết bị\n- Kết nối với người dùng\n\nKhông thể hoàn tác!`
    
    if (confirm(confirmMessage)) {
      try {
        await deleteDevice(deviceId)
        alert('Đã xóa thiết bị thành công')
      } catch (error) {
        console.error('Error deleting device:', error)
        alert('Lỗi khi xóa thiết bị: ' + error.message)
      }
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>Đang tải Admin Dashboard...</div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.accessDeniedIcon}>🚫</div>
        <h2>Truy cập bị từ chối</h2>
        <p>Bạn cần quyền Admin để truy cập trang này</p>
        <button onClick={() => router.push('/dashboard')} className={styles.btnBack}>
          ← Quay lại Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className={styles.adminDashboard}>
      <AdminHeader user={user} stats={stats} />
      
      <div className={styles.mainContent}>
        <div className={styles.container}>
          {/* Navigation Tabs */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              {[
                { key: 'dashboard', label: 'Dashboard', icon: '📊' },
                { key: 'users', label: 'Người dùng', icon: '👥', count: users?.length },
                { key: 'devices', label: 'Thiết bị', icon: '📱', count: devices?.length },
                { key: 'settings', label: 'Cài đặt', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span className={styles.tabLabel}>
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={styles.tabCount}>({tab.count})</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'dashboard' && (
              <StatsDashboard 
                stats={stats} 
                users={users} 
                devices={devices} 
              />
            )}
            
            {activeTab === 'users' && (
              <UsersManagement
                users={users}
                onViewUserDevices={handleViewUserDevices}
                onDeleteUser={handleDeleteUser}
                onUpdateUser={updateUser}
                onSetAdminClaim={setAdminClaim}
              />
            )}
            
            {activeTab === 'devices' && (
              <DevicesManagement
                devices={devices}
                onDeleteDevice={handleDeleteDevice}
              />
            )}
            
            {activeTab === 'settings' && (
              <div className={styles.settingsPanel}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <h2>⚙️ Cài đặt hệ thống</h2>
                    <p>Cấu hình và quản lý hệ thống</p>
                  </div>
                </div>
                
                <div className={styles.settingsGrid}>
                  <div className={styles.settingCard}>
                    <div className={styles.settingIcon}>🔧</div>
                    <div className={styles.settingInfo}>
                      <h3>Cấu hình chung</h3>
                      <p>Thiết lập các thông số cơ bản của hệ thống</p>
                    </div>
                    <button className={styles.settingBtn}>Cấu hình</button>
                  </div>
                  
                  <div className={styles.settingCard}>
                    <div className={styles.settingIcon}>📧</div>
                    <div className={styles.settingInfo}>
                      <h3>Email & Thông báo</h3>
                      <p>Quản lý email templates và cài đặt thông báo</p>
                    </div>
                    <button className={styles.settingBtn}>Cấu hình</button>
                  </div>
                  
                  <div className={styles.settingCard}>
                    <div className={styles.settingIcon}>🔐</div>
                    <div className={styles.settingInfo}>
                      <h3>Bảo mật</h3>
                      <p>Cài đặt bảo mật và xác thực</p>
                    </div>
                    <button className={styles.settingBtn}>Cấu hình</button>
                  </div>
                  
                  <div className={styles.settingCard}>
                    <div className={styles.settingIcon}>💾</div>
                    <div className={styles.settingInfo}>
                      <h3>Backup & Restore</h3>
                      <p>Sao lưu và khôi phục dữ liệu hệ thống</p>
                    </div>
                    <button className={styles.settingBtn}>Quản lý</button>
                  </div>
                  
                  <div className={styles.settingCard}>
                    <div className={styles.settingIcon}>📊</div>
                    <div className={styles.settingInfo}>
                      <h3>Logs & Analytics</h3>
                      <p>Xem logs hệ thống và phân tích dữ liệu</p>
                    </div>
                    <button className={styles.settingBtn}>Xem</button>
                  </div>
                  
                  <div className={styles.settingCard}>
                    <div className={styles.settingIcon}>🎨</div>
                    <div className={styles.settingInfo}>
                      <h3>Giao diện</h3>
                      <p>Tùy chỉnh giao diện và branding</p>
                    </div>
                    <button className={styles.settingBtn}>Tùy chỉnh</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Devices Modal */}
      {selectedUser && (
        <div className={styles.modal}>
          <div className={styles.modalOverlay} onClick={() => setSelectedUser(null)}></div>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>📱 Thiết bị của {selectedUser.email}</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className={styles.modalClose}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {userDevices.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📱</div>
                  <h3>Chưa có thiết bị</h3>
                  <p>Người dùng này chưa đăng ký thiết bị nào</p>
                </div>
              ) : (
                <div className={styles.devicesList}>
                  {userDevices.map((device) => (
                    <div key={device.deviceId} className={styles.deviceItem}>
                      <div className={styles.deviceItemIcon}>📱</div>
                      <div className={styles.deviceItemInfo}>
                        <div className={styles.deviceItemId}>{device.deviceId}</div>
                        <div className={styles.deviceItemMeta}>
                          Đăng ký: {device.registeredAt 
                            ? new Date(device.registeredAt).toLocaleDateString('vi-VN')
                            : 'Không rõ'
                          }
                          {device.lastActive && (
                            <span> • Hoạt động cuối: {new Date(device.lastActive).toLocaleDateString('vi-VN')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setSelectedUser(null)}
                className={styles.btnSecondary}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Styles */}
      <style jsx>{`
        .${styles.loadingContainer} {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .${styles.loadingSpinner} {
          text-align: center;
        }
        
        .${styles.spinner} {
          width: 50px;
          height: 50px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .${styles.loadingText} {
          color: #6b7280;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .${styles.accessDenied} {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          text-align: center;
          padding: 2rem;
        }
        
        .${styles.accessDeniedIcon} {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .${styles.accessDenied} h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #374151;
          margin: 0 0 0.5rem 0;
        }
        
        .${styles.accessDenied} p {
          color: #6b7280;
          font-size: 1.1rem;
          margin: 0 0 2rem 0;
        }
      `}</style>
    </div>
  )
}
