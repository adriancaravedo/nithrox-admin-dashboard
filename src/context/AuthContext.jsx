import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const autoLinkContact = async (email, profileId) => {
    if (!email) return null
    try {
      const { data: contact } = await db.contacts.findByEmail(email)
      if (contact?.id) {
        await supabase.from('profiles').update({ contact_id: contact.id }).eq('id', profileId)
        return contact.id
      }
    } catch { /* non-fatal */ }
    return null
  }

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return }

    // maybeSingle() returns {data: null, error: null} when 0 rows — no exception
    // single() throws on 0 rows, causing the old code to treat admin as 'client'
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (data) {
      // Profile found in DB — use it exactly as-is
      if (data.role === 'client' && !data.contact_id) {
        const linked = await autoLinkContact(data.email, data.id)
        if (linked) { setProfile({ ...data, contact_id: linked }); return }
      }
      setProfile(data)
      return
    }

    if (error) {
      // DB error (RLS blocking, network, etc.) — do NOT default to 'client'
      // The profile EXISTS in the DB but we can't read it right now.
      // Use app_metadata role if Supabase has synced it, otherwise stay unknown.
      console.warn('[AuthContext] Could not read profile:', error.message)
      const appRole = authUser.app_metadata?.role || null
      setProfile({
        id:    authUser.id,
        email: authUser.email,
        name:  authUser.user_metadata?.name || authUser.email,
        role:  appRole || '_loading',   // never 'client' on error
      })
      return
    }

    // data === null, error === null → genuinely new user with no profile row yet
    const newProfile = {
      id:    authUser.id,
      email: authUser.email,
      name:  authUser.user_metadata?.name || authUser.email,
      role:  'client',
    }
    supabase.from('profiles').upsert(newProfile).then()
    setProfile(newProfile)
    autoLinkContact(authUser.email, authUser.id)
  }

  useEffect(() => {
    const fallback = setTimeout(() => setLoading(false), 8000)

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
      loadProfile(session?.user ?? null)
    })

    return () => { clearTimeout(fallback); subscription.unsubscribe() }
  }, [])

  // Realtime: watch own profile row for live role/contact_id updates
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`profile-watch-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        setProfile(prev => prev ? { ...prev, ...payload.new } : payload.new)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

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
