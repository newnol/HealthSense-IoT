// utils/validation.js - Frontend validation utilities
import { HEALTH_THRESHOLDS } from './constants'

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation
export const validatePassword = (password) => {
  const errors = []
  
  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ hoa')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 số')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Health data validation
export const validateHeartRate = (heartRate) => {
  const hr = Number(heartRate)
  
  if (isNaN(hr)) {
    return { isValid: false, error: 'Nhịp tim phải là số' }
  }
  
  if (hr < 30 || hr > 300) {
    return { isValid: false, error: 'Nhịp tim phải từ 30-300 BPM' }
  }
  
  return { isValid: true }
}

export const validateSpO2 = (spo2) => {
  const sp = Number(spo2)
  
  if (isNaN(sp)) {
    return { isValid: false, error: 'SpO2 phải là số' }
  }
  
  if (sp < 70 || sp > 100) {
    return { isValid: false, error: 'SpO2 phải từ 70-100%' }
  }
  
  return { isValid: true }
}

export const validateHealthRecord = (record) => {
  const errors = []
  
  const hrValidation = validateHeartRate(record.heart_rate)
  if (!hrValidation.isValid) {
    errors.push(hrValidation.error)
  }
  
  const spo2Validation = validateSpO2(record.spo2)
  if (!spo2Validation.isValid) {
    errors.push(spo2Validation.error)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Device ID validation
export const validateDeviceId = (deviceId) => {
  if (!deviceId || typeof deviceId !== 'string') {
    return { isValid: false, error: 'Device ID không hợp lệ' }
  }
  
  if (deviceId.length < 3 || deviceId.length > 50) {
    return { isValid: false, error: 'Device ID phải từ 3-50 ký tự' }
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(deviceId)) {
    return { isValid: false, error: 'Device ID chỉ được chứa chữ, số, _ và -' }
  }
  
  return { isValid: true }
}

// Date range validation
export const validateDateRange = (startDate, endDate) => {
  const errors = []
  
  if (startDate && !isValidDate(startDate)) {
    errors.push('Ngày bắt đầu không hợp lệ')
  }
  
  if (endDate && !isValidDate(endDate)) {
    errors.push('Ngày kết thúc không hợp lệ')
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      errors.push('Ngày bắt đầu không thể sau ngày kết thúc')
    }
    
    // Check if date range is too large (more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000
    if (end - start > oneYear) {
      errors.push('Khoảng thời gian không được vượt quá 1 năm')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const isValidDate = (dateString) => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

// Form validation helpers
export const validateForm = (data, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field]
    const value = data[field]
    
    // Required field validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.requiredMessage || `${field} là bắt buộc`
      return
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !rule.required) {
      return
    }
    
    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = rule.minLengthMessage || `${field} phải có ít nhất ${rule.minLength} ký tự`
      return
    }
    
    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = rule.maxLengthMessage || `${field} không được vượt quá ${rule.maxLength} ký tự`
      return
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${field} không đúng định dạng`
      return
    }
    
    // Custom validation
    if (rule.validator) {
      const result = rule.validator(value)
      if (!result.isValid) {
        errors[field] = result.error
        return
      }
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Health status classification
export const getHealthStatus = (heartRate, spo2) => {
  const hr = Number(heartRate)
  const sp = Number(spo2)
  
  if (isNaN(hr) || isNaN(sp)) {
    return { status: 'unknown', message: 'Dữ liệu không hợp lệ' }
  }
  
  // Critical conditions
  if (hr < HEALTH_THRESHOLDS.HEART_RATE.CRITICAL_LOW || 
      hr > HEALTH_THRESHOLDS.HEART_RATE.CRITICAL_HIGH ||
      sp < HEALTH_THRESHOLDS.SPO2.CRITICAL_LOW) {
    return { 
      status: 'critical', 
      message: 'Cần chú ý ngay lập tức',
      color: '#dc3545' 
    }
  }
  
  // Warning conditions
  if (hr < HEALTH_THRESHOLDS.HEART_RATE.MIN || 
      hr > HEALTH_THRESHOLDS.HEART_RATE.MAX ||
      sp < HEALTH_THRESHOLDS.SPO2.MIN) {
    return { 
      status: 'warning', 
      message: 'Cần theo dõi',
      color: '#ffc107' 
    }
  }
  
  // Normal condition
  return { 
    status: 'normal', 
    message: 'Bình thường',
    color: '#28a745' 
  }
}

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

export default {
  isValidEmail,
  validatePassword,
  validateHeartRate,
  validateSpO2,
  validateHealthRecord,
  validateDeviceId,
  validateDateRange,
  validateForm,
  getHealthStatus,
  sanitizeInput
}