// utils/constants.js - Centralized constants
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_VERIFY: '/api/auth/verify',
  AUTH_USER_ROLES: '/api/auth/user-roles',
  AUTH_SET_ADMIN: '/api/auth/set-admin-claim',
  
  // Records endpoints
  RECORDS: '/api/records',
  RECORDS_DEVICE_REGISTER: '/api/records/device/register',
  
  // Command endpoints
  COMMANDS: '/api/command',
  
  // Admin endpoints
  ADMIN_USERS: '/api/admin/users',
  ADMIN_STATS: '/api/admin/stats',
  
  // AI endpoints
  AI_ANALYZE: '/api/ai/analyze',
  AI_INSIGHTS: '/api/ai/insights',
  
  // Profile endpoints
  PROFILE: '/api/profile',
  
  // Schedule endpoints
  SCHEDULE: '/api/schedule'
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  UNAUTHORIZED: 'Bạn không có quyền truy cập.',
  FORBIDDEN: 'Truy cập bị từ chối.',
  NOT_FOUND: 'Không tìm thấy tài nguyên.',
  SERVER_ERROR: 'Lỗi server. Vui lòng thử lại sau.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  RATE_LIMIT_ERROR: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
  TIMEOUT_ERROR: 'Yêu cầu hết thời gian chờ.'
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500
}

export const POLLING_INTERVALS = {
  RECORDS: 15000, // 15 seconds
  USER_STATUS: 30000, // 30 seconds
  HEALTH_CHECK: 60000 // 1 minute
}

export const CHART_COLORS = {
  HEART_RATE: '#e74c3c',
  SPO2: '#3498db',
  SUCCESS: '#2ecc71',
  WARNING: '#f39c12',
  DANGER: '#e74c3c',
  INFO: '#17a2b8'
}

export const HEALTH_THRESHOLDS = {
  HEART_RATE: {
    MIN: 60,
    MAX: 100,
    CRITICAL_LOW: 50,
    CRITICAL_HIGH: 120
  },
  SPO2: {
    MIN: 95,
    CRITICAL_LOW: 90
  }
}

export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
}