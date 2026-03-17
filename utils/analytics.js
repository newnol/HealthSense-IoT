// utils/analytics.js - Analytics and monitoring utilities
class Analytics {
  constructor() {
    this.isInitialized = false
    this.userId = null
    this.sessionId = this.generateSessionId()
    this.events = []
  }

  // Initialize analytics
  init(config = {}) {
    if (typeof window === 'undefined') return

    this.config = {
      enableGoogleAnalytics: config.enableGoogleAnalytics || false,
      enableMixpanel: config.enableMixpanel || false,
      enableCustomAnalytics: config.enableCustomAnalytics !== false, // Default to true
      apiEndpoint: config.apiEndpoint || '/api/analytics',
      debug: config.debug || process.env.NODE_ENV === 'development',
      ...config
    }

    // Initialize Google Analytics
    if (this.config.enableGoogleAnalytics && this.config.googleAnalyticsId) {
      this.initGoogleAnalytics()
    }

    // Initialize Mixpanel
    if (this.config.enableMixpanel && this.config.mixpanelToken) {
      this.initMixpanel()
    }

    // Set up custom analytics
    if (this.config.enableCustomAnalytics) {
      this.initCustomAnalytics()
    }

    this.isInitialized = true
    this.log('Analytics initialized', this.config)
  }

  // Generate unique session ID
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Set user ID
  setUserId(userId) {
    this.userId = userId
    
    if (typeof gtag !== 'undefined') {
      gtag('config', this.config.googleAnalyticsId, {
        user_id: userId
      })
    }

    if (typeof mixpanel !== 'undefined') {
      mixpanel.identify(userId)
    }

    this.log('User ID set', { userId })
  }

  // Track page views
  trackPageView(page, title = '') {
    if (!this.isInitialized) return

    const eventData = {
      event_type: 'page_view',
      page,
      title,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : ''
    }

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('config', this.config.googleAnalyticsId, {
        page_title: title,
        page_location: window.location.href
      })
    }

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track('Page View', eventData)
    }

    // Custom analytics
    this.trackCustomEvent(eventData)
    this.log('Page view tracked', eventData)
  }

  // Track custom events
  trackEvent(eventName, properties = {}) {
    if (!this.isInitialized) return

    const eventData = {
      event_type: 'custom_event',
      event_name: eventName,
      properties,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: properties.category || 'engagement',
        event_label: properties.label || '',
        value: properties.value || 0,
        ...properties
      })
    }

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(eventName, eventData)
    }

    // Custom analytics
    this.trackCustomEvent(eventData)
    this.log('Event tracked', eventData)
  }

  // Track user actions
  trackUserAction(action, category = 'user_interaction', properties = {}) {
    this.trackEvent('user_action', {
      action,
      category,
      ...properties
    })
  }

  // Track errors
  trackError(error, context = {}) {
    const errorData = {
      event_type: 'error',
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false
      })
    }

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track('Error', errorData)
    }

    // Custom analytics
    this.trackCustomEvent(errorData)
    this.log('Error tracked', errorData)
  }

  // Track performance metrics
  trackPerformance(metrics) {
    if (!this.isInitialized) return

    const performanceData = {
      event_type: 'performance',
      metrics,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    // Google Analytics
    if (typeof gtag !== 'undefined' && metrics.loadTime) {
      gtag('event', 'timing_complete', {
        name: 'load',
        value: Math.round(metrics.loadTime)
      })
    }

    // Custom analytics
    this.trackCustomEvent(performanceData)
    this.log('Performance tracked', performanceData)
  }

  // Track health data events
  trackHealthData(action, data = {}) {
    this.trackEvent('health_data', {
      action,
      heart_rate: data.heart_rate,
      spo2: data.spo2,
      device_id: data.device_id,
      category: 'health_monitoring'
    })
  }

  // Initialize Google Analytics
  initGoogleAnalytics() {
    if (typeof window === 'undefined') return

    // Load Google Analytics script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`
    script.async = true
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', this.config.googleAnalyticsId, {
      send_page_view: false, // We'll handle page views manually
      anonymize_ip: true
    })
  }

  // Initialize Mixpanel
  initMixpanel() {
    if (typeof window === 'undefined') return

    // Load Mixpanel script
    const script = document.createElement('script')
    script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js'
    script.onload = () => {
      window.mixpanel.init(this.config.mixpanelToken, {
        debug: this.config.debug,
        track_pageview: false // We'll handle page views manually
      })
    }
    document.head.appendChild(script)
  }

  // Initialize custom analytics
  initCustomAnalytics() {
    // Set up periodic batch sending
    setInterval(() => {
      this.sendBatch()
    }, 30000) // Send every 30 seconds

    // Send on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.sendBatch(true) // Force send
      })
    }
  }

  // Track custom events
  trackCustomEvent(eventData) {
    if (!this.config.enableCustomAnalytics) return

    this.events.push(eventData)

    // Send immediately for errors
    if (eventData.event_type === 'error') {
      this.sendBatch()
    }
  }

  // Send events in batches
  async sendBatch(force = false) {
    if (this.events.length === 0) return
    if (!force && this.events.length < 10) return // Wait for more events

    const eventsToSend = [...this.events]
    this.events = []

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: eventsToSend,
          session_id: this.sessionId,
          user_id: this.userId
        })
      })

      this.log('Analytics batch sent', { count: eventsToSend.length })
    } catch (error) {
      // Put events back if send failed
      this.events.unshift(...eventsToSend)
      this.log('Failed to send analytics batch', error)
    }
  }

  // Log debug messages
  log(message, data = {}) {
    if (this.config.debug) {
      console.log(`[Analytics] ${message}`, data)
    }
  }

  // Get session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      isInitialized: this.isInitialized,
      queuedEvents: this.events.length
    }
  }
}

// Create global analytics instance
const analytics = new Analytics()

// Auto-initialize if config is available
if (typeof window !== 'undefined') {
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      analytics.init({
        googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
        mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
        debug: process.env.NODE_ENV === 'development'
      })
    })
  } else {
    analytics.init({
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
      mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
      debug: process.env.NODE_ENV === 'development'
    })
  }
}

export default analytics
export { Analytics }