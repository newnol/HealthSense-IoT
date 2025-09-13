import axios from 'axios'
import { auth } from './firebase'
import { logError, retryOperation } from '../utils/errorHandler'
import { API_ENDPOINTS } from '../utils/constants'

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com' 
    : 'http://localhost:8001',
  timeout: 30000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  async (config) => {
    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() }
    
    // Add auth token
    const user = auth.currentUser
    if (user) {
      try {
        const token = await user.getIdToken()
        config.headers.Authorization = `Bearer ${token}`
      } catch (error) {
        logError(error, { context: 'Token refresh failed' })
        // Don't block the request, let it fail naturally
      }
    }
    
    return config
  },
  (error) => {
    logError(error, { context: 'Request interceptor error' })
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      const duration = new Date() - response.config.metadata.startTime
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Log error with context
    logError(error, {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: originalRequest?.data
    })

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Try to refresh the token
        const user = auth.currentUser
        if (user) {
          const token = await user.getIdToken(true) // Force refresh
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Token refresh failed, redirect to login
        logError(refreshError, { context: 'Token refresh failed' })
        auth.signOut()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle 429 - Rate Limited (retry after delay)
    if (error.response?.status === 429 && !originalRequest._retryCount) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
      
      if (originalRequest._retryCount <= 3) {
        const delay = Math.pow(2, originalRequest._retryCount) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        return api(originalRequest)
      }
    }

    // Handle network errors with retry
    if (!error.response && !originalRequest._networkRetry) {
      originalRequest._networkRetry = true
      
      try {
        return await retryOperation(() => api(originalRequest), 2, 1000)
      } catch (retryError) {
        return Promise.reject(retryError)
      }
    }

    return Promise.reject(error)
  }
)

// Helper functions for common API calls
export const apiHelpers = {
  // Auth helpers
  verifyToken: () => api.get(API_ENDPOINTS.AUTH_VERIFY),
  getUserRoles: (params = {}) => api.get(API_ENDPOINTS.AUTH_USER_ROLES, { params }),
  
  // Records helpers
  getRecords: (params = {}) => api.get(API_ENDPOINTS.RECORDS, { params }),
  submitRecord: (data) => api.post(API_ENDPOINTS.RECORDS, data),
  
  // Commands helpers
  getCommands: (deviceId) => api.get(`${API_ENDPOINTS.COMMANDS}/${deviceId}`),
  sendCommand: (data) => api.post(API_ENDPOINTS.COMMANDS, data),
  
  // AI helpers
  analyzeHealth: (data) => api.post(API_ENDPOINTS.AI_ANALYZE, data),
  getInsights: (params = {}) => api.get(API_ENDPOINTS.AI_INSIGHTS, { params }),
}

export default api