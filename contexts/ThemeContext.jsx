// contexts/ThemeContext.jsx - Theme management context
import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [systemTheme, setSystemTheme] = useState('light')

  // Initialize theme
  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    // Check saved preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      setTheme('system')
    }

    // Listen for system theme changes
    const handleSystemThemeChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = theme === 'system' ? systemTheme : theme
    
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(effectiveTheme)
    document.documentElement.setAttribute('data-theme', effectiveTheme)

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.content = effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff'
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff'
      document.head.appendChild(meta)
    }
  }, [theme, systemTheme])

  const setThemePreference = (newTheme) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) {
      console.warn('Invalid theme:', newTheme)
      return
    }

    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const effectiveTheme = theme === 'system' ? systemTheme : theme
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light'
    setThemePreference(newTheme)
  }

  const getEffectiveTheme = () => {
    return theme === 'system' ? systemTheme : theme
  }

  const value = {
    theme,
    systemTheme,
    effectiveTheme: getEffectiveTheme(),
    setTheme: setThemePreference,
    toggleTheme,
    isSystemTheme: theme === 'system'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}