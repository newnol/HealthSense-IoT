// components/Navigation.jsx - Responsive navigation component
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { useAdmin } from '../contexts/AdminContext'
import ThemeToggle, { SimpleThemeToggle } from './ThemeToggle'

const Navigation = () => {
  const { user, logout } = useAuth()
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [router.pathname])

  // Navigation items
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/profile', label: 'Hồ sơ', icon: '👤' },
    { href: '/device-management', label: 'Thiết bị', icon: '📱' },
    { href: '/schedule', label: 'Lịch trình', icon: '📅' },
    { href: '/ai', label: 'AI Insights', icon: '🤖' },
  ]

  const adminItems = [
    { href: '/admin', label: 'Quản trị', icon: '⚙️' },
    { href: '/user-roles', label: 'Người dùng', icon: '👥' },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (href) => router.pathname === href

  if (!user) return null

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo/Brand */}
        <Link href="/dashboard" className="nav-brand">
          <span className="brand-icon">🩺</span>
          <span className="brand-text">HealthSense</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-menu desktop-menu">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}

          {isAdmin && (
            <div className="nav-divider"></div>
          )}

          {isAdmin && adminItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link admin-link ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="nav-actions desktop-actions">
          <SimpleThemeToggle />
          
          <div className="user-menu">
            <button className="user-button">
              <span className="user-avatar">
                {user.email?.[0]?.toUpperCase() || '?'}
              </span>
              <span className="user-name">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </button>
            
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-email">{user.email}</div>
                {isAdmin && <div className="user-role">Quản trị viên</div>}
              </div>
              <div className="dropdown-divider"></div>
              <Link href="/profile" className="dropdown-item">
                <span>👤</span> Hồ sơ cá nhân
              </Link>
              <Link href="/settings" className="dropdown-item">
                <span>⚙️</span> Cài đặt
              </Link>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout-item">
                <span>🚪</span> Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-user-info">
            <div className="mobile-user-avatar">
              {user.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="mobile-user-name">
                {user.displayName || user.email?.split('@')[0]}
              </div>
              <div className="mobile-user-email">{user.email}</div>
            </div>
          </div>
        </div>

        <div className="mobile-nav-items">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="mobile-nav-divider"></div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-nav-link admin-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </div>

        <div className="mobile-menu-footer">
          <div className="mobile-theme-toggle">
            <ThemeToggle />
          </div>
          
          <button onClick={handleLogout} className="mobile-logout-button">
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <style jsx>{`
        .navigation {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          transition: all var(--transition);
        }

        .navigation.scrolled {
          box-shadow: var(--shadow);
          backdrop-filter: blur(10px);
          background: rgba(var(--bg-primary-rgb), 0.9);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing);
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-weight: 700;
          font-size: var(--text-lg);
          color: var(--primary-color);
          text-decoration: none;
        }

        .brand-icon {
          font-size: 1.5rem;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing);
          border-radius: var(--radius);
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: all var(--transition);
        }

        .nav-link:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .nav-link.active {
          background: var(--primary-color);
          color: white;
        }

        .nav-link.admin-link {
          border: 1px solid var(--warning-color);
        }

        .nav-link.admin-link.active {
          background: var(--warning-color);
        }

        .nav-divider {
          width: 1px;
          height: 24px;
          background: var(--border-color);
          margin: 0 var(--spacing-sm);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing);
        }

        .user-menu {
          position: relative;
        }

        .user-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition);
        }

        .user-button:hover {
          background: var(--bg-hover);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: var(--text-sm);
        }

        .user-name {
          font-weight: 500;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: var(--spacing-xs);
          min-width: 200px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all var(--transition);
        }

        .user-menu:hover .user-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .user-info {
          padding: var(--spacing);
        }

        .user-email {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .user-role {
          font-size: var(--text-xs);
          color: var(--warning-color);
          font-weight: 600;
          margin-top: var(--spacing-xs);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-color);
          margin: var(--spacing-xs) 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-sm) var(--spacing);
          border: none;
          background: none;
          color: var(--text-primary);
          text-decoration: none;
          cursor: pointer;
          transition: background var(--transition);
        }

        .dropdown-item:hover {
          background: var(--bg-hover);
        }

        .logout-item {
          color: var(--danger-color);
        }

        /* Mobile Styles */
        .mobile-menu-button {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          border: none;
          background: none;
          cursor: pointer;
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hamburger span {
          width: 20px;
          height: 2px;
          background: var(--text-primary);
          transition: all var(--transition);
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        .mobile-menu {
          position: fixed;
          top: 65px;
          right: -100%;
          width: 300px;
          height: calc(100vh - 65px);
          background: var(--bg-primary);
          border-left: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          transition: right var(--transition);
          overflow-y: auto;
          z-index: var(--z-fixed);
        }

        .mobile-menu.open {
          right: 0;
        }

        .mobile-menu-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: var(--spacing);
        }

        .mobile-user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: var(--text-lg);
        }

        .mobile-user-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .mobile-user-email {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .mobile-nav-items {
          padding: var(--spacing);
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: var(--spacing);
          padding: var(--spacing);
          border-radius: var(--radius);
          color: var(--text-secondary);
          text-decoration: none;
          margin-bottom: var(--spacing-xs);
          transition: all var(--transition);
        }

        .mobile-nav-link:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .mobile-nav-link.active {
          background: var(--primary-color);
          color: white;
        }

        .mobile-nav-link.admin-link {
          border: 1px solid var(--warning-color);
        }

        .mobile-nav-link.admin-link.active {
          background: var(--warning-color);
        }

        .mobile-nav-divider {
          height: 1px;
          background: var(--border-color);
          margin: var(--spacing) 0;
        }

        .mobile-menu-footer {
          padding: var(--spacing-md);
          border-top: 1px solid var(--border-color);
          margin-top: auto;
        }

        .mobile-theme-toggle {
          margin-bottom: var(--spacing);
        }

        .mobile-logout-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing);
          border: none;
          border-radius: var(--radius);
          background: var(--bg-hover);
          color: var(--danger-color);
          cursor: pointer;
          transition: all var(--transition);
        }

        .mobile-logout-button:hover {
          background: var(--danger-color);
          color: white;
        }

        .mobile-menu-overlay {
          position: fixed;
          top: 65px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: var(--z-modal-backdrop);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .nav-link .nav-text {
            display: none;
          }
          
          .user-name {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .desktop-menu,
          .desktop-actions {
            display: none;
          }

          .mobile-menu-button {
            display: flex;
          }

          .brand-text {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .mobile-menu {
            width: 100%;
            right: -100%;
          }

          .mobile-menu.open {
            right: 0;
          }
        }
      `}</style>
    </nav>
  )
}

export default Navigation