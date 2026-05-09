import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return }
    try {
      const { data, error } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        5000
      )
      if (error || !data) {
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email,
          role: 'client',
        }
        supabase.from('profiles').upsert(newProfile).then() // fire-and-forget
        setProfile(newProfile)
      } else {
        setProfile(data)
      }
    } catch {
      setProfile({ id: authUser.id, email: authUser.email, role: 'client' })
    }
  }

  useEffect(() => {
    // Hard fallback: never stay stuck more than 6s regardless of what Supabase does
    const fallback = setTimeout(() => setLoading(false), 6000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(fallback)
      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      clearTimeout(fallback)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null) // no await — don't block on profile for subsequent events
    })

    return () => { clearTimeout(fallback); subscription.unsubscribe() }
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

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      fullyLoaded: !loading,
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
