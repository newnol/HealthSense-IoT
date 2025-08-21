import { useState } from 'react'
import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/admin.module.css'

const DevicesManagement = ({ devices, onDeleteDevice }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
  const [sortBy, setSortBy] = useState('registeredAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedDevice, setSelectedDevice] = useState(null)

  // Filter and sort devices
  const filteredDevices = devices
    ?.filter(device => {
      const matchesSearch = 
        device.deviceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.userDisplayName?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = 
        filterStatus === 'all' ||
        (filterStatus === 'active' && device.lastActive && 
         new Date(device.lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000)) ||
        (filterStatus === 'inactive' && (!device.lastActive || 
         new Date(device.lastActive) <= new Date(Date.now() - 24 * 60 * 60 * 1000)))
      
      return matchesSearch && matchesFilter
    })
    ?.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'deviceId':
          aVal = a.deviceId || ''
          bVal = b.deviceId || ''
          break
        case 'registeredAt':
          aVal = new Date(a.registeredAt || 0)
          bVal = new Date(b.registeredAt || 0)
          break
        case 'lastActive':
          aVal = new Date(a.lastActive || 0)
          bVal = new Date(b.lastActive || 0)
          break
        case 'userEmail':
          aVal = a.userEmail || ''
          bVal = b.userEmail || ''
          break
        default:
          aVal = a.deviceId || ''
          bVal = b.deviceId || ''
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    }) || []

  const getDeviceStatus = (device) => {
    if (!device.lastActive) {
      return { status: 'unknown', label: 'Chưa rõ', color: '#6b7280', icon: '❓' }
    }
    
    const lastActive = new Date(device.lastActive)
    const now = new Date()
    const diffHours = (now - lastActive) / (1000 * 60 * 60)
    
    if (diffHours < 1) {
      return { status: 'online', label: 'Trực tuyến', color: '#10b981', icon: '🟢' }
    } else if (diffHours < 24) {
      return { status: 'recent', label: 'Gần đây', color: '#f59e0b', icon: '🟡' }
    } else {
      return { status: 'offline', label: 'Ngoại tuyến', color: '#ef4444', icon: '🔴' }
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Chưa rõ'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`
    } else {
      return `${diffDays} ngày trước`
    }
  }

  return (
    <div className={styles.devicesManagement}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <h2>📱 Quản lý thiết bị</h2>
          <p>{filteredDevices.length} / {devices?.length || 0} thiết bị</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <div className={styles.searchIcon}>🔍</div>
          <input
            type="text"
            placeholder="Tìm kiếm thiết bị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterButtons}>
          {[
            { key: 'all', label: 'Tất cả', icon: '📱' },
            { key: 'active', label: 'Hoạt động', icon: '🟢' },
            { key: 'inactive', label: 'Không hoạt động', icon: '🔴' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`${styles.filterBtn} ${filterStatus === filter.key ? styles.active : ''}`}
            >
              <span className={styles.filterIcon}>{filter.icon}</span>
              <span className={styles.filterLabel}>{filter.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.sortControls}>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="registeredAt">Ngày đăng ký</option>
            <option value="lastActive">Hoạt động cuối</option>
            <option value="deviceId">Device ID</option>
            <option value="userEmail">Email chủ sở hữu</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={styles.sortBtn}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className={styles.devicesGrid}>
        {filteredDevices.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📱</div>
            <h3>Không tìm thấy thiết bị</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          filteredDevices.map((device, index) => {
            const deviceStatus = getDeviceStatus(device)
            
            return (
              <AnimatedElement 
                key={device.deviceId} 
                animation="fadeInUp" 
                delay={index * 50}
                className={styles.deviceCard}
              >
                <div className={styles.deviceHeader}>
                  <div className={styles.deviceIcon}>📱</div>
                  <div className={styles.deviceStatus} style={{ color: deviceStatus.color }}>
                    <span className={styles.statusIcon}>{deviceStatus.icon}</span>
                    <span className={styles.statusLabel}>{deviceStatus.label}</span>
                  </div>
                </div>
                
                <div className={styles.deviceInfo}>
                  <h3 className={styles.deviceId}>{device.deviceId}</h3>
                  
                  <div className={styles.deviceDetails}>
                    <div className={styles.deviceDetail}>
                      <span className={styles.detailLabel}>Chủ sở hữu:</span>
                      <span className={styles.detailValue}>
                        {device.userEmail || 'Không rõ'}
                      </span>
                    </div>
                    
                    <div className={styles.deviceDetail}>
                      <span className={styles.detailLabel}>Tên hiển thị:</span>
                      <span className={styles.detailValue}>
                        {device.userDisplayName || 'Chưa đặt'}
                      </span>
                    </div>
                    
                    <div className={styles.deviceDetail}>
                      <span className={styles.detailLabel}>Đăng ký:</span>
                      <span className={styles.detailValue}>
                        {device.registeredAt 
                          ? new Date(device.registeredAt).toLocaleDateString('vi-VN')
                          : 'Không rõ'
                        }
                      </span>
                    </div>
                    
                    <div className={styles.deviceDetail}>
                      <span className={styles.detailLabel}>Hoạt động cuối:</span>
                      <span className={styles.detailValue}>
                        {formatTimeAgo(device.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.deviceActions}>
                  <button
                    onClick={() => setSelectedDevice(device)}
                    className={styles.btnAction}
                    title="Xem chi tiết"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => onDeleteDevice(device.deviceId)}
                    className={`${styles.btnAction} ${styles.btnDanger}`}
                    title="Xóa thiết bị"
                  >
                    🗑️
                  </button>
                </div>
              </AnimatedElement>
            )
          })
        )}
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div className={styles.modal}>
          <div className={styles.modalOverlay} onClick={() => setSelectedDevice(null)}></div>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>📱 Chi tiết thiết bị</h3>
              <button 
                onClick={() => setSelectedDevice(null)}
                className={styles.modalClose}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.deviceDetailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Device ID:</span>
                  <span className={styles.detailValue}>{selectedDevice.deviceId}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Trạng thái:</span>
                  <span className={styles.detailValue} style={{ color: getDeviceStatus(selectedDevice).color }}>
                    {getDeviceStatus(selectedDevice).icon} {getDeviceStatus(selectedDevice).label}
                  </span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Email chủ sở hữu:</span>
                  <span className={styles.detailValue}>{selectedDevice.userEmail || 'Không rõ'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tên hiển thị:</span>
                  <span className={styles.detailValue}>{selectedDevice.userDisplayName || 'Chưa đặt'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Ngày đăng ký:</span>
                  <span className={styles.detailValue}>
                    {selectedDevice.registeredAt 
                      ? new Date(selectedDevice.registeredAt).toLocaleString('vi-VN')
                      : 'Không rõ'
                    }
                  </span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Hoạt động cuối:</span>
                  <span className={styles.detailValue}>
                    {selectedDevice.lastActive 
                      ? new Date(selectedDevice.lastActive).toLocaleString('vi-VN')
                      : 'Chưa có hoạt động'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setSelectedDevice(null)}
                className={styles.btnSecondary}
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  onDeleteDevice(selectedDevice.deviceId)
                  setSelectedDevice(null)
                }}
                className={styles.btnDanger}
              >
                🗑️ Xóa thiết bị
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DevicesManagement
