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
        <button 
          onClick={() => router.push('/dashboard')} 
          className="btn-back"
        >
          ← Về Dashboard
        </button>
        <h1>Hồ sơ cá nhân</h1>
      </div>
      <UserProfile />
      
      <style jsx>{`
        .profile-navigation {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 0;
        }
        
        .btn-back {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .btn-back:hover {
          background: #5a6268;
        }
        
        .profile-navigation h1 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
        }
      `}</style>
    </div>
  )
}
