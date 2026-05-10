import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { db } from '../../../lib/db'
import { formatRelative, getInitials } from '../../../lib/utils'
import Topbar from '../../../components/layout/Topbar'
import { Input } from '../../../components/ui/input'
import { toast } from 'sonner'
import {
  Send, Paperclip, Search, Plus, X, Mic, Square,
  Calendar, UserCircle, FolderKanban, FileText, Phone,
  Trash2, Settings2, Play, Pause, Download, Check, CheckCheck,
  Volume2, Image as ImageIcon, File as FileIcon, Toggle3Right
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
function fmtDur(sec) {
  const s = Math.floor(sec || 0)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Audio Player ──────────────────────────────────────────────
function AudioPlayer({ url, duration, invert }) {
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const audioRef = useRef()

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  const seek = (e) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * (duration || audioRef.current.duration || 0)
  }

  const barCls = invert ? 'bg-white/20' : 'bg-muted-foreground/20'
  const fillCls = invert ? 'bg-white/70' : 'bg-muted-foreground/60'

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => setCurrent(Math.floor(audioRef.current?.currentTime || 0))}
        onEnded={() => { setPlaying(false); setCurrent(0) }} />
      <button onClick={toggle}
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${invert ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-foreground/10 hover:bg-foreground/20'}`}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div className={`flex-1 h-1.5 ${barCls} rounded-full cursor-pointer relative`} onClick={seek}>
        <div className={`absolute top-0 left-0 h-full ${fillCls} rounded-full transition-all`}
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }} />
      </div>
      <span className={`text-[10px] shrink-0 ${invert ? 'text-white/60' : 'text-muted-foreground'}`}>
        {fmtDur(playing ? current : duration)}
      </span>
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────────
function MessageBubble({ msg, isFromAdmin, convo, onDelete }) {
  const [hover, setHover] = useState(false)
  const isDeleted = !!msg.deleted_at
  const isVoice = msg.is_voice_note
  const isImage = msg.attachment_type?.startsWith('image/')
  const hasFile = !!msg.attachment_url && !isVoice

  return (
    <div className={`flex gap-2.5 group ${isFromAdmin ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 self-end mb-4"
        style={{ backgroundColor: isFromAdmin ? '#18181b' : convo.avatar_color }}>
        {isFromAdmin ? 'AC' : convo.initials}
      </div>

      {/* Bubble + meta */}
      <div className={`max-w-[68%] flex flex-col ${isFromAdmin ? 'items-end' : 'items-start'}`}>
        {isDeleted ? (
          <div className="px-3.5 py-2 rounded-2xl bg-muted/50 border border-border text-muted-foreground italic text-xs flex items-center gap-1.5">
            <Trash2 className="w-3 h-3" /> Mensaje eliminado
          </div>
        ) : isVoice ? (
          <div className={`px-3.5 py-2.5 rounded-2xl ${isFromAdmin ? 'bg-foreground text-background rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Volume2 className="w-3 h-3 opacity-60" />
              <span className="text-[10px] opacity-60">Nota de voz</span>
            </div>
            <AudioPlayer url={msg.attachment_url} duration={msg.duration_sec} invert={isFromAdmin} />
          </div>
        ) : isImage ? (
          <div className={`rounded-2xl overflow-hidden ${isFromAdmin ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
              <img src={msg.attachment_url} alt={msg.attachment_name}
                className="max-w-[220px] max-h-[200px] object-cover block" />
            </a>
          </div>
        ) : hasFile ? (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isFromAdmin ? 'bg-foreground text-background rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80">
              <FileIcon className="w-4 h-4 shrink-0" />
              <span className="text-xs truncate max-w-[150px]">{msg.attachment_name || msg.text}</span>
              <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
            </a>
          </div>
        ) : (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isFromAdmin ? 'bg-foreground text-background rounded-tr-sm' : 'bg-muted rounded-tl-sm'
          }`}>
            {msg.text}
          </div>
        )}
        {/* Meta row */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{formatRelative(msg.at)}</span>
          {isFromAdmin && !isDeleted && (
            msg.read_at
              ? <CheckCheck className="w-3 h-3 text-blue-500" />
              : <Check className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Delete action — admin only, on hover */}
      {onDelete && !isDeleted && hover && (
        <button onClick={() => onDelete(msg.id)} title="Eliminar mensaje"
          className={`self-center p-1.5 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors ${isFromAdmin ? 'order-first' : ''}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ── Typing Dots ───────────────────────────────────────────────
function TypingIndicator({ name, color }) {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ backgroundColor: color || '#64748b' }}>
        {name?.[0] || 'C'}
      </div>
      <div className="px-3.5 py-2.5 rounded-2xl bg-muted rounded-tl-sm flex items-center gap-1 h-9">
        {[0, 150, 300].map(d => (
          <div key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
        ))}
      </div>
    </div>
  )
}

// ── New Conversation Dialog ───────────────────────────────────
function NewConvoDialog({ contacts, companies, onStart, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest">Nueva conversación</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar contacto..." autoFocus
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg outline-none focus:border-primary bg-background" />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.map(contact => {
            const company = companies.find(co => co.id === contact.company_id)
            return (
              <button key={contact.id} onClick={() => onStart(contact, company)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent/50 transition-colors text-left border-b border-border/50 last:border-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: contact.avatar_color || '#64748b' }}>
                  {getInitials(contact.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{contact.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{company?.name || contact.email || '—'}</p>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">Sin contactos</div>}
        </div>
      </div>
    </div>
  )
}

// ── Settings Panel ────────────────────────────────────────────
function SettingsPanel({ convo, onToggle, onClose }) {
  return (
    <div className="w-[220px] border-l border-border overflow-y-auto shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Configuración</p>
        <button onClick={onClose}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Permisos del cliente</p>
          <div className="space-y-3">
            {[
              { key: 'allow_attachments', label: 'Adjuntar archivos', desc: 'El cliente puede enviar archivos' },
              { key: 'allow_voice_notes', label: 'Notas de voz', desc: 'El cliente puede enviar audios' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
                </div>
                <button onClick={() => onToggle(key)}
                  className={`w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 relative ${convo?.[key] ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${convo?.[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Conversación</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Contact: <span className="text-foreground font-medium">{convo?.contact || '—'}</span></p>
            <p>Empresa: <span className="text-foreground font-medium">{convo?.company || '—'}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function MessagesPage() {
  const {
    messages, sendMessage, markRead, createConversation,
    deleteMessage: storeDeleteMsg, updateConversationSettings, updateMessageReadAt,
    appendRealtimeMessage, companies, contacts, deals, projects,
  } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [active, setActive] = useState(null)
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [isOnline, setIsOnline] = useState(localStorage.getItem('ntx_admin_online') !== '0')
  const [typing, setTyping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recDuration, setRecDuration] = useState(0)

  const bottomRef = useRef()
  const fileInputRef = useRef()
  const typingTimerRef = useRef()
  const typingChannelRef = useRef()
  const globalChannelRef = useRef()
  const recorderRef = useRef()
  const recTimerRef = useRef()
  const activeRef = useRef(active)

  // Keep activeRef in sync
  useEffect(() => { activeRef.current = active }, [active])

  // Default to first conversation
  useEffect(() => {
    if (!active && messages.length > 0) setActive(messages[0].id)
  }, [messages.length])

  const activeConvo = messages.find(m => m.id === active)

  // Scroll to bottom when active conversation or messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active, activeConvo?.messages?.length])

  // ── Global Realtime subscription (message inserts + read-receipt updates) ──
  useEffect(() => {
    const channel = supabase
      .channel('admin-global-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        if (msg.from_role !== 'client') return
        appendRealtimeMessage(msg.conversation_id, msg)
        // If admin is viewing this conversation, mark as read immediately
        if (msg.conversation_id === activeRef.current) {
          db.messages.markClientRead(msg.conversation_id)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        // Capture when client has read admin messages
        if (msg.read_at && msg.from_role === 'admin') {
          updateMessageReadAt(msg.conversation_id, msg.id, msg.read_at)
        }
      })
      .subscribe()

    globalChannelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [])

  // ── Per-conversation channel for typing ──────────────────────
  useEffect(() => {
    if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
    if (!active) return

    const channel = supabase
      .channel(`conv-typing-${active}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.role === 'client') {
          setTyping(true)
          clearTimeout(typingTimerRef.current)
          typingTimerRef.current = setTimeout(() => setTyping(false), 2500)
        }
      })
      .subscribe()

    typingChannelRef.current = channel

    // Mark all unread client messages as read when admin opens conversation
    db.messages.markClientRead(active)
    markRead(active)

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(typingTimerRef.current)
    }
  }, [active])

  // ── Handlers ──────────────────────────────────────────────────
  const handleSelect = (id) => {
    setActive(id)
    setTyping(false)
    setShowSettings(false)
  }

  const handleTextChange = (val) => {
    setText(val)
    typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { role: 'admin' } })
  }

  const handleSend = async () => {
    if (!text.trim() || !active) return
    const msg = text.trim()
    setText('')
    await sendMessage(active, msg, user?.id, 'admin')
  }

  const handleNewConvo = async (contact, company) => {
    const existing = messages.find(m => m.company_id === contact.company_id)
    if (existing) { setActive(existing.id); setShowNew(false); return }
    const conv = await createConversation(contact, company)
    if (conv) setActive(conv.id)
    setShowNew(false)
  }

  // ── File attachment ──────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !active) return
    try {
      const ext = file.name.split('.').pop()
      const path = `${active}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('message-attachments').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('message-attachments').getPublicUrl(path)
      await sendMessage(active, file.name, user?.id, 'admin', {
        attachment_url: publicUrl,
        attachment_name: file.name,
        attachment_type: file.type,
      })
    } catch {
      toast.error('Error subiendo archivo')
    }
    e.target.value = ''
  }

  // ── Voice note recording ─────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      let dur = 0

      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        clearInterval(recTimerRef.current)
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const path = `${active}/voice_${Date.now()}.webm`
        try {
          const { error } = await supabase.storage.from('message-attachments').upload(path, blob)
          if (error) throw error
          const { data: { publicUrl } } = supabase.storage.from('message-attachments').getPublicUrl(path)
          await sendMessage(active, '🎤 Nota de voz', user?.id, 'admin', {
            attachment_url: publicUrl,
            attachment_type: 'audio/webm',
            is_voice_note: true,
            duration_sec: dur,
          })
        } catch {
          toast.error('Error enviando nota de voz')
        }
        setRecording(false)
        setRecDuration(0)
      }

      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      recTimerRef.current = setInterval(() => { dur += 1; setRecDuration(dur) }, 1000)
    } catch {
      toast.error('No se puede acceder al micrófono')
    }
  }

  const stopRecording = () => recorderRef.current?.stop()
  const cancelRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.ondataavailable = null
      recorderRef.current.onstop = () => {
        clearInterval(recTimerRef.current)
        setRecording(false)
        setRecDuration(0)
      }
      recorderRef.current.stop()
    }
  }

  // ── Admin delete ─────────────────────────────────────────────
  const handleDelete = async (msgId) => {
    await storeDeleteMsg(msgId, user?.id, active)
  }

  // ── Conversation settings toggle ──────────────────────────────
  const handleToggleSetting = async (key) => {
    await updateConversationSettings(active, { [key]: !activeConvo?.[key] })
  }

  // ── Sidebar filter ───────────────────────────────────────────
  const filtered = messages.filter(m =>
    m.company.toLowerCase().includes(search.toLowerCase()) ||
    m.contact.toLowerCase().includes(search.toLowerCase())
  )

  const clientContact = contacts.find(c => c.company_id === activeConvo?.company_id || c.id === activeConvo?.contact_id)
  const clientProjects = activeConvo ? projects.filter(p => p.company_id === activeConvo.company_id && !p._deleted) : []
  const clientDeals = activeConvo ? deals.filter(d => d.company_id === activeConvo.company_id) : []

  const CHAT_ACTIONS = [
    { icon: <Calendar className="w-4 h-4" />, label: 'Reunión', action: () => navigate('/agenda') },
    { icon: <UserCircle className="w-4 h-4" />, label: 'Ficha', action: () => { if (clientContact) navigate(`/clients/contacts/${clientContact.id}`); else toast.error('Contacto no encontrado') } },
    { icon: <FolderKanban className="w-4 h-4" />, label: 'Proyectos', action: () => navigate('/projects') },
    { icon: <FileText className="w-4 h-4" />, label: 'Contrato', action: () => navigate('/contracts') },
    { icon: <Phone className="w-4 h-4" />, label: 'Llamar', action: () => { if (clientContact?.phone) window.location.href = `tel:${clientContact.phone}`; else toast.error('Sin número registrado') } },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="MENSAJES" actions={
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const next = !isOnline
            setIsOnline(next)
            localStorage.setItem('ntx_admin_online', next ? '1' : '0')
            toast.success(next ? 'Ahora apareces como online' : 'Ahora apareces como offline')
          }} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${isOnline ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5" /> Nueva conversación
          </button>
        </div>
      } />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <div className="w-[280px] border-r border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted border-0" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.map(m => (
              <button key={m.id} onClick={() => handleSelect(m.id)}
                className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-colors hover:bg-accent/50 ${active === m.id ? 'bg-accent/70 border-l-2 border-l-foreground' : ''}`}>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: m.avatar_color }}>{m.initials}</div>
                  {m.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold truncate">{m.company}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatRelative(m.last_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{m.last_message}</p>
                </div>
                {m.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold shrink-0">
                    {m.unread}
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">Sin conversaciones</div>
            )}
          </div>
        </div>

        {/* ── Chat area ───────────────────────────────────────────── */}
        {activeConvo ? (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: activeConvo.avatar_color }}>{activeConvo.initials}</div>
                  {activeConvo.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{activeConvo.company}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeConvo.contact}
                    {typing && <span className="ml-1 text-green-600 font-medium"> · escribiendo...</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {CHAT_ACTIONS.map((a, i) => (
                  <button key={i} onClick={a.action} title={a.label}
                    className="flex items-center gap-1.5 px-2 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                    {a.icon}
                    <span className="hidden xl:block">{a.label}</span>
                  </button>
                ))}
                <button onClick={() => setShowSettings(s => !s)} title="Configuración"
                  className={`flex items-center gap-1.5 px-2 py-1.5 border rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider ${showSettings ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeConvo.messages.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">No hay mensajes aún</div>
              )}
              {activeConvo.messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg}
                  isFromAdmin={msg.from === 'admin'}
                  convo={activeConvo}
                  onDelete={handleDelete} />
              ))}
              {typing && <TypingIndicator name={activeConvo.contact} color={activeConvo.avatar_color} />}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="px-5 py-3 border-t border-border shrink-0">
              {recording ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-sm font-mono text-red-600 font-bold">{fmtDur(recDuration)}</span>
                  <span className="text-xs text-muted-foreground flex-1">Grabando nota de voz...</span>
                  <button onClick={cancelRecording}
                    className="px-3 py-1.5 text-xs border border-border rounded-full hover:bg-accent text-muted-foreground">
                    Cancelar
                  </button>
                  <button onClick={stopRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-foreground text-background rounded-full hover:bg-foreground/90">
                    <Square className="w-3 h-3 fill-current" /> Enviar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Hidden file input */}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                  <button onClick={() => fileInputRef.current?.click()} title="Adjuntar archivo"
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button onClick={startRecording} title="Nota de voz"
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <Mic className="w-4 h-4" />
                  </button>
                  <Input
                    value={text}
                    onChange={e => handleTextChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Escribe un mensaje... (Enter para enviar)"
                    className="flex-1 border-0 bg-muted rounded-full px-4 focus-visible:ring-0 text-sm"
                  />
                  <button onClick={handleSend} disabled={!text.trim()}
                    className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest">Selecciona una conversación</p>
              <p className="text-xs mt-1">o crea una nueva</p>
            </div>
          </div>
        )}

        {/* ── Right panel: settings OR client info ─────────────────── */}
        {activeConvo && (
          showSettings ? (
            <SettingsPanel convo={activeConvo} onToggle={handleToggleSetting} onClose={() => setShowSettings(false)} />
          ) : (
            <div className="w-[220px] border-l border-border overflow-y-auto shrink-0 p-4 space-y-4">
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">CLIENTE</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: activeConvo.avatar_color }}>{activeConvo.initials}</div>
                  <div>
                    <p className="text-xs font-bold">{activeConvo.company}</p>
                    <p className="text-[10px] text-muted-foreground">{activeConvo.contact}</p>
                  </div>
                </div>
                {clientContact?.phone && (
                  <a href={`tel:${clientContact.phone}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Phone className="w-3 h-3" /> {clientContact.phone}
                  </a>
                )}
              </div>

              {clientProjects.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">PROYECTOS</p>
                  {clientProjects.slice(0, 3).map(p => (
                    <div key={p.id} className="border border-border rounded-lg p-2 mb-1.5 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/projects/${p.id}`)}>
                      <p className="text-[10px] font-bold truncate">{p.name}</p>
                      <p className="text-[9px] text-muted-foreground">{p.phase} · ${p.value?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {clientDeals.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">DEALS</p>
                  {clientDeals.slice(0, 3).map(d => (
                    <div key={d.id} className="border border-border rounded-lg p-2 mb-1.5">
                      <p className="text-[10px] font-bold truncate">{d.name}</p>
                      <p className="text-[9px] text-muted-foreground">${d.amount?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Permissions summary */}
              <div className="border-t border-border pt-3">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">PERMISOS</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${activeConvo.allow_attachments ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                    <span className="text-muted-foreground">Archivos {activeConvo.allow_attachments ? 'permitidos' : 'bloqueados'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${activeConvo.allow_voice_notes ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                    <span className="text-muted-foreground">Voz {activeConvo.allow_voice_notes ? 'permitida' : 'bloqueada'}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {showNew && (
        <NewConvoDialog contacts={contacts} companies={companies}
          onStart={handleNewConvo} onClose={() => setShowNew(false)} />
      )}
    </div>
  )
}
