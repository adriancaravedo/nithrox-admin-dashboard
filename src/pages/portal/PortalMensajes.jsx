import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortalData } from '../../hooks/usePortalData'

function fmt(iso) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export default function PortalMensajes() {
  const { profile, user } = useAuth()
  const { conversation, loading, sendMessage } = usePortalData(profile?.contact_id)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()
  const adminOnline = localStorage.getItem('ntx_admin_online') !== '0'

  const msgs = conversation?.messages || []

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const msg = text.trim()
    setText('')
    await sendMessage(msg, user?.id)
    setSending(false)
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
        {msgs.map(msg => {
          const isClient = msg.from_role === 'client'
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isClient ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${isClient ? 'bg-zinc-600' : 'bg-zinc-900'}`}>
                {isClient ? (profile?.name?.[0] || 'C') : 'AC'}
              </div>
              <div className={`max-w-[75%] flex flex-col ${isClient ? 'items-end' : 'items-start'}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isClient ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white border border-zinc-200 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">{fmt(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-zinc-200 flex gap-2 shrink-0">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors" />
        <button onClick={send} disabled={!text.trim() || sending}
          className="w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-700 disabled:opacity-40 transition-all shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
