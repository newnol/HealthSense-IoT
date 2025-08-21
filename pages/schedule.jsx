// pages/schedule.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import axios from 'axios'

export default function Schedule() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('create') // 'create' or 'manage'
  const [devices, setDevices] = useState([])
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // Create schedule states
  const [selectedDevice, setSelectedDevice] = useState('')
  const [scheduleTime, setScheduleTime] = useState({
    minute: new Date().getMinutes(),
    hour: new Date().getHours(),
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })
  
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
    loadUserDevices()
    if (activeTab === 'manage') {
      loadUserSchedules()
    }
  }, [user, activeTab])

  // Auto-refresh schedules every 30 seconds to show status updates
  useEffect(() => {
    if (activeTab === 'manage' && user) {
      const interval = setInterval(() => {
        loadUserSchedules(false) // Silent refresh, no loading spinner
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [activeTab, user])

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

  const loadUserSchedules = async (showLoading = true) => {
    if (!user) return
    
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const token = await user.getIdToken()
      const response = await axios.get('/api/schedule/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSchedules(response.data.schedules || [])
    } catch (error) {
      console.error('Error loading schedules:', error)
      setError('Không thể tải danh sách lịch trình')
    }
    if (showLoading) {
      setIsLoading(false)
    }
  }

  const handleCreateSchedule = async () => {
    if (!selectedDevice) {
      setError('Vui lòng chọn thiết bị')
      return
    }

    // Validate schedule time is in the future
    const localScheduleDate = new Date(scheduleTime.year, scheduleTime.month - 1, scheduleTime.day, scheduleTime.hour, scheduleTime.minute)
    const now = new Date()
    
    if (localScheduleDate <= now) {
      setError('Thời gian lịch trình phải là thời gian trong tương lai')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await user.getIdToken()
      
      // Use new timezone-aware schedule_time format
      const scheduleTimePayload = {
        minute: scheduleTime.minute,
        hour: scheduleTime.hour,
        day: scheduleTime.day,
        month: scheduleTime.month,
        year: scheduleTime.year
      }
      
      console.log('Schedule creation:', {
        local_time: localScheduleDate.toISOString(),
        schedule_time: scheduleTimePayload,
        device_id: selectedDevice
      })
      
      const response = await axios.post('/api/schedule/create', {
        device_id: selectedDevice,
        schedule_time: scheduleTimePayload
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setMessage(response.data.message || 'Tạo lịch trình thành công!')
      
      // Reset form
      setSelectedDevice('')
      const now = new Date()
      setScheduleTime({
        minute: now.getMinutes(),
        hour: now.getHours(),
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear()
      })
      
      // Switch to manage tab to show the new schedule
      setTimeout(() => {
        setActiveTab('manage')
        loadUserSchedules()
      }, 2000)
      
    } catch (error) {
      console.error('Create schedule error:', error)
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError('Có lỗi xảy ra khi tạo lịch trình')
      }
    }
    setIsLoading(false)
  }

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Bạn có chắc muốn xóa lịch trình này?')) {
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await user.getIdToken()
      
      const response = await axios.delete(`/api/schedule/${scheduleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setMessage(response.data.message || 'Đã xóa lịch trình')
      loadUserSchedules()
    } catch (error) {
      console.error('Delete schedule error:', error)
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError('Có lỗi xảy ra khi xóa lịch trình')
      }
    }
    setIsLoading(false)
  }

  const formatScheduleTime = (schedule) => {
    // Use the new schedule_time_user format if available, otherwise fall back to expiry_time
    if (schedule.schedule_time_user) {
      const schedTime = schedule.schedule_time_user
      const localHour = schedTime.hour.toString().padStart(2, '0')
      const localMinute = schedTime.minute.toString().padStart(2, '0')
      const localDay = schedTime.day
      const localMonth = schedTime.month
      const localYear = schedTime.year
      
      return `${localYear}/${localMonth.toString().padStart(2, '0')}/${localDay.toString().padStart(2, '0')} ${localHour}:${localMinute}`
    } else if (schedule.expiry_time) {
      // Fallback for old format
      const expiryDate = new Date(schedule.expiry_time)
      const localHour = expiryDate.getHours().toString().padStart(2, '0')
      const localMinute = expiryDate.getMinutes().toString().padStart(2, '0')
      const localDay = expiryDate.getDate()
      const localMonth = expiryDate.getMonth() + 1
      const localYear = expiryDate.getFullYear()
      
      return `${localYear}/${localMonth.toString().padStart(2, '0')}/${localDay.toString().padStart(2, '0')} ${localHour}:${localMinute}`
    }
    return 'Invalid date'
  }

  const getScheduleStatus = (schedule) => {
    const now = new Date()
    let scheduleDate
    
    // Handle new format
    if (schedule.schedule_time_user) {
      const schedTime = schedule.schedule_time_user
      scheduleDate = new Date(schedTime.year, schedTime.month - 1, schedTime.day, schedTime.hour, schedTime.minute)
    } else if (schedule.expiry_time) {
      // Handle old format
      scheduleDate = new Date(schedule.expiry_time)
    } else {
      return { status: 'invalid', text: 'Lỗi', color: '#ef4444' }
    }
    
    if (schedule.status === 'sent') {
      return { status: 'sent', text: 'Đã gửi', color: '#10b981' }
    } else if (schedule.status === 'failed') {
      return { status: 'failed', text: 'Thất bại', color: '#ef4444' }
    } else if (scheduleDate <= now) {
      return { status: 'pending_overdue', text: 'Quá hạn', color: '#ef4444' }
    } else {
      return { status: 'pending', text: 'Đang chờ', color: '#f59e0b' }
    }
  }

  return (
    <div className="schedule-management">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>⏰ Quản lý Lịch trình</h1>
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
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <span className="tab-icon">➕</span>
            <span className="tab-label">Tạo lịch trình mới</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">Quản lý lịch trình</span>
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

        {/* Create Schedule Tab */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <div className="create-section">
              <div className="section-header">
                <h2>➕ Tạo lịch trình mới</h2>
                <p>Lập lịch thông báo đo sức khỏe cho thiết bị của bạn</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateSchedule(); }} className="create-form">
                <div className="form-group">
                  <label htmlFor="device">Chọn thiết bị</label>
                  <select
                    id="device"
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    required
                    className="form-select"
                  >
                    <option value="">-- Chọn thiết bị --</option>
                    {devices.map((device) => (
                      <option key={device.device_id} value={device.device_id}>
                        {device.device_id} {device.is_legacy ? '(Thiết bị chính)' : '(Thiết bị chia sẻ)'}
                      </option>
                    ))}
                  </select>
                  <div className="input-help">
                    Chọn thiết bị để lập lịch thông báo đo sức khỏe
                  </div>
                </div>

                <div className="time-section">
                  <h3>Thời gian thông báo</h3>
                  <div className="time-grid">
                    <div className="time-group">
                      <label htmlFor="year">Năm</label>
                      <select
                        id="year"
                        value={scheduleTime.year}
                        onChange={(e) => setScheduleTime({...scheduleTime, year: parseInt(e.target.value)})}
                        className="form-select"
                      >
                        {Array.from({length: 10}, (_, i) => {
                          const year = new Date().getFullYear() + i
                          return <option key={year} value={year}>{year}</option>
                        })}
                      </select>
                    </div>

                    <div className="time-group">
                      <label htmlFor="month">Tháng</label>
                      <select
                        id="month"
                        value={scheduleTime.month}
                        onChange={(e) => setScheduleTime({...scheduleTime, month: parseInt(e.target.value)})}
                        className="form-select"
                      >
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i+1} value={i+1}>{i+1}</option>
                        ))}
                      </select>
                    </div>

                    <div className="time-group">
                      <label htmlFor="day">Ngày</label>
                      <select
                        id="day"
                        value={scheduleTime.day}
                        onChange={(e) => setScheduleTime({...scheduleTime, day: parseInt(e.target.value)})}
                        className="form-select"
                      >
                        {Array.from({length: 31}, (_, i) => (
                          <option key={i+1} value={i+1}>{i+1}</option>
                        ))}
                      </select>
                    </div>

                    <div className="time-group">
                      <label htmlFor="hour">Giờ</label>
                      <select
                        id="hour"
                        value={scheduleTime.hour}
                        onChange={(e) => setScheduleTime({...scheduleTime, hour: parseInt(e.target.value)})}
                        className="form-select"
                      >
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="time-group">
                      <label htmlFor="minute">Phút</label>
                      <select
                        id="minute"
                        value={scheduleTime.minute}
                        onChange={(e) => setScheduleTime({...scheduleTime, minute: parseInt(e.target.value)})}
                        className="form-select"
                      >
                        {Array.from({length: 60}, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="preview-section">
                  <h4>Xem trước lịch trình</h4>
                  <div className="schedule-preview">
                    <div className="preview-icon">⏰</div>
                    <div className="preview-details">
                      <div className="preview-device">
                        Thiết bị: <strong>{selectedDevice || 'Chưa chọn'}</strong>
                      </div>
                      <div className="preview-time">
                        Thời gian: <strong>
                          {scheduleTime.hour.toString().padStart(2, '0')}:
                          {scheduleTime.minute.toString().padStart(2, '0')} - 
                          {scheduleTime.day}/{scheduleTime.month}/{scheduleTime.year}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || !selectedDevice}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner">⏳</span>
                      Đang tạo lịch trình...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">➕</span>
                      Tạo lịch trình
                    </>
                  )}
                </button>
              </form>

              <div className="info-section">
                <h3>📋 Lưu ý</h3>
                <div className="info-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Chọn thiết bị</h4>
                      <p>Chọn một trong các thiết bị đã đăng ký của bạn</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Đặt thời gian</h4>
                      <p>Chọn thời gian cụ thể để thiết bị gửi thông báo đo sức khỏe</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Xác nhận</h4>
                      <p>Hệ thống sẽ tự động gửi thông báo đến thiết bị vào thời gian đã đặt</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Schedules Tab */}
        {activeTab === 'manage' && (
          <div className="tab-content">
            <div className="manage-section">
              <div className="section-header">
                <div>
                  <h2>📋 Danh sách lịch trình</h2>
                  <p>Quản lý các lịch trình đã tạo</p>
                </div>
                <button 
                  onClick={loadUserSchedules}
                  className="refresh-button"
                  disabled={isLoading}
                  title="Làm mới danh sách"
                >
                  🔄 Làm mới
                </button>
              </div>

              {isLoading && (
                <div className="loading-state">
                  <span className="spinner">⏳</span>
                  Đang tải...
                </div>
              )}

              {!isLoading && schedules.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">⏰</div>
                  <h3>Chưa có lịch trình nào</h3>
                  <p>Hãy tạo lịch trình đầu tiên để bắt đầu nhận thông báo</p>
                  <button 
                    onClick={() => setActiveTab('create')}
                    className="btn-primary"
                  >
                    <span className="btn-icon">➕</span>
                    Tạo lịch trình mới
                  </button>
                </div>
              )}

              {!isLoading && schedules.length > 0 && (
                <div className="schedules-grid">
                  {schedules.map((schedule) => {
                    const status = getScheduleStatus(schedule)
                    return (
                      <div key={schedule.id} className="schedule-card">
                        <div className="schedule-header">
                          <div className="schedule-icon">⏰</div>
                          <div className="schedule-info">
                            <h3>{schedule.device_id}</h3>
                            <div className="schedule-time">
                              {formatScheduleTime(schedule)}
                            </div>
                          </div>
                          <div className="schedule-status" style={{color: status.color}}>
                            {status.text}
                          </div>
                        </div>
                        
                        <div className="schedule-meta">
                          <div className="meta-item">
                            <span className="meta-label">Tạo lúc:</span>
                            <span className="meta-value">
                              {new Date(schedule.time_create).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {schedule.sent_at && (
                            <div className="meta-item">
                              <span className="meta-label">Đã gửi lúc:</span>
                              <span className="meta-value">
                                {new Date(schedule.sent_at).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="schedule-actions">
                          <button 
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="btn-danger"
                            title="Xóa lịch trình"
                          >
                            🗑️ Xóa
                          </button>
                          {status.status === 'pending' && (
                            <button 
                              onClick={() => {
                                setSelectedDevice(schedule.device_id)
                                setScheduleTime(schedule.scheduled_time)
                                setActiveTab('create')
                              }}
                              className="btn-secondary"
                              title="Tạo lịch trình tương tự"
                            >
                              📝 Sao chép
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .schedule-management {
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .refresh-button {
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .refresh-button:hover:not(:disabled) {
          background: linear-gradient(45deg, #059669, #047857);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
          text-align: center;
        }

        .section-header h2 {
          color: #333;
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
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

        .create-form {
          max-width: 800px;
          margin: 0 auto 3rem;
        }

        .form-group {
          margin-bottom: 2rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.8);
        }

        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-help {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #666;
        }

        .time-section {
          margin-bottom: 2rem;
        }

        .time-section h3 {
          color: #333;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .time-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .time-group {
          display: flex;
          flex-direction: column;
        }

        .time-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #555;
          margin-bottom: 0.5rem;
        }

        .preview-section {
          margin-bottom: 2rem;
          background: rgba(102, 126, 234, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .preview-section h4 {
          color: #333;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .schedule-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .preview-icon {
          font-size: 2rem;
        }

        .preview-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .preview-device, .preview-time {
          color: #333;
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
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .btn-icon {
          font-size: 1rem;
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

        .btn-danger {
          background: linear-gradient(45deg, #ef4444, #f87171);
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }

        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        .schedules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .schedule-card {
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .schedule-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .schedule-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .schedule-icon {
          font-size: 2rem;
        }

        .schedule-info {
          flex: 1;
        }

        .schedule-info h3 {
          color: #333;
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
        }

        .schedule-time {
          color: #666;
          font-weight: 500;
        }

        .schedule-status {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .schedule-meta {
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding-top: 1rem;
          margin-bottom: 1rem;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .meta-label {
          color: #666;
          font-size: 0.875rem;
        }

        .meta-value {
          color: #333;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .schedule-actions {
          display: flex;
          gap: 0.75rem;
        }

        @media (max-width: 768px) {
          .tab-btn .tab-label {
            display: none;
          }

          .time-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .schedules-grid {
            grid-template-columns: 1fr;
          }

          .header .container {
            flex-direction: column;
            gap: 1rem;
          }

          .schedule-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .schedule-actions {
            flex-direction: column;
          }

          .container {
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  )
}