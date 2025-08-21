// contexts/AdminContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import axios from 'axios'

const AdminContext = createContext({})

export const useAdmin = () => useContext(AdminContext)

export const AdminProvider = ({ children }) => {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [devices, setDevices] = useState([])
  const [stats, setStats] = useState(null)

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const token = await user.getIdToken()
          const response = await axios.get('/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          })
          setIsAdmin(response.data.admin || false)
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    }

    checkAdminStatus()
  }, [user])

  // Get auth headers
  const getAuthHeaders = async () => {
    if (!user) throw new Error('No user logged in')
    const token = await user.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }

  // Fetch all users
  const fetchUsers = async (pageToken = null, adminOnly = false) => {
    try {
      const headers = await getAuthHeaders()
      const params = {}
      if (pageToken) params.page_token = pageToken
      if (adminOnly) params.admin_only = true
      
      const response = await axios.get('/api/admin/users', { headers, params })
      setUsers(response.data.users)
      return response.data
    } catch (error) {
      console.error('Error fetching users:', error)
      if (error.response?.status === 403) {
        console.error('Admin access required')
        setIsAdmin(false)
      }
      throw error
    }
  }

  // Update user
  const updateUser = async (userId, updates) => {
    try {
      const headers = await getAuthHeaders()
      await axios.put(`/api/admin/users/${userId}`, updates, { headers })
      await fetchUsers() // Refresh users list
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Delete user
  const deleteUser = async (userId) => {
    try {
      const headers = await getAuthHeaders()
      await axios.delete(`/api/admin/users/${userId}`, { headers })
      await fetchUsers() // Refresh users list
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Fetch all devices
  const fetchDevices = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get('/api/admin/devices', { headers })
      setDevices(response.data.devices)
      return response.data
    } catch (error) {
      console.error('Error fetching devices:', error)
      if (error.response?.status === 403) {
        console.error('Admin access required')
        setIsAdmin(false)
      }
      throw error
    }
  }

  // Delete device
  const deleteDevice = async (deviceId) => {
    try {
      const headers = await getAuthHeaders()
      await axios.delete(`/api/admin/devices/${deviceId}`, { headers })
      await fetchDevices() // Refresh devices list
    } catch (error) {
      console.error('Error deleting device:', error)
      throw error
    }
  }

  // Get user devices
  const getUserDevices = async (userId) => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`/api/admin/users/${userId}/devices`, { headers })
      return response.data
    } catch (error) {
      console.error('Error fetching user devices:', error)
      throw error
    }
  }

  // Set admin claim for a user
  const setAdminClaim = async (userId, isAdmin) => {
    try {
      const headers = await getAuthHeaders()
      await axios.post('/api/auth/set-admin-claim', { uid: userId, admin: isAdmin }, { headers })
      await fetchUsers() // Refresh users list
    } catch (error) {
      console.error('Error setting admin claim:', error)
      throw error
    }
  }

  // Set admin claim for a user by email
  const setAdminClaimByEmail = async (email, isAdmin) => {
    try {
      const headers = await getAuthHeaders()
      await axios.post('/api/auth/set-admin-claim-by-email', { email, admin: isAdmin }, { headers })
      await fetchUsers() // Refresh users list
    } catch (error) {
      console.error('Error setting admin claim by email:', error)
      throw error
    }
  }

  // Fetch system stats
  const fetchStats = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get('/api/admin/stats', { headers })
      setStats(response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching stats:', error)
      if (error.response?.status === 403) {
        console.error('Admin access required')
        setIsAdmin(false)
      }
      throw error
    }
  }

  // Get user by email
  const getUserByEmail = async (email) => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`/api/auth/user/${encodeURIComponent(email)}`, { headers })
      return response.data
    } catch (error) {
      console.error('Error fetching user by email:', error)
      throw error
    }
  }

  // Get user profile (from admin.py)
  const getUserProfile = async (userId) => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`/api/admin/users/${userId}/profile`, { headers })
      return response.data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  const value = {
    isAdmin,
    loading,
    users,
    devices,
    stats,
    fetchUsers,
    updateUser,
    deleteUser,
    fetchDevices,
    deleteDevice,
    getUserDevices,
    setAdminClaim,
    setAdminClaimByEmail,
    fetchStats,
    getUserByEmail,
    getUserProfile
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}