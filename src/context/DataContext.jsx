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
    fetchOrders,
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
      fetchOrders(),
    ])
  }, [loading, user?.id, profile?.role])

  // Realtime: subscribe to new messages + new conversations (admin side)
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return

    const channel = supabase
      .channel('realtime-admin')
      // New message from a client
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new
          if (msg.from_role !== 'client') return
          const found = useStore.getState().messages.find(m => m.id === msg.conversation_id)
          if (found) {
            appendRealtimeMessage(msg.conversation_id, msg)
          } else {
            // Conversation not in store yet — fetch it and add
            const { db } = await import('../lib/db')
            const { data } = await db.conversations.get(msg.conversation_id)
            if (data) useStore.getState().addOrRefreshConversation(data)
          }
        }
      )
      // New conversation created by a client
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        async (payload) => {
          const conv = payload.new
          if (!conv?.id) return
          // Short delay to let messages insert first
          setTimeout(async () => {
            const { db } = await import('../lib/db')
            const { data } = await db.conversations.get(conv.id)
            if (data) useStore.getState().addOrRefreshConversation(data)
          }, 500)
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
