// hooks/useRecords.jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../lib/axiosConfig'
import { useAuth } from '../contexts/AuthContext'
import { apiCache, cacheKeys, withCache } from '../utils/cache'
import { useErrorHandler } from './useErrorHandler'

/**
 * Fetch user health records from backend using Firebase ID token.
 * - Normalizes fields and sorts by timestamp desc
 * - Polls periodically
 */
export function useRecords({ limit = 1000, pollMs = 15000 } = {}) {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const { error, handleError, clearError } = useErrorHandler()
  const hasLoadedOnceRef = useRef(false)
  const lastHashRef = useRef('')

  useEffect(() => {
    if (!user) return

    let cancelled = false
    let interval = null

    const toMs = (ts) => (!ts ? 0 : ts < 1e12 ? ts * 1000 : ts)
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    const computeHash = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return 'empty'
      const newestTs = arr[0]?.ts || 0
      const ids = arr
        .slice(0, 20)
        .map((r) => r.id || `${r.userId}-${r.device_id}-${r.ts}`)
        .join('|')
      return `${newestTs}:${ids}`
    }

    // Cached fetch function
    const fetchRecords = useCallback(
      withCache(
        apiCache,
        () => cacheKeys.userRecords(user.uid, { limit }),
        async () => {
          const resp = await api.get('/api/records/', { params: { limit } })
          return resp.data
        },
        2 * 60 * 1000 // 2 minutes cache for records
      ),
      [user.uid, limit]
    )

    const fetchOnce = async () => {
      try {
        if (!hasLoadedOnceRef.current) setLoading(true)
        clearError()
        
        const data = await fetchRecords()
        if (cancelled) return
        const normalized = (Array.isArray(data) ? data : [])
          .map((r) => ({
            id: r.id,
            userId: r.userId,
            device_id: r.device_id,
            spo2: r.spo2,
            heart_rate: r.heart_rate ?? r.hr,
            ts: r.ts,
          }))
          .sort((a, b) => toMs(b.ts) - toMs(a.ts))
        const newHash = computeHash(normalized)
        if (newHash !== lastHashRef.current) {
          lastHashRef.current = newHash
          setRecords(normalized)
        }
      } catch (err) {
        if (!cancelled) {
          handleError(err, { context: 'useRecords fetchOnce' })
          
          // Clear cache on error to force fresh data on next request
          const cacheKey = cacheKeys.userRecords(user.uid, { limit })
          apiCache.delete(cacheKey)
        }
      } finally {
        if (!cancelled) {
          if (!hasLoadedOnceRef.current) setLoading(false)
          hasLoadedOnceRef.current = true
        }
      }
    }

    fetchOnce()
    interval = setInterval(fetchOnce, pollMs)

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [user, limit, pollMs])

  return { records, loading, error }
}

export default useRecords


