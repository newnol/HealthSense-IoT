// pages/profile.jsx
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import UserProfile from '../components/UserProfile'

export default function ProfilePage() {
  const { user: currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/landing')
    }
  }, [currentUser, loading, router])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div>
      <div className="profile-navigation">
        <h1>Hồ sơ cá nhân</h1>
        <button 
          onClick={() => router.push('/dashboard')} 
          className="btn-back"
          aria-label="Về Dashboard"
        >
          ← Về Dashboard
        </button>
      </div>
      <UserProfile />
      
      <style jsx>{`
        .profile-navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 2rem;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 0;
          position: sticky;
          top: 0;
          z-index: 5;
          backdrop-filter: saturate(180%) blur(6px);
        }
        
        .btn-back {
          background: #6c757d;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.3s, transform 0.05s ease-in;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .btn-back:hover {
          background: #5a6268;
        }
        .btn-back:active {
          transform: translateY(1px);
        }
        
        .profile-navigation h1 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
