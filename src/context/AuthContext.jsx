import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)  // auth loading
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return }
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !data) {
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email,
          role: 'client',
        }
        await supabase.from('profiles').upsert(newProfile)
        setProfile(newProfile)
      } else {
        setProfile(data)
      }
    } catch {
      setProfile({ id: authUser.id, email: authUser.email, role: 'client' })
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    // Fallback: never stay stuck more than 8s
    const timeout = setTimeout(() => setLoading(false), 8000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION is already handled by getSession above — skip to avoid double-load
      if (event === 'INITIAL_SESSION') return
      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)
    })

    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // fullyLoaded = both auth AND profile are resolved
  const fullyLoaded = !loading && !profileLoading

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      profileLoading, fullyLoaded,
      isAdmin: profile?.role === 'admin',
      isClient: profile?.role === 'client',
      role: profile?.role,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
