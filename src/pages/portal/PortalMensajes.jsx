import { useState, useRef, useEffect } from 'react'
import {
  Send, Paperclip, Mic, Square, Play, Pause,
  Download, Check, CheckCheck, File as FileIcon,
  MessageSquare, Volume2, X, Image as ImageIcon,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortalData } from '../../hooks/usePortalData'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
}

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

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => setCurrent(Math.floor(audioRef.current?.currentTime || 0))}
        onEnded={() => { setPlaying(false); setCurrent(0) }} />
      <button onClick={toggle}
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
          ${invert ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-zinc-200 hover:bg-zinc-300'}`}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div
        className={`flex-1 h-1.5 ${invert ? 'bg-white/20' : 'bg-zinc-200'} rounded-full cursor-pointer relative`}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          if (audioRef.current) audioRef.current.currentTime = pct * (duration || audioRef.current.duration || 0)
        }}>
        <div className={`absolute top-0 left-0 h-full ${invert ? 'bg-white/60' : 'bg-zinc-500'} rounded-full transition-all`}
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }} />
      </div>
      <span className={`text-[10px] shrink-0 tabular-nums ${invert ? 'text-white/60' : 'text-zinc-400'}`}>
        {fmtDur(playing ? current : duration)}
      </span>
    </div>
  )
}

