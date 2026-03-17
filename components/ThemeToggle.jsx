// components/ThemeToggle.jsx - Theme toggle component
import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle = ({ className = '', showLabel = true }) => {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme()

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  return (
    <div className={`theme-toggle ${className}`}>
      {showLabel && (
        <label className="theme-label">
          Giao diện
        </label>
      )}
      
      <div className="theme-options">
        <button
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
          title="Giao diện sáng"
        >
          <span className="theme-icon">☀️</span>
          {showLabel && <span className="theme-text">Sáng</span>}
        </button>

        <button
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
          title="Giao diện tối"
        >
          <span className="theme-icon">🌙</span>
          {showLabel && <span className="theme-text">Tối</span>}
        </button>

        <button
          className={`theme-option ${theme === 'system' ? 'active' : ''}`}
          onClick={() => handleThemeChange('system')}
          title="Theo hệ thống"
        >
          <span className="theme-icon">💻</span>
          {showLabel && <span className="theme-text">Hệ thống</span>}
        </button>
      </div>

      <style jsx>{`
        .theme-toggle {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .theme-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .theme-options {
          display: flex;
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 4px;
          border: 1px solid var(--border-color);
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .theme-option:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .theme-option.active {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .theme-icon {
          font-size: 1rem;
          display: flex;
          align-items: center;
        }

        .theme-text {
          font-weight: 500;
        }

        /* Compact version */
        .theme-toggle.compact .theme-options {
          flex-direction: column;
          width: auto;
        }

        .theme-toggle.compact .theme-option {
          padding: 0.375rem;
          justify-content: center;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .theme-toggle {
            flex-direction: row;
            align-items: center;
            gap: 1rem;
          }

          .theme-options {
            flex: 1;
            max-width: 200px;
          }

          .theme-text {
            display: none;
          }

          .theme-option {
            flex: 1;
            justify-content: center;
            padding: 0.5rem;
          }
        }

        /* CSS Variables for theming */
        :global(:root) {
          --primary-color: #007bff;
          --text-primary: #333333;
          --text-secondary: #666666;
          --bg-primary: #ffffff;
          --bg-secondary: #f8f9fa;
          --bg-hover: #e9ecef;
          --border-color: #dee2e6;
        }

        :global([data-theme="dark"]) {
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --bg-primary: #1a1a1a;
          --bg-secondary: #2d2d2d;
          --bg-hover: #404040;
          --border-color: #404040;
        }
      `}</style>
    </div>
  )
}

// Simple toggle button version
export const SimpleThemeToggle = () => {
  const { effectiveTheme, toggleTheme } = useTheme()

  return (
    <button
      className="simple-theme-toggle"
      onClick={toggleTheme}
      title={`Chuyển sang ${effectiveTheme === 'light' ? 'giao diện tối' : 'giao diện sáng'}`}
    >
      <span className="toggle-icon">
        {effectiveTheme === 'light' ? '🌙' : '☀️'}
      </span>

      <style jsx>{`
        .simple-theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .simple-theme-toggle:hover {
          background: var(--bg-hover);
          transform: scale(1.05);
        }

        .toggle-icon {
          font-size: 1.2rem;
        }
      `}</style>
    </button>
  )
}

export default ThemeToggle