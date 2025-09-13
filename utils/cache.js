// utils/cache.js - Client-side caching utilities
class SimpleCache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map()
    this.defaultTTL = defaultTTL
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl
    this.cache.set(key, { value, expiresAt })
  }

  get(key) {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  has(key) {
    return this.get(key) !== null
  }

  delete(key) {
    return this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // Clean up expired items
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Create cache instances for different data types
export const apiCache = new SimpleCache(5 * 60 * 1000) // 5 minutes for API responses
export const userCache = new SimpleCache(15 * 60 * 1000) // 15 minutes for user data
export const staticCache = new SimpleCache(60 * 60 * 1000) // 1 hour for static data

// Cache key generators
export const cacheKeys = {
  userRecords: (userId, params) => `records_${userId}_${JSON.stringify(params)}`,
  userProfile: (userId) => `profile_${userId}`,
  deviceCommands: (deviceId) => `commands_${deviceId}`,
  healthInsights: (userId, dateRange) => `insights_${userId}_${dateRange}`,
  adminStats: () => 'admin_stats',
  userRoles: (params) => `user_roles_${JSON.stringify(params)}`
}

// Cached API wrapper
export const withCache = (cache, key, fetcher, ttl) => {
  return async (...args) => {
    const cacheKey = typeof key === 'function' ? key(...args) : key
    
    // Try to get from cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    // Fetch fresh data
    const data = await fetcher(...args)
    
    // Store in cache
    cache.set(cacheKey, data, ttl)
    
    return data
  }
}

// Cleanup expired cache entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
    userCache.cleanup()
    staticCache.cleanup()
  }, 10 * 60 * 1000) // Cleanup every 10 minutes
}

export default { apiCache, userCache, staticCache, cacheKeys, withCache }