// ── Message bubble ─────────────────────────────────────────────
function Message({ msg, isFirst, isLast, profileInitial, adminName, adminAvatar }) {
  const isClient = msg.from_role === 'client'
  const isVoice  = msg.is_voice_note
  const isImage  = msg.attachment_type?.startsWith('image/')
  const hasFile  = !!msg.attachment_url && !isVoice

  return (
    <div className={`flex gap-2 ${isClient ? 'flex-row-reverse' : ''}`}>
      {/* Avatar — only show for last message in group */}
      <div className={`w-7 h-7 rounded-full shrink-0 self-end overflow-hidden
        ${isLast ? 'visible' : 'invisible'}
        ${isClient ? 'bg-zinc-700' : 'bg-zinc-900'}
        flex items-center justify-center text-[10px] font-bold text-white`}>
        {!isClient && adminAvatar
          ? <img src={adminAvatar} alt="" className="w-full h-full object-cover" />
          : (!isClient ? (adminName?.[0]?.toUpperCase() || 'A') : (profileInitial || 'C'))
        }
      </div>

      <div className={`max-w-[72%] flex flex-col ${isClient ? 'items-end' : 'items-start'}`}>
        {/* Sender label — only on first of group */}
        {isFirst && !isClient && (
          <p className="text-[10px] text-zinc-400 px-1 mb-0.5 font-medium">{adminName}</p>
        )}

        {/* Bubble */}
        {isVoice ? (
          <div className={`px-3.5 py-2.5 rounded-2xl
            ${isClient ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white border border-zinc-200 rounded-tl-sm shadow-sm'}
            ${isFirst && !isLast ? (isClient ? 'rounded-tr-md' : 'rounded-tl-md') : ''}
            ${!isFirst && isLast ? (isClient ? 'rounded-tr-2xl' : 'rounded-tl-2xl') : ''}
            ${!isFirst && !isLast ? (isClient ? 'rounded-tr-2xl rounded-br-2xl' : 'rounded-tl-2xl rounded-bl-2xl') : ''}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Volume2 className="w-3 h-3 opacity-60" />
              <span className="text-[10px] opacity-60">Nota de voz</span>
            </div>
            <AudioPlayer url={msg.attachment_url} duration={msg.duration_sec} invert={isClient} />
          </div>
        ) : isImage ? (
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
            className={`rounded-2xl overflow-hidden block shadow-sm
              ${isClient ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
            <img src={msg.attachment_url} alt={msg.attachment_name}
              className="max-w-[220px] max-h-[200px] object-cover block" />
          </a>
        ) : hasFile ? (
          <div className={`px-3.5 py-2.5 rounded-2xl
            ${isClient ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white border border-zinc-200 rounded-tl-sm shadow-sm'}`}>
            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80">
              <FileIcon className="w-4 h-4 shrink-0 opacity-70" />
              <span className="text-xs truncate max-w-[150px]">{msg.attachment_name || msg.text}</span>
              <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
            </a>
          </div>
        ) : (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
            ${isClient ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 shadow-sm text-zinc-800'}
            ${isFirst && !isLast ? (isClient ? 'rounded-tr-sm' : 'rounded-tl-sm') : ''}
            ${!isFirst && isLast ? '' : ''}
            ${isFirst && isLast ? (isClient ? 'rounded-tr-sm' : 'rounded-tl-sm') : ''}`}>
            {msg.text}
          </div>
        )}

        {/* Time + status */}
        {isLast && (
          <div className="flex items-center gap-1 mt-0.5 px-1">
            <p className="text-[10px] text-zinc-400">{fmtTime(msg.created_at)}</p>
            {isClient && (
              msg.read_at
                ? <CheckCheck className="w-3 h-3 text-blue-500" />
                : <Check className="w-3 h-3 text-zinc-300" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Typing indicator ───────────────────────────────────────────
function TypingIndicator({ adminName, adminAvatar }) {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
        {adminAvatar
          ? <img src={adminAvatar} alt="" className="w-full h-full object-cover" />
          : (adminName?.[0]?.toUpperCase() || 'A')
        }
      </div>
      <div className="px-3.5 py-2.5 bg-white border border-zinc-200 rounded-2xl rounded-tl-sm flex items-center gap-1 h-9 shadow-sm">
        {[0, 150, 300].map(d => (
          <div key={d} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
            style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
        ))}
      </div>
    </div>
  )
}

// ── Date separator ─────────────────────────────────────────────
function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-zinc-200" />
      <span className="text-[10px] text-zinc-400 font-medium shrink-0 bg-zinc-50 px-2 py-0.5 rounded-full">{label}</span>
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  )
}

// ── Quick replies ──────────────────────────────────────────────
const QUICK_REPLIES = [
  '¿Cuál es el avance del proyecto?',
  'Tengo una consulta',
  '¿Cuándo estará listo?',
  'Quiero hacer un cambio',
]

// ── Main ──────────────────────────────────────────────────────
export default function PortalMensajes() {
  const { profile, user } = useAuth()
  const {
    conversation, loading, adminTyping, chatSettings,
    createConversation, sendMessage, uploadAndSend, uploadAndSendVoice, broadcastTyping,
  } = usePortalData(profile?.contact_id, user?.id)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recDuration, setRecDuration] = useState(0)
  const [creating, setCreating] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const bottomRef    = useRef()
  const listRef      = useRef()
  const fileInputRef = useRef()
  const recorderRef  = useRef()
  const recTimerRef  = useRef()

  const adminName    = chatSettings?.display_name || 'Nithrox'
  const adminAvatar  = chatSettings?.avatar_url   || null
  const msgs = (conversation?.messages || []).filter(m => !m.deleted_at)
  const allowAttachments = conversation?.allow_attachments !== false
  const allowVoice       = conversation?.allow_voice_notes  || false

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length, adminTyping])

  // Show scroll-to-bottom button
  const handleScroll = () => {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120)
  }

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Send text
  const send = async (overrideText) => {
    const msg = (overrideText ?? text).trim()
    if (!msg || sending) return
    setSending(true)
    setText('')
    await sendMessage(msg, user?.id)
    setSending(false)
  }

  const handleTextChange = (val) => {
    setText(val)
    broadcastTyping()
  }

  // File upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setSending(true)
      await uploadAndSend(file, user?.id)
    } catch (err) {
      toast.error(err.message || 'Error al subir archivo')
    } finally {
      setSending(false)
      e.target.value = ''
    }
  }

  // Voice notes
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
        try {
          setSending(true)
          await uploadAndSendVoice(blob, dur, user?.id)
        } catch {
          toast.error('Error al enviar nota de voz')
        } finally {
          setSending(false)
          setRecording(false)
          setRecDuration(0)
        }
      }

      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      recTimerRef.current = setInterval(() => { dur += 1; setRecDuration(dur) }, 1000)
    } catch {
      toast.error('No se puede acceder al micrófono')
    }
  }

  const stopRecording   = () => recorderRef.current?.stop()
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

  const handleContactSupport = async () => {
    if (!user?.id) return
    setCreating(true)
    try {
      await createConversation(user.id)
    } catch {
      toast.error('No se pudo iniciar la conversación')
    } finally {
      setCreating(false)
    }
  }

  // Group messages by date, then by consecutive sender
  const groupedMsgs = msgs.reduce((acc, msg, i) => {
    const dateKey = fmtDate(msg.created_at)
    if (!acc.length || acc[acc.length - 1].date !== dateKey) {
      acc.push({ date: dateKey, messages: [] })
    }
    acc[acc.length - 1].messages.push(msg)
    return acc
  }, [])

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        Cargando mensajes...
      </div>
    )
  }

  // ── No conversation yet ───────────────────────────────────
  if (!conversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-zinc-50">
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center overflow-hidden shadow-lg">
              {adminAvatar
                ? <img src={adminAvatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-xl">{adminName?.[0] || 'N'}</span>
              }
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          </div>

          <div className="text-center">
            <p className="font-black text-zinc-900 text-lg">{adminName}</p>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs leading-relaxed">
              {chatSettings?.welcome_message || '¡Hola! Estamos aquí para ayudarte con tu proyecto.'}
            </p>
            {chatSettings?.response_time && (
              <p className="text-[11px] text-zinc-400 mt-2">
                ⚡ Tiempo de respuesta estimado: <span className="font-semibold">{chatSettings.response_time}</span>
              </p>
            )}
          </div>

          {/* Quick start chips */}
          <div className="w-full max-w-sm space-y-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center mb-3">¿Cómo te podemos ayudar?</p>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_REPLIES.map(q => (
                <button key={q}
                  disabled={creating}
                  onClick={async () => {
                    setCreating(true)
                    try {
                      const conv = await createConversation(user?.id)
                      if (conv) await sendMessage(q, user?.id)
                    } catch {
                      toast.error('Error al iniciar conversación')
                    } finally {
                      setCreating(false)
                    }
                  }}
                  className="flex items-center gap-2.5 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-700 font-medium hover:border-zinc-400 hover:bg-zinc-50 text-left transition-all disabled:opacity-40">
                  <span className="text-zinc-400">→</span>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleContactSupport}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-sm font-bold rounded-2xl hover:bg-zinc-700 transition-colors disabled:opacity-50 shadow-lg">
            <MessageSquare className="w-4 h-4" />
            {creating ? 'Iniciando...' : 'Mensaje personalizado'}
          </button>
        </div>
      </div>
    )
  }

  // ── Chat ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 bg-white shrink-0 shadow-sm">
        <div className="relative shrink-0">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden">
            {adminAvatar
              ? <img src={adminAvatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-black text-sm">{adminName?.[0]?.toUpperCase() || 'N'}</span>
            }
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900">{adminName}</p>
          <p className="text-[11px] text-green-600 font-medium">
            {chatSettings?.response_time
              ? `Responde en ${chatSettings.response_time}`
              : 'Normalmente responde rápido'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-zinc-50 relative"
      >
        {/* Empty state */}
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 py-12">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-sm font-medium">Inicia la conversación</p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {QUICK_REPLIES.slice(0, 3).map(q => (
                <button key={q} onClick={() => send(q)}
                  className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs text-zinc-600 hover:border-zinc-400 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages grouped by date */}
        {groupedMsgs.map(group => (
          <div key={group.date} className="space-y-1">
            <DateSeparator label={group.date} />
            {group.messages.map((msg, i) => {
              const prevMsg = i > 0 ? group.messages[i - 1] : null
              const nextMsg = i < group.messages.length - 1 ? group.messages[i + 1] : null
              const isFirst = !prevMsg || prevMsg.from_role !== msg.from_role
              const isLast  = !nextMsg || nextMsg.from_role !== msg.from_role
              return (
                <div key={msg.id} className={isFirst ? 'mt-3' : 'mt-0.5'}>
                  <Message
                    msg={msg}
                    isFirst={isFirst}
                    isLast={isLast}
                    profileInitial={profile?.name?.[0]}
                    adminName={adminName}
                    adminAvatar={adminAvatar}
                  />
                </div>
              )
            })}
          </div>
        ))}

        {adminTyping && (
          <div className="mt-3">
            <TypingIndicator adminName={adminName} adminAvatar={adminAvatar} />
          </div>
        )}
        <div ref={bottomRef} />

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-20 right-6 w-9 h-9 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-zinc-700 transition-all z-10">
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-zinc-200 shrink-0">
        {/* Recording mode */}
        {recording ? (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-sm text-red-600 font-bold tabular-nums">{fmtDur(recDuration)}</span>
            <span className="text-xs text-zinc-400 flex-1">Grabando nota de voz...</span>
            <button onClick={cancelRecording}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-full text-zinc-500 hover:bg-zinc-50">
              <X className="w-3 h-3" /> Cancelar
            </button>
            <button onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-full hover:bg-zinc-700">
              <Square className="w-3 h-3 fill-white" /> Enviar
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

            {/* Attachment button */}
            {allowAttachments && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                title="Adjuntar archivo"
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-40 shrink-0">
                <Paperclip className="w-4 h-4" />
              </button>
            )}

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Escribe un mensaje..."
                rows={1}
                style={{ resize: 'none', maxHeight: '96px', overflowY: 'auto' }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors leading-relaxed"
              />
            </div>

            {/* Voice note */}
            {allowVoice && !text.trim() && (
              <button
                onClick={startRecording}
                disabled={sending}
                title="Nota de voz"
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-40 shrink-0">
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Send */}
            <button
              onClick={() => send()}
              disabled={!text.trim() || sending}
              className="w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-700 disabled:opacity-30 transition-all shrink-0 active:scale-95">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick reply chips — shown when input is empty */}
        {!text.trim() && !recording && msgs.length > 0 && msgs.length < 4 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
            {QUICK_REPLIES.slice(0, 3).map(q => (
              <button key={q} onClick={() => send(q)}
                className="flex items-center gap-1 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-[11px] text-zinc-600 hover:border-zinc-400 whitespace-nowrap transition-all font-medium shrink-0">
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
