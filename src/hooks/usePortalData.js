import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function usePortalData(contactId, userId) {
  const [project, setProject] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [contracts, setContracts] = useState([])
  const [proposals, setProposals] = useState([])
  const [meetings, setMeetings] = useState([])
  const [chatSettings, setChatSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [adminTyping, setAdminTyping] = useState(false)

  const typingChannelRef = useRef(null)
  const typingTimerRef = useRef(null)
  const convRef = useRef(null)

  useEffect(() => { convRef.current = conversation }, [conversation])

  useEffect(() => {
    if (!contactId && !userId) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const [
          { data: proj },
          { data: conv },
          { data: ctr },
          { data: prop },
          { data: mtg },
          { data: settingsRow },
        ] = await Promise.all([
          contactId ? db.projects.forClient(contactId) : Promise.resolve({ data: null }),
          db.conversations.forClient(contactId, userId),
          db.contracts.forClient(contactId),
          db.proposals.forClient(contactId),
          db.meetings.forContact(contactId),
          db.settings.get('chat'),
        ])
        setProject(proj || null)
        setConversation(conv || null)
        setContracts(ctr || [])
        setProposals(prop || [])
        setMeetings(mtg || [])
        setChatSettings(settingsRow?.value || {})
      } catch (err) {
        console.error('Portal load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contactId])

  // Realtime: message inserts + updates
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

  const signContract = async (contractId, sig, currentData) => {
    const { data } = await db.contracts.update(contractId, {
      status: 'client_signed',
      client_signed_at: new Date().toLocaleDateString('es-PE'),
      data: { ...currentData, client_signature: sig },
    })
    if (data) {
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'client_signed', data: { ...c.data, client_signature: sig } } : c))
    }
    return data
  }

  const createConversation = async (uid) => {
    const effectiveUserId = uid || userId
    if (!effectiveUserId && !contactId) return null
    const payload = {
      contact_id: contactId || null,
      user_id: contactId ? null : effectiveUserId,
      last_message: '',
      last_at: new Date().toISOString(),
    }
    const { data: conv, error } = await db.conversations.create(payload)
    if (error) { console.error('createConversation:', error); return null }
    if (conv) {
      setConversation({ ...conv, messages: [] })
    }
    return conv
  }

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
    if (file.size > 5 * 1024 * 1024) throw new Error('Archivo demasiado grande (máx 5MB)')
    const dataUrl = await fileToDataUrl(file)
    return sendMessage(file.name, userId, {
      attachment_url: dataUrl,
      attachment_name: file.name,
      attachment_type: file.type,
    })
  }

  const uploadAndSendVoice = async (blob, duration, userId) => {
    if (!conversation?.id) return
    const dataUrl = await fileToDataUrl(blob)
    return sendMessage('🎤 Nota de voz', userId, {
      attachment_url: dataUrl,
      attachment_type: 'audio/webm',
      is_voice_note: true,
      duration_sec: duration,
    })
  }

  // Add a comment to a project phase — writes to same Supabase row the admin edits
  const addPhaseComment = async (phaseKey, text, authorName) => {
    if (!project?.id || !text.trim()) return null
    const existingPhase = project?.phases?.[phaseKey] || {}
    const existingComments = existingPhase.comments || []
    const newComment = {
      id: `cm${Date.now()}`,
      text: text.trim(),
      from: authorName || 'Cliente',
      fromClient: true,
      at: new Date().toISOString(),
      pinned: false,
    }
    const updatedPhases = {
      ...(project.phases || {}),
      [phaseKey]: { ...existingPhase, comments: [...existingComments, newComment] },
    }
    // Optimistic update
    setProject(prev => ({ ...prev, phases: updatedPhases }))
    // Persist
    await db.projects.update(project.id, { phases: updatedPhases })
    return newComment
  }

  // Update phase status from client side (approve / request changes)
  const updatePhaseStatus = async (phaseKey, status) => {
    if (!project?.id) return
    const existingPhase = project?.phases?.[phaseKey] || {}
    const updatedPhases = {
      ...(project.phases || {}),
      [phaseKey]: { ...existingPhase, status },
    }
    setProject(prev => ({ ...prev, phases: updatedPhases }))
    await db.projects.update(project.id, { phases: updatedPhases })
  }

  return {
    project,
    conversation,
    contracts,
    proposals,
    meetings,
    chatSettings,
    loading,
    adminTyping,
    createConversation,
    sendMessage,
    uploadAndSend,
    uploadAndSendVoice,
    broadcastTyping,
    signContract,
    addPhaseComment,
    updatePhaseStatus,
  }
}
