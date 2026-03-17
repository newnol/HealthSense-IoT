// utils/formatters.js - Data formatting utilities
import { format, formatDistance, formatRelative, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'

// Date/Time formatters
export const formatDate = (date, formatString = 'dd/MM/yyyy') => {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (!isValid(dateObj)) return 'Ngày không hợp lệ'
  
  return format(dateObj, formatString, { locale: vi })
}

export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export const formatTime = (date) => {
  return formatDate(date, 'HH:mm')
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (!isValid(dateObj)) return 'Thời gian không hợp lệ'
  
  return formatRelative(dateObj, new Date(), { locale: vi })
}

export const formatTimeDistance = (date) => {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (!isValid(dateObj)) return 'Thời gian không hợp lệ'
  
  return formatDistance(dateObj, new Date(), { 
    addSuffix: true, 
    locale: vi 
  })
}

// Number formatters
export const formatNumber = (number, decimals = 0) => {
  if (number == null || isNaN(number)) return '0'
  
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number)
}

export const formatPercent = (number, decimals = 1) => {
  if (number == null || isNaN(number)) return '0%'
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number / 100)
}

// Health data formatters
export const formatHeartRate = (heartRate) => {
  if (heartRate == null || isNaN(heartRate)) return '--'
  return `${Math.round(heartRate)} BPM`
}

export const formatSpO2 = (spo2) => {
  if (spo2 == null || isNaN(spo2)) return '--'
  return `${Number(spo2).toFixed(1)}%`
}

export const formatHealthValue = (value, unit = '') => {
  if (value == null || isNaN(value)) return '--'
  return `${Number(value).toFixed(1)}${unit}`
}

// File size formatter
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Duration formatter
export const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) return '0s'
  
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days} ngày ${hours % 24} giờ`
  } else if (hours > 0) {
    return `${hours} giờ ${minutes % 60} phút`
  } else if (minutes > 0) {
    return `${minutes} phút ${seconds % 60} giây`
  } else {
    return `${seconds} giây`
  }
}

// Text formatters
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const capitalizeFirst = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const formatUsername = (email) => {
  if (!email) return 'Người dùng'
  return email.split('@')[0]
}

// Status formatters
export const formatUserStatus = (user) => {
  if (user.disabled) return 'Bị khóa'
  if (!user.emailVerified) return 'Chưa xác thực'
  if (user.admin) return 'Quản trị viên'
  return 'Hoạt động'
}

export const formatDeviceStatus = (status) => {
  const statusMap = {
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    error: 'Lỗi',
    offline: 'Ngoại tuyến',
    online: 'Trực tuyến'
  }
  
  return statusMap[status] || status
}

// Health insights formatter
export const formatInsightSeverity = (severity) => {
  const severityMap = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    critical: 'Nghiêm trọng'
  }
  
  return severityMap[severity] || severity
}

export const formatInsightType = (type) => {
  const typeMap = {
    trend: 'Xu hướng',
    anomaly: 'Bất thường',
    recommendation: 'Khuyến nghị',
    alert: 'Cảnh báo'
  }
  
  return typeMap[type] || type
}

// Chart data formatters
export const formatChartData = (records, field) => {
  if (!Array.isArray(records)) return []
  
  return records.map(record => ({
    x: new Date(record.ts < 1e12 ? record.ts * 1000 : record.ts),
    y: Number(record[field]) || 0
  })).filter(point => !isNaN(point.y))
}

export const formatChartLabels = (records) => {
  if (!Array.isArray(records)) return []
  
  return records.map(record => 
    formatDateTime(new Date(record.ts < 1e12 ? record.ts * 1000 : record.ts))
  )
}

// API response formatters
export const formatApiError = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error.message) {
    return error.message
  }
  
  return 'Có lỗi xảy ra'
}

// URL formatters
export const formatApiUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint, window.location.origin)
  
  Object.keys(params).forEach(key => {
    if (params[key] != null) {
      url.searchParams.append(key, params[key])
    }
  })
  
  return url.toString()
}

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatTimeDistance,
  formatNumber,
  formatPercent,
  formatHeartRate,
  formatSpO2,
  formatHealthValue,
  formatFileSize,
  formatDuration,
  truncateText,
  capitalizeFirst,
  formatUsername,
  formatUserStatus,
  formatDeviceStatus,
  formatInsightSeverity,
  formatInsightType,
  formatChartData,
  formatChartLabels,
  formatApiError,
  formatApiUrl
}