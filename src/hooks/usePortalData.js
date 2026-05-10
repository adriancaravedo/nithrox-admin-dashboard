import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

export function usePortalData(contactId) {
  const [project, setProject] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [contracts, setContracts] = useState([])
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminTyping, setAdminTyping] = useState(false)

  const typingChannelRef = useRef(null)
  const typingTimerRef = useRef(null)
  const convRef = useRef(null)

  useEffect(() => { convRef.current = conversation }, [conversation])

  useEffect(() => {
    if (!contactId) return
    const load = async () => {
      setLoading(true)
      const [{ data: proj }, { data: conv }, { data: ctr }, { data: prop }] = await Promise.all([
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

  // Realtime: message inserts + read-receipt updates
  useEffect(() => {
    if (!conversation?.id) return

    const msgChannel = supabase
      .channel(`portal-msgs-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        const msg = payload.new
        if (msg.from_role === 'admin') {
          setConversation(prev => ({
            ...prev,
            messages: [...(prev.messages || []), msg],
          }))
          // Mark admin messages as read since client is viewing
          db.messages.markAdminRead(conversation.id)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        const msg = payload.new
        setConversation(prev => ({
          ...prev,
          messages: (prev.messages || []).map(m =>
            m.id === msg.id ? { ...m, deleted_at: msg.deleted_at, read_at: msg.read_at } : m
          ),
        }))
      })
      .subscribe()

    // Typing channel
    const typingChannel = supabase
      .channel(`conv-typing-${conversation.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.role === 'admin') {
          setAdminTyping(true)
          clearTimeout(typingTimerRef.current)
          typingTimerRef.current = setTimeout(() => setAdminTyping(false), 2500)
        }
      })
      .subscribe()

    typingChannelRef.current = typingChannel

    // Mark admin messages as read when portal loads
    db.messages.markAdminRead(conversation.id)

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(typingChannel)
      clearTimeout(typingTimerRef.current)
    }
  }, [conversation?.id])

  const broadcastTyping = useCallback(() => {
    typingChannelRef.current?.send({
      type: 'broadcast', event: 'typing', payload: { role: 'client' },
    })
  }, [])

  const sendMessage = async (text, userId, extra = {}) => {
    if (!conversation?.id || !text.trim()) return
    const { data: msg } = await db.messages.send({
      conversation_id: conversation.id,
      sender_id: userId,
      from_role: 'client',
      text: text.trim(),
      ...extra,
    })
    if (msg) {
      setConversation(prev => ({
        ...prev,
        messages: [...(prev.messages || []), msg],
      }))
      await db.conversations.updateLastMessage(conversation.id, text.trim())
    }
    return msg
  }

  const uploadAndSend = async (file, userId) => {
    if (!conversation?.id || !file) return
    const ext = file.name.split('.').pop()
    const path = `${conversation.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('message-attachments').upload(path, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('message-attachments').getPublicUrl(path)
    return sendMessage(file.name, userId, {
      attachment_url: publicUrl,
      attachment_name: file.name,
      attachment_type: file.type,
    })
  }

  const uploadAndSendVoice = async (blob, duration, userId) => {
    if (!conversation?.id) return
    const path = `${conversation.id}/voice_${Date.now()}.webm`
    const { error } = await supabase.storage.from('message-attachments').upload(path, blob)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('message-attachments').getPublicUrl(path)
    return sendMessage('🎤 Nota de voz', userId, {
      attachment_url: publicUrl,
      attachment_type: 'audio/webm',
      is_voice_note: true,
      duration_sec: duration,
    })
  }

  return {
    project,
    conversation,
    contracts,
    proposals,
    loading,
    adminTyping,
    sendMessage,
    uploadAndSend,
    uploadAndSendVoice,
    broadcastTyping,
  }
}
