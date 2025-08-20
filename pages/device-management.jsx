// pages/device-management.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import axios from 'axios'

export default function DeviceManagement() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [deviceUsers, setDeviceUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // Form states
  const [newUserEmail, setNewUserEmail] = useState('')
  const [deviceSecret, setDeviceSecret] = useState('')
  const [showAddUserForm, setShowAddUserForm] = useState(false)

  // Redirect if not authenticated
  if (!loading && !user) {
    router.push('/landing')
    return null
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div>Đang tải...</div>
      </div>
    )
  }

  useEffect(() => {
    loadUserDevices()
  }, [user])

  const loadUserDevices = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await axios.get('/api/records/user/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setDevices(response.data.devices || [])
    } catch (error) {
      console.error('Error loading devices:', error)
      setError('Không thể tải danh sách thiết bị')
    }
    setIsLoading(false)
  }

  const loadDeviceUsers = async (deviceId) => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await axios.get(`/api/records/device/${deviceId}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setDeviceUsers(response.data.users || [])
      setSelectedDevice(deviceId)
    } catch (error) {
      console.error('Error loading device users:', error)
      setError('Không thể tải danh sách người dùng thiết bị')
    }
    setIsLoading(false)
  }

  const addUserToDevice = async (e) => {
    e.preventDefault()
    if (!newUserEmail.trim() || !deviceSecret.trim() || !selectedDevice) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await user.getIdToken()
      const response = await axios.post(`/api/records/device/${selectedDevice}/add-user`, {
        user_email: newUserEmail.trim(),
        device_secret: deviceSecret.trim()
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setMessage(response.data.message)
      setNewUserEmail('')
      setDeviceSecret('')
      setShowAddUserForm(false)
      
      // Reload device users
      await loadDeviceUsers(selectedDevice)
      
    } catch (error) {
      console.error('Add user error:', error)
      setError(error.response?.data?.detail || 'Không thể thêm người dùng')
    }
    
    setIsLoading(false)
  }

  const removeUserFromDevice = async (userId) => {
    if (!selectedDevice || !confirm('Bạn có chắc muốn xóa người dùng này khỏi thiết bị?')) {
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await user.getIdToken()
      const response = await axios.delete(`/api/records/device/${selectedDevice}/remove-user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setMessage(response.data.message)
      
      // Reload device users
      await loadDeviceUsers(selectedDevice)
      
    } catch (error) {
      console.error('Remove user error:', error)
      setError(error.response?.data?.detail || 'Không thể xóa người dùng')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="device-management">
      <style jsx>{`
        .device-management {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .header h1 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }
        
        .header p {
          color: #7f8c8d;
        }
        
        .content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        
        .devices-section, .users-section {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .section-title {
          color: #2c3e50;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .device-list, .user-list {
          space-y: 1rem;
        }
        
        .device-item, .user-item {
          padding: 1rem;
          border: 2px solid #ecf0f1;
          border-radius: 8px;
          margin-bottom: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .device-item:hover {
          border-color: #3498db;
          background-color: #f8f9fa;
        }
        
        .device-item.selected {
          border-color: #3498db;
          background-color: #e3f2fd;
        }
        
        .device-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .device-id {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .device-meta {
          font-size: 0.9rem;
          color: #7f8c8d;
          margin-top: 0.5rem;
        }
        
        .user-count {
          background: #3498db;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }
        
        .user-item {
          cursor: default;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .user-info {
          flex: 1;
        }
        
        .user-email {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .user-meta {
          font-size: 0.9rem;
          color: #7f8c8d;
          margin-top: 0.25rem;
        }
        
        .remove-btn {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .remove-btn:hover {
          background: #c0392b;
        }
        
        .remove-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .add-user-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #ecf0f1;
        }
        
        .add-user-btn {
          background: #27ae60;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          margin-bottom: 1rem;
        }
        
        .add-user-btn:hover {
          background: #229954;
        }
        
        .add-user-form {
          space-y: 1rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #2c3e50;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ecf0f1;
          border-radius: 6px;
          font-size: 1rem;
          box-sizing: border-box;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          flex: 1;
        }
        
        .btn-primary {
          background: #3498db;
          color: white;
        }
        
        .btn-primary:hover {
          background: #2980b9;
        }
        
        .btn-secondary {
          background: #95a5a6;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #7f8c8d;
        }
        
        .btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .message {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }
        
        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #7f8c8d;
        }
        
        .empty-state {
          text-align: center;
          color: #7f8c8d;
          padding: 2rem;
        }
        
        .legacy-badge {
          background: #f39c12;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          margin-left: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .content {
            grid-template-columns: 1fr;
          }
          
          .device-management {
            padding: 1rem;
          }
        }
      `}</style>

      <div className="header">
        <h1>🔗 Quản lý thiết bị chia sẻ</h1>
        <p>Quản lý và chia sẻ thiết bị với người dùng khác</p>
      </div>

      {message && (
        <div className="message success">
          {message}
        </div>
      )}

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      <div className="content">
        <div className="devices-section">
          <h2 className="section-title">
            📱 Thiết bị của bạn
          </h2>
          
          {isLoading && !devices.length ? (
            <div className="loading-container">
              <div>Đang tải...</div>
            </div>
          ) : devices.length === 0 ? (
            <div className="empty-state">
              <p>Bạn chưa có thiết bị nào được đăng ký.</p>
              <p>Hãy đến trang <a href="/device-setup">Đăng ký thiết bị</a> để thêm thiết bị mới.</p>
            </div>
          ) : (
            <div className="device-list">
              {devices.map((device) => (
                <div
                  key={device.device_id}
                  className={`device-item ${selectedDevice === device.device_id ? 'selected' : ''}`}
                  onClick={() => loadDeviceUsers(device.device_id)}
                >
                  <div className="device-info">
                    <div>
                      <div className="device-id">
                        {device.device_id}
                        {device.is_legacy && <span className="legacy-badge">Legacy</span>}
                      </div>
                      <div className="device-meta">
                        Đăng ký: {new Date(device.registered_at).toLocaleDateString('vi-VN')}
                        {device.added_by && <div>Được thêm bởi: {device.added_by}</div>}
                      </div>
                    </div>
                    <div className="user-count">
                      {device.user_count} người dùng
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="users-section">
          <h2 className="section-title">
            👥 Người dùng thiết bị
          </h2>
          
          {!selectedDevice ? (
            <div className="empty-state">
              <p>Chọn một thiết bị để xem danh sách người dùng</p>
            </div>
          ) : (
            <>
              {deviceUsers.length === 0 ? (
                <div className="empty-state">
                  <p>Thiết bị này chưa có người dùng nào</p>
                </div>
              ) : (
                <div className="user-list">
                  {deviceUsers.map((deviceUser) => (
                    <div key={deviceUser.user_id} className="user-item">
                      <div className="user-info">
                        <div className="user-email">
                          {deviceUser.email}
                          {deviceUser.is_legacy && <span className="legacy-badge">Legacy</span>}
                        </div>
                        <div className="user-meta">
                          Đăng ký: {new Date(deviceUser.registered_at).toLocaleDateString('vi-VN')}
                          {deviceUser.added_by && <div>Được thêm bởi: {deviceUser.added_by}</div>}
                        </div>
                      </div>
                      {deviceUser.user_id !== user.uid && (
                        <button
                          className="remove-btn"
                          onClick={() => removeUserFromDevice(deviceUser.user_id)}
                          disabled={isLoading}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="add-user-section">
                {!showAddUserForm ? (
                  <button
                    className="add-user-btn"
                    onClick={() => setShowAddUserForm(true)}
                  >
                    ➕ Thêm người dùng mới
                  </button>
                ) : (
                  <form className="add-user-form" onSubmit={addUserToDevice}>
                    <div className="form-group">
                      <label>Email người dùng:</label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mật khẩu thiết bị:</label>
                      <input
                        type="password"
                        value={deviceSecret}
                        onChange={(e) => setDeviceSecret(e.target.value)}
                        placeholder="Nhập mật khẩu thiết bị"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Đang thêm...' : 'Thêm người dùng'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowAddUserForm(false)
                          setNewUserEmail('')
                          setDeviceSecret('')
                        }}
                        disabled={isLoading}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
