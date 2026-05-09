import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES } from '../lib/utils'
import { DEMO_TEAM } from '../lib/demo-data'

const AuthContext = createContext(null)

// Demo mode: always logged in as admin
const DEMO_USER = DEMO_TEAM[0]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER)
  const [loading, setLoading] = useState(false)

  const role = user?.role || 'admin'
  const allowedPages = ROLES[role]?.pages || []

  const canAccess = (page) => {
    if (!user) return false
    if (role === 'admin' || allowedPages.includes('*')) return true
    return allowedPages.includes(page)
  }

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, canAccess, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
