// hooks/useRecords.jsx
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch user health records from backend using Firebase ID token.
 * - Normalizes fields and sorts by timestamp desc
 * - Polls periodically
 */
export function useRecords({ limit = 1000, pollMs = 15000 } = {}) {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

    const fetchOnce = async () => {
      try {
        if (!hasLoadedOnceRef.current) setLoading(true)
        setError(null)
        const token = await user.getIdToken()
        const resp = await axios.get('/api/records/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit },
        })
        if (cancelled) return
        const normalized = (Array.isArray(resp.data) ? resp.data : [])
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
        // Retry once for minor clock skew
        const detail = err?.response?.data?.detail || ''
        const status = err?.response?.status || 0
        const tooEarly = typeof detail === 'string' && detail.toLowerCase().includes('too early')
        if (!cancelled && status === 401 && tooEarly) {
          try {
            await delay(3000)
            const token2 = await user.getIdToken()
            const resp2 = await axios.get('/api/records/', {
              headers: { Authorization: `Bearer ${token2}` },
              params: { limit },
            })
            if (cancelled) return
            const normalized2 = (Array.isArray(resp2.data) ? resp2.data : [])
              .map((r) => ({ id: r.id, userId: r.userId, device_id: r.device_id, spo2: r.spo2, heart_rate: r.heart_rate ?? r.hr, ts: r.ts }))
              .sort((a, b) => toMs(b.ts) - toMs(a.ts))
            const newHash2 = computeHash(normalized2)
            if (newHash2 !== lastHashRef.current) {
              lastHashRef.current = newHash2
              setRecords(normalized2)
            }
          } catch (e2) {
            if (!cancelled) setError(e2)
          }
        } else {
          if (!cancelled) setError(err)
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


