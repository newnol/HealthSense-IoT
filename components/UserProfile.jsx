// components/UserProfile.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function UserProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    year_of_birth: '',
    sex: '',
    height: '',
    weight: '',
    timezone: ''
  })
  const [timezones, setTimezones] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user: currentUser } = useAuth()

  useEffect(() => {
    if (currentUser) {
      fetchProfile()
      fetchTimezones()
    }
  }, [currentUser])

  const fetchProfile = async () => {
    try {
      const token = await currentUser.getIdToken()
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setFormData({
          year_of_birth: data.profile.year_of_birth || '',
          sex: data.profile.sex || '',
          height: data.profile.height || '',
          weight: data.profile.weight || '',
          timezone: data.profile.timezone || ''
        })
      } else if (response.status === 404) {
        // No profile exists yet - this is expected for existing users
        setProfile(null)
      } else {
        // For other HTTP errors, log but don't crash
        console.warn('Profile fetch returned status:', response.status)
        const errorData = await response.json().catch(() => ({}))
        console.warn('Error details:', errorData)
        setProfile(null) // Treat as no profile exists
      }
    } catch (error) {
      // Network or other errors - treat as no profile exists
      console.warn('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimezones = async () => {
    try {
      const response = await fetch('/api/profile/timezones')
      const data = await response.json()
      if (data.status === 'success') {
        setTimezones(data.timezones)
      }
    } catch (error) {
      console.error('Failed to fetch timezones:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      console.log('Current user:', currentUser)
      if (!currentUser) {
        setError('Người dùng chưa đăng nhập')
        return
      }

      const token = await currentUser.getIdToken()
      console.log('Token obtained:', token ? 'Yes' : 'No')
      console.log('Token length:', token?.length)
      console.log('Token preview:', token?.substring(0, 50) + '...')
      
      // Test the auth endpoint first
      const authTestResponse = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('Auth test response status:', authTestResponse.status)
      
      if (!authTestResponse.ok) {
        const authError = await authTestResponse.json()
        console.error('Auth test error:', authError)
        setError(`Authentication failed: ${authError.detail || 'Unknown error'}`)
        return
      }
      
      const method = profile ? 'PUT' : 'POST'
      const response = await fetch('/api/profile', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          year_of_birth: parseInt(formData.year_of_birth),
          sex: formData.sex,
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          timezone: formData.timezone
        })
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setEditing(false)
        setSuccess('Cập nhật hồ sơ thành công!')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        setError(errorData.detail || 'Không thể cập nhật hồ sơ')
      }
    } catch (error) {
      setError('Đã có lỗi xảy ra')
      console.error('Error updating profile:', error)
    }
  }

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year)
    }
    return years
  }

  const formatAge = (yearOfBirth) => {
    const currentYear = new Date().getFullYear()
    return currentYear - yearOfBirth
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        {profile && !editing && (
          <button onClick={() => setEditing(true)} className="btn-edit">
            Chỉnh sửa
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {!profile && !editing && (
        <div className="no-profile">
          <p>Bạn chưa có hồ sơ cá nhân. Vui lòng tạo hồ sơ để sử dụng đầy đủ tính năng.</p>
          <button onClick={() => setEditing(true)} className="btn-primary">
            Tạo hồ sơ
          </button>
        </div>
      )}

      {profile && !editing && (
        <div className="profile-view">
          <div className="profile-item">
            <label>Năm sinh:</label>
            <span>{profile.year_of_birth} ({formatAge(profile.year_of_birth)} tuổi)</span>
          </div>
          
          <div className="profile-item">
            <label>Giới tính:</label>
            <span>
              {profile.sex === 'male' ? 'Nam' : 
               profile.sex === 'female' ? 'Nữ' : 'Khác'}
            </span>
          </div>
          
          <div className="profile-item">
            <label>Chiều cao:</label>
            <span>{profile.height} cm</span>
          </div>
          
          <div className="profile-item">
            <label>Cân nặng:</label>
            <span>{profile.weight} kg</span>
          </div>
          
          <div className="profile-item">
            <label>Múi giờ:</label>
            <span>{profile.timezone}</span>
          </div>
          
          <div className="profile-item">
            <label>Cập nhật lần cuối:</label>
            <span>{new Date(profile.updated_at).toLocaleString('vi-VN')}</span>
          </div>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="year_of_birth">Năm sinh:</label>
            <select
              id="year_of_birth"
              value={formData.year_of_birth}
              onChange={(e) => setFormData({...formData, year_of_birth: e.target.value})}
              required
            >
              <option value="">Chọn năm sinh</option>
              {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sex">Giới tính:</label>
            <select
              id="sex"
              value={formData.sex}
              onChange={(e) => setFormData({...formData, sex: e.target.value})}
              required
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="height">Chiều cao (cm):</label>
            <input
              type="number"
              id="height"
              value={formData.height}
              onChange={(e) => setFormData({...formData, height: e.target.value})}
              min="1"
              max="300"
              step="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">Cân nặng (kg):</label>
            <input
              type="number"
              id="weight"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              min="1"
              max="1000"
              step="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="timezone">Múi giờ:</label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({...formData, timezone: e.target.value})}
              required
            >
              <option value="">Chọn múi giờ</option>
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="button-group">
            <button 
              type="button" 
              onClick={() => setEditing(false)} 
              className="btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {profile ? 'Cập nhật' : 'Tạo hồ sơ'}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .profile-container {
          max-width: 760px;
          margin: 2rem auto;
          padding: 2rem;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #eee;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }

        .profile-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 2rem;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .success-message {
          background: #efe;
          color: #363;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .no-profile {
          text-align: center;
          padding: 2rem;
        }

        .no-profile p {
          color: #666;
          margin-bottom: 1.5rem;
        }

        .profile-view {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .profile-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: #f9fafb;
          border-radius: 10px;
          border: 1px solid #eee;
          transition: background 0.2s ease, transform 0.05s ease-in;
        }

        .profile-item:hover {
          background: #f3f4f6;
        }

        .profile-item label {
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.2px;
        }

        .profile-item span {
          color: #111827;
          font-weight: 600;
        }

        .profile-form .form-group {
          margin-bottom: 1rem;
        }

        .profile-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #555;
        }

        .profile-form input,
        .profile-form select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          background: #fff;
        }

        .profile-form input:focus,
        .profile-form select:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 3px rgba(0,112,243,0.1);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-primary, .btn-secondary, .btn-edit {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #0070f3;
          color: white;
          flex: 1;
        }

        .btn-primary:hover {
          background: #0059d6;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          flex: 1;
        }

        .btn-secondary:hover {
          background: #e5e5e5;
        }

        .btn-edit {
          background: #28a745;
          color: white;
        }

        .btn-edit:hover {
          background: #218838;
        }

        @media (min-width: 768px) {
          .profile-view {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}
