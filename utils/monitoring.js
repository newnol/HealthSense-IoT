// utils/monitoring.js - Application monitoring and health checks
class ApplicationMonitor {
  constructor() {
    this.metrics = {
      pageLoads: 0,
      apiCalls: 0,
      errors: 0,
      performanceEntries: []
    }
    this.healthChecks = new Map()
    this.isMonitoring = false
  }

  // Start monitoring
  start() {
    if (typeof window === 'undefined' || this.isMonitoring) return

    this.isMonitoring = true
    this.setupPerformanceMonitoring()
    this.setupErrorMonitoring()
    this.setupNetworkMonitoring()
    this.setupHealthChecks()
    
    console.log('Application monitoring started')
  }

  // Stop monitoring
  stop() {
    this.isMonitoring = false
    console.log('Application monitoring stopped')
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.collectPageLoadMetrics()
      }, 0)
    })

    // Monitor navigation performance
    if ('PerformanceObserver' in window) {
      // Observe navigation entries
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceEntry('navigation', entry)
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })

      // Observe paint entries
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceEntry('paint', entry)
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceEntry('lcp', entry)
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // Observe cumulative layout shift
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.recordPerformanceEntry('cls', entry)
          }
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        this.recordMemoryUsage()
      }, 60000) // Every minute
    }
  }

  // Setup error monitoring
  setupErrorMonitoring() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // React error boundary integration
    window.__HEALTH_MONITOR_ERROR_BOUNDARY__ = (error, errorInfo) => {
      this.recordError({
        type: 'react_error_boundary',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Setup network monitoring
  setupNetworkMonitoring() {
    // Monitor fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = args[0]
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        
        this.recordNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          success: response.ok,
          timestamp: new Date().toISOString()
        })
        
        return response
      } catch (error) {
        const endTime = performance.now()
        
        this.recordNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          status: 0,
          duration: endTime - startTime,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        })
        
        throw error
      }
    }
  }

  // Setup health checks
  setupHealthChecks() {
    // API health check
    this.addHealthCheck('api', async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          timeout: 5000 
        })
        return {
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: response.headers.get('x-response-time'),
          details: response.ok ? null : await response.text()
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        }
      }
    })

    // Firebase connection check
    this.addHealthCheck('firebase', async () => {
      try {
        // This would check Firebase connection
        // Implementation depends on your Firebase setup
        return { status: 'healthy' }
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        }
      }
    })

    // Run health checks every 5 minutes
    setInterval(() => {
      this.runHealthChecks()
    }, 5 * 60 * 1000)

    // Initial health check
    setTimeout(() => {
      this.runHealthChecks()
    }, 10000) // 10 seconds after start
  }

  // Add a health check
  addHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction)
  }

  // Run all health checks
  async runHealthChecks() {
    const results = {}
    
    for (const [name, checkFn] of this.healthChecks) {
      try {
        results[name] = await checkFn()
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message
        }
      }
    }
    
    this.recordHealthCheckResults(results)
    return results
  }

  // Collect page load metrics
  collectPageLoadMetrics() {
    if (!('performance' in window)) return

    const navigation = performance.getEntriesByType('navigation')[0]
    if (!navigation) return

    const metrics = {
      type: 'page_load',
      url: window.location.href,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstByte: navigation.responseStart - navigation.requestStart,
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnect: navigation.connectEnd - navigation.connectStart,
      timestamp: new Date().toISOString()
    }

    this.recordPerformanceEntry('page_load', metrics)
    this.metrics.pageLoads++
  }

  // Record performance entry
  recordPerformanceEntry(type, entry) {
    const perfEntry = {
      type,
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: new Date().toISOString(),
      ...entry
    }

    this.metrics.performanceEntries.push(perfEntry)
    
    // Keep only last 100 entries
    if (this.metrics.performanceEntries.length > 100) {
      this.metrics.performanceEntries = this.metrics.performanceEntries.slice(-100)
    }

    // Send critical performance issues immediately
    if (type === 'lcp' && entry.startTime > 4000) { // LCP > 4s
      this.sendAlert('performance', 'High LCP detected', perfEntry)
    }
  }

  // Record memory usage
  recordMemoryUsage() {
    if (!('memory' in performance)) return

    const memory = performance.memory
    const memoryInfo = {
      type: 'memory',
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: new Date().toISOString()
    }

    this.recordPerformanceEntry('memory', memoryInfo)

    // Alert on high memory usage
    const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit
    if (usagePercent > 0.8) { // 80% memory usage
      this.sendAlert('memory', 'High memory usage detected', memoryInfo)
    }
  }

  // Record error
  recordError(error) {
    this.metrics.errors++
    
    // Send to monitoring service
    this.sendToMonitoringService('error', error)
    
    console.error('[Monitor] Error recorded:', error)
  }

  // Record network request
  recordNetworkRequest(request) {
    this.metrics.apiCalls++
    
    // Alert on slow API calls
    if (request.duration > 10000) { // > 10 seconds
      this.sendAlert('network', 'Slow API call detected', request)
    }
    
    // Alert on API errors
    if (!request.success && request.status >= 500) {
      this.sendAlert('network', 'API server error detected', request)
    }
  }

  // Record health check results
  recordHealthCheckResults(results) {
    const healthData = {
      type: 'health_check',
      results,
      timestamp: new Date().toISOString()
    }

    this.sendToMonitoringService('health', healthData)

    // Alert on unhealthy services
    for (const [service, result] of Object.entries(results)) {
      if (result.status !== 'healthy') {
        this.sendAlert('health', `Service ${service} is unhealthy`, result)
      }
    }
  }

  // Send alert
  sendAlert(category, message, data) {
    const alert = {
      category,
      message,
      data,
      severity: this.getAlertSeverity(category, data),
      timestamp: new Date().toISOString()
    }

    this.sendToMonitoringService('alert', alert)
    console.warn('[Monitor] Alert:', alert)
  }

  // Get alert severity
  getAlertSeverity(category, data) {
    switch (category) {
      case 'performance':
        if (data.startTime > 10000) return 'critical'
        if (data.startTime > 4000) return 'warning'
        return 'info'
      case 'memory':
        const usagePercent = data.usedJSHeapSize / data.jsHeapSizeLimit
        if (usagePercent > 0.9) return 'critical'
        if (usagePercent > 0.8) return 'warning'
        return 'info'
      case 'network':
        if (data.status >= 500) return 'critical'
        if (data.duration > 10000) return 'warning'
        return 'info'
      case 'health':
        return data.status === 'error' ? 'critical' : 'warning'
      default:
        return 'info'
    }
  }

  // Send to monitoring service
  async sendToMonitoringService(type, data) {
    try {
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send monitoring data:', error)
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    }
  }

  // Get health status
  async getHealthStatus() {
    const healthResults = await this.runHealthChecks()
    const metrics = this.getMetrics()
    
    return {
      status: Object.values(healthResults).every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
      checks: healthResults,
      metrics,
      timestamp: new Date().toISOString()
    }
  }
}

// Create global monitor instance
const monitor = new ApplicationMonitor()

// Auto-start monitoring
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      monitor.start()
    })
  } else {
    monitor.start()
  }
}

export default monitor
export { ApplicationMonitor }