import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const INITIAL = [
  { id: 1, from: 'nithrox', text: '¡Hola! Ya iniciamos con tu proyecto. Esta semana te compartimos el primer avance del diseño.', at: '2026-04-20T10:00:00Z' },
  { id: 2, from: 'client', text: '¡Perfecto! Estamos muy emocionados.', at: '2026-04-20T10:30:00Z' },
  { id: 3, from: 'nithrox', text: 'El diseño del home ya está listo. Puedes revisarlo en la sección Proyecto → Diseño.', at: '2026-04-25T09:00:00Z' },
]

function fmt(iso) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export default function PortalMensajes() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState(INITIAL)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const send = () => {
    if (!text.trim()) return
    const msg = { id: Date.now(), from: 'client', text: text.trim(), at: new Date().toISOString() }
    setMessages(p => [...p, msg])
    setText('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(p => [...p, {
        id: Date.now() + 1, from: 'nithrox',
        text: 'Gracias por tu mensaje. Te respondemos a la brevedad.',
        at: new Date().toISOString()
      }])
    }, 2000)
  }

  const adminOnline = localStorage.getItem('ntx_admin_online') !== '0'

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
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.from === 'client' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${msg.from === 'client' ? 'bg-zinc-600' : 'bg-zinc-900'}`}>
              {msg.from === 'client' ? (profile?.name?.[0] || 'C') : 'AC'}
            </div>
            <div className={`max-w-[75%] flex flex-col ${msg.from === 'client' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === 'client' ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white border border-zinc-200 rounded-tl-sm'}`}>
                {msg.text}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">{fmt(msg.at)}</p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2.5 items-end">
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-white">AC</div>
            <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 rounded-tl-sm flex items-center gap-1 h-9">
              {[0,150,300].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-zinc-200 flex gap-2 shrink-0">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors" />
        <button onClick={send} disabled={!text.trim()}
          className="w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-700 disabled:opacity-40 transition-all shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
