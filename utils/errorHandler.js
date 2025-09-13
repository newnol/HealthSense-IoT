// utils/errorHandler.js - Global error handling utilities
import { ERROR_MESSAGES, HTTP_STATUS } from './constants'

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.isOperational = isOperational
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export const getErrorMessage = (error) => {
  // Handle different error types
  if (error?.response?.status) {
    const status = error.response.status
    
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return error.response.data?.detail || ERROR_MESSAGES.VALIDATION_ERROR
      case HTTP_STATUS.UNAUTHORIZED:
        return ERROR_MESSAGES.UNAUTHORIZED
      case HTTP_STATUS.FORBIDDEN:
        return ERROR_MESSAGES.FORBIDDEN
      case HTTP_STATUS.NOT_FOUND:
        return ERROR_MESSAGES.NOT_FOUND
      case HTTP_STATUS.RATE_LIMITED:
        return ERROR_MESSAGES.RATE_LIMIT_ERROR
      case HTTP_STATUS.SERVER_ERROR:
        return ERROR_MESSAGES.SERVER_ERROR
      default:
        return error.response.data?.detail || ERROR_MESSAGES.SERVER_ERROR
    }
  }
  
  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message === 'Network Error') {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  
  // Handle timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR
  }
  
  // Handle Firebase errors
  if (error?.code?.startsWith('auth/')) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'Không tìm thấy người dùng'
      case 'auth/wrong-password':
        return 'Mật khẩu không đúng'
      case 'auth/email-already-in-use':
        return 'Email đã được sử dụng'
      case 'auth/weak-password':
        return 'Mật khẩu quá yếu'
      case 'auth/invalid-email':
        return 'Email không hợp lệ'
      case 'auth/too-many-requests':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau'
      default:
        return error.message || ERROR_MESSAGES.SERVER_ERROR
    }
  }
  
  // Default error message
  return error?.message || ERROR_MESSAGES.SERVER_ERROR
}

export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  }
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo)
  }
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Here you would send to services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { contexts: { errorInfo } })
    
    // For now, just log to console in production too
    console.error('Production error:', errorInfo)
  }
  
  return errorInfo
}

export const handleAsyncError = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      logError(error, { function: asyncFn.name, args })
      throw error
    }
  }
}

export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on client errors (4xx)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError
}