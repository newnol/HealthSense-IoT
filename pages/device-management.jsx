// pages/device-management.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import axios from 'axios'

export default function DeviceManagement() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('register') // 'register' or 'manage'
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [deviceUsers, setDeviceUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // Register device states
  const [deviceId, setDeviceId] = useState('')
  const [registerDeviceSecret, setRegisterDeviceSecret] = useState('')
  
  // Manage device states
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
        <div className="loading-spinner">⏳</div>
        <div>Đang tải...</div>
      </div>
    )
  }

  useEffect(() => {
    if (activeTab === 'manage') {
      loadUserDevices()
    }
  }, [user, activeTab])

  const handleRegisterDevice = async (e) => {
    e.preventDefault()
    
    if (!deviceId.trim() || !registerDeviceSecret.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin thiết bị')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await user.getIdToken()
      
      const response = await axios.post('/api/records/device/register', {
        device_id: deviceId.trim(),
        device_secret: registerDeviceSecret.trim()
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setMessage(response.data.message)
      setDeviceId('')
      setRegisterDeviceSecret('')
      
      // Switch to manage tab after successful registration
      setTimeout(() => {
        setActiveTab('manage')
        loadUserDevices()
      }, 2000)
      
    } catch (error) {
      console.error('Registration error:', error)
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else {
        setError('Có lỗi xảy ra khi đăng ký thiết bị')
      }
    }
    setIsLoading(false)
  }

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
    setError('')
    try {
      const token = await user.getIdToken()
      const response = await axios.get(`/api/records/device/${deviceId}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // Safely handle the response data
      const users = response.data?.users || []
      console.log('Device users loaded:', users) // Debug log
      setDeviceUsers(users)
      setSelectedDevice(deviceId)
    } catch (error) {
      console.error('Error loading device users:', error)
      if (error.response?.status === 404) {
        setDeviceUsers([]) // Device exists but no users
        setSelectedDevice(deviceId)
      } else {
        setError(`Không thể tải danh sách người dùng thiết bị: ${error.response?.data?.error || error.message}`)
      }
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
      loadDeviceUsers(selectedDevice)
    } catch (error) {
      console.error('Error adding user:', error)
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else {
        setError('Có lỗi xảy ra khi thêm người dùng')
      }
    }
    setIsLoading(false)
  }

  const removeUserFromDevice = async (userEmail) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng ${userEmail} khỏi thiết bị?`)) {
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await user.getIdToken()
      
      const response = await axios.delete(`/api/records/device/${selectedDevice}/remove-user`, {
        data: { user_email: userEmail },
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setMessage(response.data.message || 'Đã xóa người dùng khỏi thiết bị')
      loadDeviceUsers(selectedDevice)
    } catch (error) {
      console.error('Error removing user:', error)
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else if (error.response?.status === 404) {
        setError('Không tìm thấy người dùng trong thiết bị')
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền xóa người dùng khỏi thiết bị này')
      } else if (error.response?.status === 400) {
        setError('Không thể xóa người dùng cuối cùng khỏi thiết bị')
      } else {
        setError('Có lỗi xảy ra khi xóa người dùng')
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="device-management">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>🔧 Quản lý Thiết bị</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="btn-back"
          >
            ← Quay lại Dashboard
          </button>
        </div>
      </header>

      <div className="container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <span className="tab-icon">📱</span>
            <span className="tab-label">Đăng ký thiết bị mới</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <span className="tab-icon">⚙️</span>
            <span className="tab-label">Quản lý thiết bị</span>
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {message}
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            {error}
          </div>
        )}

        {/* Register Device Tab */}
        {activeTab === 'register' && (
          <div className="tab-content">
            <div className="register-section">
              <div className="section-header">
                <h2>📱 Đăng ký thiết bị mới</h2>
                <p>Nhập thông tin thiết bị ESP32 để kết nối với hệ thống</p>
              </div>

              <form onSubmit={handleRegisterDevice} className="register-form">
                <div className="form-group">
                  <label htmlFor="deviceId">Device ID</label>
                  <input
                    type="text"
                    id="deviceId"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="Nhập Device ID (ví dụ: ESP32_001)"
                    required
                    className="form-input"
                  />
                  <div className="input-help">
                    Device ID được in trên thiết bị hoặc hiển thị trên màn hình LCD
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="registerDeviceSecret">Device Secret</label>
                  <input
                    type="password"
                    id="registerDeviceSecret"
                    value={registerDeviceSecret}
                    onChange={(e) => setRegisterDeviceSecret(e.target.value)}
                    placeholder="Nhập Device Secret"
                    required
                    className="form-input"
                  />
                  <div className="input-help">
                    Device Secret là mật khẩu bảo mật của thiết bị
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner">⏳</span>
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">📱</span>
                      Đăng ký thiết bị
                    </>
                  )}
                </button>
              </form>

              <div className="info-section">
                <h3>📋 Hướng dẫn</h3>
                <div className="info-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Chuẩn bị thiết bị</h4>
                      <p>Đảm bảo thiết bị ESP32 đã được kết nối WiFi và hoạt động</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Lấy thông tin</h4>
                      <p>Tìm Device ID và Secret trên thiết bị hoặc màn hình LCD</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Đăng ký</h4>
                      <p>Nhập thông tin vào form trên và nhấn "Đăng ký thiết bị"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Devices Tab */}
        {activeTab === 'manage' && (
          <div className="tab-content">
            <div className="manage-section">
              <div className="section-header">
                <h2>⚙️ Danh sách thiết bị</h2>
                <p>Quản lý các thiết bị đã đăng ký và người dùng có quyền truy cập</p>
              </div>

              {isLoading && (
                <div className="loading-state">
                  <span className="spinner">⏳</span>
                  Đang tải...
                </div>
              )}

              {!isLoading && devices.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📱</div>
                  <h3>Chưa có thiết bị nào</h3>
                  <p>Hãy đăng ký thiết bị đầu tiên của bạn</p>
                  <button 
                    onClick={() => setActiveTab('register')}
                    className="btn-primary"
                  >
                    <span className="btn-icon">➕</span>
                    Đăng ký thiết bị mới
                  </button>
                </div>
              )}

              {!isLoading && devices.length > 0 && (
                <div className="devices-grid">
                  {devices.map((device) => (
                    <div 
                      key={device.device_id} 
                      className={`device-card ${selectedDevice === device.device_id ? 'selected' : ''}`}
                      onClick={() => loadDeviceUsers(device.device_id)}
                    >
                      <div className="device-header">
                        <div className="device-icon">📱</div>
                        <div className="device-info">
                          <h3>{device.device_id}</h3>
                          <div className="device-meta">
                            <span className="device-status online">🟢 Đang hoạt động</span>
                            <span className="device-users">{device.user_count || 0} người dùng</span>
                          </div>
                        </div>
                      </div>
                      <div className="device-stats">
                        <div className="stat">
                          <span className="stat-label">Đăng ký lúc</span>
                          <span className="stat-value">
                            {new Date(device.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Device Users Management */}
              {selectedDevice && (
                <div className="device-users-section">
                  <div className="section-header">
                    <h3>👥 Người dùng thiết bị: {selectedDevice}</h3>
                    <button 
                      onClick={() => setShowAddUserForm(!showAddUserForm)}
                      className="btn-secondary"
                    >
                      <span className="btn-icon">➕</span>
                      Thêm người dùng
                    </button>
                  </div>

                  {showAddUserForm && (
                    <form onSubmit={addUserToDevice} className="add-user-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="newUserEmail">Email người dùng</label>
                          <input
                            type="email"
                            id="newUserEmail"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="deviceSecret">Device Secret</label>
                          <input
                            type="password"
                            id="deviceSecret"
                            value={deviceSecret}
                            onChange={(e) => setDeviceSecret(e.target.value)}
                            placeholder="Mật khẩu thiết bị"
                            required
                            className="form-input"
                          />
                        </div>
                        <div className="form-actions">
                          <button 
                            type="submit" 
                            disabled={isLoading}
                            className="btn-primary"
                          >
                            {isLoading ? '⏳' : '➕'} Thêm
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowAddUserForm(false)}
                            className="btn-cancel"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="users-list">
                    {deviceUsers.length === 0 ? (
                      <div className="empty-users">
                        <div className="empty-icon">👥</div>
                        <h4>Chưa có người dùng nào</h4>
                        <p>Hãy thêm người dùng đầu tiên cho thiết bị này</p>
                      </div>
                    ) : (
                      deviceUsers.map((deviceUser, index) => {
                        // Safe check for user_email
                        const userEmail = deviceUser?.user_email || deviceUser?.email || `user_${index}`
                        const displayEmail = typeof userEmail === 'string' ? userEmail : `user_${index}`
                        const avatarLetter = displayEmail.charAt(0).toUpperCase()
                        
                        return (
                          <div key={displayEmail} className="user-card">
                            <div className="user-info">
                              <div className="user-avatar">
                                {avatarLetter}
                              </div>
                              <div className="user-details">
                                <div className="user-email">{displayEmail}</div>
                                <div className="user-meta">
                                  Thêm vào: {deviceUser.created_at 
                                    ? new Date(deviceUser.created_at).toLocaleDateString('vi-VN')
                                    : 'Không rõ'
                                  }
                                </div>
                              </div>
                            </div>
                            <div className="user-actions">
                              <button 
                                onClick={() => removeUserFromDevice(displayEmail)}
                                className="btn-danger"
                                title="Xóa người dùng"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .device-management {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 1.5rem 0;
          margin-bottom: 2rem;
        }

        .header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header h1 {
          margin: 0;
          color: #333;
          font-size: 1.8rem;
        }

        .btn-back {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #333;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          gap: 1rem;
        }

        .loading-spinner {
          font-size: 2rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .tab-navigation {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 0.5rem;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: transparent;
          border: none;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          color: #666;
          flex: 1;
          justify-content: center;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #333;
        }

        .tab-btn.active {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .tab-content {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .section-header h2 {
          color: #333;
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }

        .section-header h3 {
          color: #333;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #047857;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }

        .alert-icon {
          font-size: 1.2rem;
        }

        .register-form {
          max-width: 500px;
          margin: 0 auto 3rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.8);
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-help {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #666;
        }

        .btn-primary {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #333;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .btn-danger {
          background: linear-gradient(45deg, #ef4444, #f87171);
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cancel:hover {
          background: #4b5563;
        }

        .btn-icon {
          font-size: 1rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        .info-section {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 2rem;
        }

        .info-section h3 {
          color: #1e40af;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
        }

        .info-steps {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .step-number {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }

        .step-content h4 {
          color: #333;
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .step-content p {
          color: #666;
          margin: 0;
          line-height: 1.5;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 3rem;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 2rem;
        }

        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .device-card {
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .device-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .device-card.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .device-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .device-icon {
          font-size: 2rem;
        }

        .device-info h3 {
          color: #333;
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
        }

        .device-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .device-status {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .device-status.online {
          color: #10b981;
        }

        .device-users {
          color: #666;
          font-size: 0.875rem;
        }

        .device-stats {
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding-top: 1rem;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: #666;
          font-size: 0.875rem;
        }

        .stat-value {
          color: #333;
          font-weight: 600;
        }

        .device-users-section {
          margin-top: 2rem;
          background: rgba(248, 249, 250, 0.8);
          border-radius: 12px;
          padding: 2rem;
        }

        .add-user-form {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 1rem;
          align-items: end;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(45deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-email {
          color: #333;
          font-weight: 600;
        }

        .user-meta {
          color: #666;
          font-size: 0.875rem;
        }

        .empty-users {
          text-align: center;
          padding: 3rem 2rem;
          color: #666;
          background: rgba(248, 249, 250, 0.8);
          border: 2px dashed rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }

        .empty-users .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-users h4 {
          color: #333;
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
        }

        .empty-users p {
          margin: 0;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .tab-btn .tab-label {
            display: none;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .devices-grid {
            grid-template-columns: 1fr;
          }

          .header .container {
            flex-direction: column;
            gap: 1rem;
          }

          .section-header h3 {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
