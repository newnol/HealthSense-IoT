// pages/landing.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/Auth/AuthModal'
import { useRouter } from 'next/router'
import AnimatedElement from '../components/AnimatedElement'
import { useAnime } from '../hooks/useAnime.jsx'

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { animate } = useAnime()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Animate health stats on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      animate('.stat-value', {
        innerHTML: [0, (el) => el.getAttribute('data-value')],
        duration: 2000,
        easing: 'easeOutExpo',
        round: 1
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [animate])

  if (user) {
    return <div>Đang chuyển hướng...</div>
  }

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <AnimatedElement animation="fadeInLeft" className="logo">
            <h2>💓 HealthSense</h2>
          </AnimatedElement>
          <AnimatedElement animation="fadeInRight" className="nav">
            <button 
              className="btn-login"
              onClick={() => setShowAuthModal(true)}
            >
              Đăng nhập
            </button>
          </AnimatedElement>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <AnimatedElement animation="fadeInUp" delay={200} className="hero-content">
            <h1>Theo dõi sức khỏe thông minh với AI</h1>
            <p className="hero-subtitle">
              Hệ thống giám sát nhịp tim và SpO2 tiên tiến với ESP32, 
              cung cấp phân tích AI và lời khuyên sức khỏe cá nhân hóa
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => setShowAuthModal(true)}
              >
                Bắt đầu ngay
              </button>
              <button className="btn-secondary">
                Tìm hiểu thêm
              </button>
            </div>
          </AnimatedElement>
          <AnimatedElement animation="scaleIn" delay={400} className="hero-image">
            <div className="device-mockup">
              <div className="screen">
                <div className="health-stats">
                  <div className="stat">
                    <span className="stat-label">Nhịp tim</span>
                    <span className="stat-value" data-value="72">0</span> BPM
                  </div>
                  <div className="stat">
                    <span className="stat-label">SpO₂</span>
                    <span className="stat-value" data-value="98">0</span>%
                  </div>
                </div>
              </div>
            </div>
          </AnimatedElement>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <AnimatedElement animation="fadeInUp" trigger="onScroll" className="section-title">
            <h2>Tính năng nổi bật</h2>
          </AnimatedElement>
          <div className="features-grid">
            <AnimatedElement animation="fadeInUp" delay={100} trigger="onScroll" className="feature-card">
              <div className="feature-icon">📡</div>
              <h3>Thu thập dữ liệu thời gian thực</h3>
              <p>ESP32 đo và truyền dữ liệu nhịp tim và SpO2 với độ chính xác cao</p>
            </AnimatedElement>
            
            <AnimatedElement animation="fadeInUp" delay={200} trigger="onScroll" className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Phân tích AI thông minh</h3>
              <p>Xử lý và phân tích dữ liệu sinh lý, phát hiện bất thường trong chỉ số sức khỏe</p>
            </AnimatedElement>
            
            <AnimatedElement animation="fadeInUp" delay={300} trigger="onScroll" className="feature-card">
              <div className="feature-icon">💡</div>
              <h3>Lời khuyên cá nhân hóa</h3>
              <p>Đưa ra khuyến nghị lối sống dựa trên dữ liệu và cảnh báo sớm các vấn đề sức khỏe</p>
            </AnimatedElement>
            
            <AnimatedElement animation="fadeInUp" delay={400} trigger="onScroll" className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Trực quan hóa dữ liệu</h3>
              <p>Dashboard theo dõi chỉ số sức khỏe với biểu đồ xu hướng theo thời gian</p>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <AnimatedElement animation="fadeInUp" trigger="onScroll" className="cta-content">
            <h2>Sẵn sàng theo dõi sức khỏe của bạn?</h2>
            <p>Tham gia ngay để trải nghiệm hệ thống giám sát sức khỏe thông minh</p>
            <button 
              className="btn-primary large"
              onClick={() => setShowAuthModal(true)}
            >
              Đăng ký miễn phí
            </button>
          </AnimatedElement>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>💓 HealthSense</h3>
              <p>Hệ thống giám sát sức khỏe thông minh với công nghệ AI</p>
            </div>
            <div className="footer-section">
              <h4>Liên hệ</h4>
              <p>Email: support@HealthSense.com</p>
              <p>Phone: +84 123 456 789</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 HealthSense. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Header */
        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
        }

        .logo h2 {
          margin: 0;
          color: #0070f3;
        }

        .btn-login {
          background: #0070f3;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .btn-login:hover {
          background: #0051cc;
          transform: translateY(-1px);
        }

        /* Hero Section */
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8rem 0 4rem;
          margin-top: 70px;
        }

        .hero .container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn-primary {
          background: white;
          color: #667eea;
          border: none;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .btn-primary.large {
          padding: 1.2rem 3rem;
          font-size: 1.1rem;
        }

        .btn-secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          background: white;
          color: #667eea;
        }

        /* Device Mockup */
        .device-mockup {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          transform: perspective(1000px) rotateY(-15deg);
        }

        .screen {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 2rem;
          border: 2px solid #e9ecef;
        }

        .health-stats {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-label {
          color: #666;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0070f3;
        }

        /* Features Section */
        .features {
          padding: 6rem 0;
          background: #f8f9fa;
        }

        .features h2 {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 3rem;
          color: #333;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.5s;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 35px rgba(0,0,0,0.15);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          transition: transform 0.3s ease;
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          color: #333;
        }

        .feature-card p {
          color: #666;
          line-height: 1.6;
        }

        /* CTA Section */
        .cta {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4rem 0;
          text-align: center;
        }

        .cta h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .cta p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        /* Footer */
        .footer {
          background: #333;
          color: white;
          padding: 3rem 0 1rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-section h3,
        .footer-section h4 {
          margin-bottom: 1rem;
        }

        .footer-section p {
          margin: 0.5rem 0;
        }

        .footer-bottom {
          border-top: 1px solid #555;
          padding-top: 1rem;
          text-align: center;
          color: #ccc;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero .container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero h1 {
            font-size: 2rem;
          }

          .hero-buttons {
            justify-content: center;
          }

          .device-mockup {
            transform: none;
            margin-top: 2rem;
          }

          .features h2,
          .cta h2 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}
