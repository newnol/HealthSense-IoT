// pages/landing.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import { useAnime } from '../hooks/useAnime.jsx'

// Landing Page Components
import Header from '../components/Landing/Header'
import HeroSection from '../components/Landing/HeroSection'
import StatsSection from '../components/Landing/StatsSection'
import FeaturesSection from '../components/Landing/FeaturesSection'
import TestimonialsSection from '../components/Landing/TestimonialsSection'
import CTASection from '../components/Landing/CTASection'
import Footer from '../components/Landing/Footer'
import AuthModal from '../components/Auth/AuthModal'

// Styles
import styles from '../styles/components/landing.module.css'

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
      
      // Animate stats numbers
      animate('.stat-number', {
        innerHTML: [0, (el) => el.getAttribute('data-value')],
        duration: 2500,
        easing: 'easeOutExpo',
        round: 1,
        delay: (el, i) => i * 200
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [animate])

  if (user) {
    return <div>Đang chuyển hướng...</div>
  }

  const handleShowAuthModal = () => setShowAuthModal(true)
  const handleCloseAuthModal = () => setShowAuthModal(false)

  return (
    <div className={styles.landingPage}>
      <Header onShowAuthModal={handleShowAuthModal} />
      
      <HeroSection onShowAuthModal={handleShowAuthModal} />
      
      <StatsSection />
      
      <FeaturesSection />
      
      <TestimonialsSection />
      
      <CTASection onShowAuthModal={handleShowAuthModal} />
      
      <Footer />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleCloseAuthModal} 
      />
    </div>
  )
}
