import { useState } from 'react'
import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/admin.module.css'

const UsersManagement = ({ 
  users, 
  onEditUser, 
  onDeleteUser, 
  onViewUserDevices, 
  onUpdateUser, 
  onSetAdminClaim 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // all, active, disabled, admin
  const [editingUser, setEditingUser] = useState(null)
  const [sortBy, setSortBy] = useState('email') // email, created, devices
  const [sortOrder, setSortOrder] = useState('asc')

  // Filter and sort users
  const filteredUsers = users
    ?.filter(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.uid.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'active' && !user.disabled) ||
        (filterType === 'disabled' && user.disabled) ||
        (filterType === 'admin' && user.admin)
      
      return matchesSearch && matchesFilter
    })
    ?.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'email':
          aVal = a.email || ''
          bVal = b.email || ''
          break
        case 'created':
          aVal = new Date(a.metadata?.creationTime || 0)
          bVal = new Date(b.metadata?.creationTime || 0)
          break
        case 'devices':
          aVal = a.deviceCount || 0
          bVal = b.deviceCount || 0
          break
        default:
          aVal = a.email || ''
          bVal = b.email || ''
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    }) || []

  const handleEditUser = (user) => {
    setEditingUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      disabled: user.disabled,
      admin: user.admin
    })
  }

  const handleSaveUser = async () => {
    try {
      const updates = {
        email: editingUser.email,
        displayName: editingUser.displayName,
        disabled: editingUser.disabled
      }
      
      await onUpdateUser(editingUser.uid, updates)
      
      // Update admin claim if changed
      const originalUser = users.find(u => u.uid === editingUser.uid)
      if (editingUser.admin !== originalUser.admin) {
        await onSetAdminClaim(editingUser.uid, editingUser.admin)
      }
      
      setEditingUser(null)
    } catch (error) {
      alert('Lỗi cập nhật người dùng: ' + error.message)
    }
  }

  const getUserStatusBadge = (user) => {
    const badges = []
    
    if (user.admin) {
      badges.push(
        <span key="admin" className={`${styles.badge} ${styles.badgeAdmin}`}>
          🛡️ Admin
        </span>
      )
    }
    
    if (user.disabled) {
      badges.push(
        <span key="disabled" className={`${styles.badge} ${styles.badgeDisabled}`}>
          🚫 Vô hiệu hóa
        </span>
      )
    }
    
    if (!user.disabled && !user.admin) {
      badges.push(
        <span key="active" className={`${styles.badge} ${styles.badgeActive}`}>
          ✅ Hoạt động
        </span>
      )
    }
    
    return badges
  }

  return (
    <div className={styles.usersManagement}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <h2>👥 Quản lý người dùng</h2>
          <p>{filteredUsers.length} / {users?.length || 0} người dùng</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <div className={styles.searchIcon}>🔍</div>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterButtons}>
          {[
            { key: 'all', label: 'Tất cả', icon: '👥' },
            { key: 'active', label: 'Hoạt động', icon: '✅' },
            { key: 'disabled', label: 'Vô hiệu hóa', icon: '🚫' },
            { key: 'admin', label: 'Admin', icon: '🛡️' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterType(filter.key)}
              className={`${styles.filterBtn} ${filterType === filter.key ? styles.active : ''}`}
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
            <option value="email">Email</option>
            <option value="created">Ngày tạo</option>
            <option value="devices">Số thiết bị</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={styles.sortBtn}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className={styles.usersList}>
        {filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👤</div>
            <h3>Không tìm thấy người dùng</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          filteredUsers.map((user, index) => (
            <AnimatedElement 
              key={user.uid} 
              animation="fadeInUp" 
              delay={index * 50}
              className={styles.userCard}
            >
              {editingUser?.uid === user.uid ? (
                <div className={styles.editUserForm}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Tên hiển thị</label>
                      <input
                        type="text"
                        value={editingUser.displayName}
                        onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                    
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={editingUser.disabled}
                          onChange={(e) => setEditingUser({...editingUser, disabled: e.target.checked})}
                        />
                        <span className={styles.checkboxLabel}>Vô hiệu hóa tài khoản</span>
                      </label>
                      
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={editingUser.admin}
                          onChange={(e) => setEditingUser({...editingUser, admin: e.target.checked})}
                        />
                        <span className={styles.checkboxLabel}>Quyền Admin</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className={styles.formActions}>
                    <button onClick={handleSaveUser} className={styles.btnSave}>
                      💾 Lưu
                    </button>
                    <button onClick={() => setEditingUser(null)} className={styles.btnCancel}>
                      ❌ Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.userCardContent}>
                  <div className={styles.userAvatar}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className={styles.userInfo}>
                    <div className={styles.userHeader}>
                      <h3 className={styles.userEmail}>{user.email}</h3>
                      <div className={styles.userBadges}>
                        {getUserStatusBadge(user)}
                      </div>
                    </div>
                    
                    <div className={styles.userDetails}>
                      <div className={styles.userDetail}>
                        <span className={styles.detailLabel}>Tên:</span>
                        <span className={styles.detailValue}>{user.displayName || 'Chưa đặt'}</span>
                      </div>
                      <div className={styles.userDetail}>
                        <span className={styles.detailLabel}>Thiết bị:</span>
                        <span className={styles.detailValue}>{user.deviceCount || 0} thiết bị</span>
                      </div>
                      <div className={styles.userDetail}>
                        <span className={styles.detailLabel}>Tạo lúc:</span>
                        <span className={styles.detailValue}>
                          {user.metadata?.creationTime 
                            ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN')
                            : 'Không rõ'
                          }
                        </span>
                      </div>
                      <div className={styles.userDetail}>
                        <span className={styles.detailLabel}>UID:</span>
                        <span className={styles.detailValue}>{user.uid.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.userActions}>
                    <button
                      onClick={() => onViewUserDevices(user.uid)}
                      className={styles.btnAction}
                      title="Xem thiết bị"
                    >
                      📱
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className={styles.btnAction}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.uid)}
                      className={`${styles.btnAction} ${styles.btnDanger}`}
                      title="Xóa người dùng"
                      disabled={user.uid === user?.uid} // Prevent self-deletion
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </AnimatedElement>
          ))
        )}
      </div>
    </div>
  )
}

export default UsersManagement
