import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

export function usePortalData(contactId) {
  const [project, setProject] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [contracts, setContracts] = useState([])
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const realtimeRef = useRef(null)

  useEffect(() => {
    if (!contactId) return

    const load = async () => {
      setLoading(true)
      const [
        { data: proj },
        { data: conv },
        { data: ctr },
        { data: prop },
      ] = await Promise.all([
        db.projects.forClient(contactId),
        db.conversations.forClient(contactId),
        db.contracts.forClient(contactId),
        db.proposals.forClient(contactId),
      ])
      setProject(proj || null)
      setConversation(conv || null)
      setContracts(ctr || [])
      setProposals(prop || [])
      setLoading(false)
    }

    load()
  }, [contactId])

  // Realtime: listen for new messages in client's conversation
  useEffect(() => {
    if (!conversation?.id) return

    const channel = supabase
      .channel(`portal-messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const msg = payload.new
          // Only append admin messages (client sent ones are added optimistically)
          if (msg.from_role === 'admin') {
            setConversation(prev => ({
              ...prev,
              messages: [
                ...(prev.messages || []),
                { id: msg.id, from_role: msg.from_role, text: msg.text, created_at: msg.created_at },
              ],
            }))
          }
        }
      )
      .subscribe()

    realtimeRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [conversation?.id])

  const sendMessage = async (text, userId) => {
    if (!conversation?.id || !text.trim()) return
    const { data: msg } = await db.messages.send({
      conversation_id: conversation.id,
      sender_id: userId,
      from_role: 'client',
      text: text.trim(),
    })
    if (msg) {
      // Optimistic update
      setConversation(prev => ({
        ...prev,
        messages: [...(prev.messages || []), { id: msg.id, from_role: 'client', text: text.trim(), created_at: msg.created_at }],
      }))
      await db.conversations.updateLastMessage(conversation.id, text.trim())
    }
    return msg
  }

  return { project, conversation, contracts, proposals, loading, sendMessage }
}
