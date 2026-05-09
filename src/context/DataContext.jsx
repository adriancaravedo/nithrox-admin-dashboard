import { createContext, useContext, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useStore } from '../stores/useStore'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  const { user, profile, loading } = useAuth()
  const realtimeRef = useRef(null)

  const {
    fetchCRM, fetchProjects, fetchMessages, fetchServers,
    fetchNotifications, fetchForms, fetchDocuments,
    fetchProposals, fetchContracts, fetchPortals, fetchTeam,
    appendRealtimeMessage,
  } = useStore()

  // Boot all data once the user is confirmed admin
  useEffect(() => {
    if (loading || !user || profile?.role !== 'admin') return

    Promise.all([
      fetchCRM(),
      fetchProjects(),
      fetchMessages(),
      fetchServers(),
      fetchNotifications(user.id),
      fetchForms(),
      fetchDocuments(),
      fetchProposals(),
      fetchContracts(),
      fetchPortals(),
      fetchTeam(),
    ])
  }, [loading, user?.id, profile?.role])

  // Realtime: subscribe to new messages (admin side)
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return

    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new
          // Only append if it came from a client (admin sent it optimistically already)
          if (msg.from_role === 'client') {
            appendRealtimeMessage(msg.conversation_id, msg)
          }
        }
      )
      .subscribe()

    realtimeRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, profile?.role])

  return (
    <DataContext.Provider value={null}>
      {children}
    </DataContext.Provider>
  )
}
