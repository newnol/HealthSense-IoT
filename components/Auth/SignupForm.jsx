// components/Auth/SignupForm.js
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function SignupForm({ onClose, switchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [yearOfBirth, setYearOfBirth] = useState('')
  const [sex, setSex] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [timezone, setTimezone] = useState('')
  const [timezones, setTimezones] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Auth info, 2: Profile info
  const { signup, loginWithGoogle } = useAuth()

  useEffect(() => {
    // Auto-detect timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(detectedTimezone)
    
    // Fetch available timezones
    fetchTimezones()
  }, [])

  const fetchTimezones = async () => {
    try {
      const response = await fetch('/api/profile/timezones')
      const data = await response.json()
      if (data.status === 'success') {
        setTimezones(data.timezones)
      }
    } catch (error) {
      console.error('Failed to fetch timezones:', error)
      // Fallback timezones
      setTimezones([
        { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (UTC+07:00)' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok (UTC+07:00)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+09:00)' },
        { value: 'America/New_York', label: 'America/New_York (UTC-05:00)' }
      ])
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp')
    }
    
    if (password.length < 6) {
      return setError('Mật khẩu phải có ít nhất 6 ký tự')
    }

    setError('')
    setStep(2) // Move to profile step
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    // Validate profile fields
    const currentYear = new Date().getFullYear()
    const birthYear = parseInt(yearOfBirth)
    
    if (!birthYear || birthYear < 1900 || birthYear > currentYear) {
      return setError('Năm sinh không hợp lệ')
    }
    
    if (!sex) {
      return setError('Vui lòng chọn giới tính')
    }
    
    const heightNum = parseFloat(height)
    if (!heightNum || heightNum <= 0 || heightNum > 300) {
      return setError('Chiều cao phải từ 1-300cm')
    }
    
    const weightNum = parseFloat(weight)
    if (!weightNum || weightNum <= 0 || weightNum > 1000) {
      return setError('Cân nặng phải từ 1-1000kg')
    }

    try {
      setError('')
      setLoading(true)
      
      // Create user account
      const userCredential = await signup(email, password)
      
      // Create user profile
      const token = await userCredential.user.getIdToken()
      const profileResponse = await fetch('/api/profile/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          year_of_birth: birthYear,
          sex: sex,
          height: heightNum,
          weight: weightNum,
          timezone: timezone
        })
      })
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json()
        throw new Error(errorData.detail || 'Failed to create profile')
      }
      
      onClose()
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng')
      } else if (error.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu')
      } else {
        setError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      }
    }
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    try {
      setError('')
      setLoading(true)
      await loginWithGoogle()
      onClose()
    } catch (error) {
      setError('Đăng ký với Google thất bại.')
    }
    setLoading(false)
  }

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year)
    }
    return years
  }

  return (
    <div className="signup-form">
      <h2>Đăng ký tài khoản</h2>
      <div className="progress-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className="line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
      </div>
      <p className="step-title">
        {step === 1 ? 'Thông tin đăng nhập' : 'Thông tin cá nhân'}
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      {step === 1 && (
        <form onSubmit={handleAuthSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary">
            Tiếp tục
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label htmlFor="yearOfBirth">Năm sinh:</label>
            <select
              id="yearOfBirth"
              value={yearOfBirth}
              onChange={(e) => setYearOfBirth(e.target.value)}
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
              value={sex}
              onChange={(e) => setSex(e.target.value)}
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
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="1"
              max="300"
              step="0.1"
              placeholder="Ví dụ: 170"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">Cân nặng (kg):</label>
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="1"
              max="1000"
              step="0.1"
              placeholder="Ví dụ: 65"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="timezone">Múi giờ:</label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
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
              onClick={() => setStep(1)} 
              className="btn-secondary"
            >
              Quay lại
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Đang đăng ký...' : 'Hoàn thành đăng ký'}
            </button>
          </div>
        </form>
      )}

      {step === 1 && (
        <>
          <div className="divider">hoặc</div>
          
          <button 
            onClick={handleGoogleSignup} 
            disabled={loading}
            className="btn-google"
          >
            🔍 Đăng ký với Google
          </button>
        </>
      )}

      <p className="switch-form">
        Đã có tài khoản? 
        <button onClick={switchToLogin} className="link-button">
          Đăng nhập ngay
        </button>
      </p>

      <style jsx>{`
        .signup-form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 450px;
        }
        
        .signup-form h2 {
          text-align: center;
          margin-bottom: 1rem;
          color: #333;
        }

        .progress-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .progress-indicator .step {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #ddd;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .progress-indicator .step.active {
          background: #0070f3;
          color: white;
        }

        .progress-indicator .line {
          width: 50px;
          height: 2px;
          background: #ddd;
          margin: 0 10px;
        }

        .step-title {
          text-align: center;
          margin-bottom: 1.5rem;
          color: #666;
          font-size: 0.9rem;
        }
        
        .error-message {
          background: #fee;
          color: #c33;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #555;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 3px rgba(0,112,243,0.1);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .button-group button {
          flex: 1;
        }
        
        .btn-primary, .btn-secondary, .btn-google {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 1rem;
        }
        
        .btn-primary {
          background: #0070f3;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #0051cc;
        }
        
        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e5e5;
        }
        
        .btn-google {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        
        .btn-google:hover:not(:disabled) {
          background: #e5e5e5;
        }
        
        .divider {
          text-align: center;
          margin: 1rem 0;
          color: #666;
          position: relative;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 45%;
          height: 1px;
          background: #ddd;
        }
        
        .divider::before {
          left: 0;
        }
        
        .divider::after {
          right: 0;
        }
        
        .switch-form {
          text-align: center;
          margin-top: 1rem;
          color: #666;
        }
        
        .link-button {
          background: none;
          border: none;
          color: #0070f3;
          cursor: pointer;
          text-decoration: underline;
          margin-left: 0.5rem;
        }
        
        .link-button:hover {
          color: #0051cc;
        }
      `}</style>
    </div>
  )
}
