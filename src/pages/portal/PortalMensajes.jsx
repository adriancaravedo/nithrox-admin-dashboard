import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, Square, Play, Pause, Volume2, Download, Check, CheckCheck, File as FileIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortalData } from '../../hooks/usePortalData'
import { toast } from 'sonner'

function fmt(iso) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
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
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${invert ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-zinc-200 hover:bg-zinc-300'}`}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div className={`flex-1 h-1.5 ${invert ? 'bg-white/20' : 'bg-zinc-200'} rounded-full cursor-pointer relative`}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          if (audioRef.current) audioRef.current.currentTime = pct * (duration || audioRef.current.duration || 0)
        }}>
        <div className={`absolute top-0 left-0 h-full ${invert ? 'bg-white/60' : 'bg-zinc-500'} rounded-full transition-all`}
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }} />
      </div>
      <span className={`text-[10px] shrink-0 ${invert ? 'text-white/60' : 'text-zinc-400'}`}>
        {fmtDur(playing ? current : duration)}
      </span>
    </div>
  )
}

// ── Message ───────────────────────────────────────────────────
function Message({ msg, profileInitial }) {
  const isClient = msg.from_role === 'client'
  const isVoice = msg.is_voice_note
  const isImage = msg.attachment_type?.startsWith('image/')
  const hasFile = !!msg.attachment_url && !isVoice

  return (
    <div className={`flex gap-2.5 ${isClient ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 self-end ${isClient ? 'bg-zinc-700' : 'bg-zinc-900'}`}>
        {isClient ? (profileInitial || 'C') : 'AC'}
      </div>
      <div className={`max-w-[75%] flex flex-col ${isClient ? 'items-end' : 'items-start'}`}>
        {isVoice ? (
          <div className={`px-3.5 py-2.5 rounded-2xl ${isClient ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white border border-zinc-200 rounded-tl-sm'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Volume2 className="w-3 h-3 opacity-60" />
              <span className="text-[10px] opacity-60">Nota de voz</span>
            </div>
            <AudioPlayer url={msg.attachment_url} duration={msg.duration_sec} invert={isClient} />
          </div>
        ) : isImage ? (
          <div className={`rounded-2xl overflow-hidden ${isClient ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
              <img src={msg.attachment_url} alt={msg.attachment_name}
                className="max-w-[220px] max-h-[200px] object-cover block" />
            </a>
          </div>
        ) : hasFile ? (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isClient ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white border border-zinc-200 rounded-tl-sm'}`}>
            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80">
              <FileIcon className="w-4 h-4 shrink-0" />
              <span className="text-xs truncate max-w-[150px]">{msg.attachment_name || msg.text}</span>
              <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
            </a>
          </div>
        ) : (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isClient ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white border border-zinc-200 rounded-tl-sm'}`}>
            {msg.text}
          </div>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <p className="text-[10px] text-zinc-400">{fmt(msg.created_at)}</p>
          {isClient && !isDeleted && (
            msg.read_at
              ? <CheckCheck className="w-3 h-3 text-blue-500" />
              : <Check className="w-3 h-3 text-zinc-300" />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Typing Dots ───────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
        AC
      </div>
      <div className="px-3.5 py-2.5 bg-white border border-zinc-200 rounded-2xl rounded-tl-sm flex items-center gap-1 h-9">
        {[0, 150, 300].map(d => (
          <div key={d} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
            style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function PortalMensajes() {
  const { profile, user } = useAuth()
  const {
    conversation, loading, adminTyping,
    sendMessage, uploadAndSend, uploadAndSendVoice, broadcastTyping,
  } = usePortalData(profile?.contact_id)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recDuration, setRecDuration] = useState(0)

  const bottomRef = useRef()
  const fileInputRef = useRef()
  const recorderRef = useRef()
  const recTimerRef = useRef()
  const adminOnline = localStorage.getItem('ntx_admin_online') !== '0'

  const msgs = (conversation?.messages || []).filter(m => !m.deleted_at)
  const allowAttachments = conversation?.allow_attachments !== false
  const allowVoice = conversation?.allow_voice_notes || false

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length, adminTyping])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const msg = text.trim()
    setText('')
    await sendMessage(msg, user?.id)
    setSending(false)
  }

  const handleTextChange = (val) => {
    setText(val)
    broadcastTyping()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setSending(true)
      await uploadAndSend(file, user?.id)
    } catch {
      toast.error('Error al subir archivo')
    } finally {
      setSending(false)
      e.target.value = ''
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        Cargando mensajes...
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm text-center px-8">
        No tienes una conversación activa.<br />
        <span className="text-xs mt-1 block">Nithrox te contactará pronto.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]" style={{ fontFamily: "'Geist Mono', monospace" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 bg-white shrink-0">
        <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-[10px]">AC</span>
        </div>
        <div>
          <p className="text-sm font-bold">Adrian Caravedo · Nithrox</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${adminOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`} />
            <p className={`text-[10px] font-bold ${adminOnline ? 'text-green-600' : 'text-zinc-400'}`}>
              {adminOnline ? 'En línea' : 'Offline — responderá pronto'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
        {msgs.length === 0 && (
          <div className="text-center text-xs text-zinc-400 mt-8">
            No hay mensajes aún. ¡Inicia la conversación!
          </div>
        )}
        {msgs.map(msg => (
          <Message key={msg.id} msg={msg} profileInitial={profile?.name?.[0]} />
        ))}
        {adminTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-zinc-200 shrink-0">
        {recording ? (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-sm font-mono text-red-600 font-bold">{fmtDur(recDuration)}</span>
            <span className="text-xs text-zinc-400 flex-1">Grabando...</span>
            <button onClick={cancelRecording}
              className="px-3 py-1.5 text-xs border border-zinc-200 rounded-full text-zinc-500 hover:bg-zinc-50">
              Cancelar
            </button>
            <button onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-full hover:bg-zinc-700">
              <Square className="w-3 h-3 fill-white" /> Enviar
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
            {allowAttachments && (
              <button onClick={() => fileInputRef.current?.click()} disabled={sending} title="Adjuntar archivo"
                className="text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 disabled:opacity-40">
                <Paperclip className="w-4 h-4" />
              </button>
            )}
            {allowVoice && (
              <button onClick={startRecording} disabled={sending} title="Nota de voz"
                className="text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 disabled:opacity-40">
                <Mic className="w-4 h-4" />
              </button>
            )}
            <input value={text} onChange={e => handleTextChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors" />
            <button onClick={send} disabled={!text.trim() || sending}
              className="w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-700 disabled:opacity-40 transition-all shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
