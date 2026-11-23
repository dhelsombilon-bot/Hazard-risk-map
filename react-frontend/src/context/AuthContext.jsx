import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('geopermit_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const data = await authService.login(email, password)
      localStorage.setItem('geopermit_token', data.token)
      localStorage.setItem('geopermit_user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try { await authService.logout() } catch { /* ignore */ }
    localStorage.removeItem('geopermit_token')
    localStorage.removeItem('geopermit_user')
    setUser(null)
  }

  const isAdmin = user?.role_name === 'System Administrator'
  const isPersonnel = user?.role_name === 'MEO Personnel'
  const isManagement = user?.role_name === 'MEO Management'
  const canEdit = isAdmin || isPersonnel

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isPersonnel, isManagement, canEdit }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
