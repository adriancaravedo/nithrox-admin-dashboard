import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { useAuth } from '../../../context/AuthContext'
import { formatRelative, getInitials } from '../../../lib/utils'
import Topbar from '../../../components/layout/Topbar'
import { Input } from '../../../components/ui/input'
import { toast } from 'sonner'
import {
  Send, Paperclip, Search, Plus, X,
  Calendar, UserCircle, FolderKanban, FileText, Phone
} from 'lucide-react'

// ── New conversation picker ───────────────────────────────────
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
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Sin contactos</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Typing dots animation ─────────────────────────────────────
function TypingIndicator({ name }) {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
        {name?.[0] || 'C'}
      </div>
      <div className="px-3.5 py-2.5 rounded-2xl bg-muted rounded-tl-sm flex items-center gap-1 h-9">
        {[0, 150, 300].map(delay => (
          <div key={delay} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }} />
        ))}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const { messages, sendMessage, markRead, createConversation, companies, contacts, deals, projects } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState(messages[0]?.id || null)
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const bottomRef = useRef()

  // Sync active to first convo once messages load
  useEffect(() => {
    if (!active && messages.length > 0) setActive(messages[0].id)
  }, [messages.length])

  const activeConvo = messages.find(m => m.id === active)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [active, activeConvo?.messages?.length])

  const handleSelect = (id) => { setActive(id); markRead(id) }

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

  const filtered = messages.filter(m =>
    m.company.toLowerCase().includes(search.toLowerCase()) ||
    m.contact.toLowerCase().includes(search.toLowerCase())
  )

  const clientCompany = activeConvo ? companies.find(c => c.id === activeConvo.company_id) : null
  const clientProjects = clientCompany ? projects.filter(p => p.company_id === clientCompany?.id && !p._deleted) : []
  const clientDeals = clientCompany ? deals.filter(d => d.company_id === clientCompany?.id) : []
  const clientContact = contacts.find(c => c.company_id === activeConvo?.company_id)

  // Chat action buttons
  const CHAT_ACTIONS = [
    {
      icon: <Calendar className="w-4 h-4" />,
      label: 'Agendar reunión',
      tip: 'Agendar reunión con este cliente',
      action: () => navigate('/agenda'),
    },
    {
      icon: <UserCircle className="w-4 h-4" />,
      label: 'Ver ficha',
      tip: 'Ver ficha del contacto',
      action: () => {
        if (clientContact) navigate(`/clients/contacts/${clientContact.id}`)
        else toast.error('Contacto no encontrado')
      },
    },
    {
      icon: <FolderKanban className="w-4 h-4" />,
      label: 'Proyectos',
      tip: 'Ver proyectos del cliente',
      action: () => navigate('/projects'),
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Contrato',
      tip: 'Ver contratos',
      action: () => navigate('/contracts'),
    },
    {
      icon: <Phone className="w-4 h-4" />,
      label: 'Llamar',
      tip: 'Llamar al cliente',
      action: () => {
        if (clientContact?.phone) window.location.href = `tel:${clientContact.phone}`
        else toast.error('Sin número registrado')
      },
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="MENSAJES" actions={
        <div className="flex items-center gap-2">
          {/* Online/Offline toggle */}
          <button
            onClick={() => {
              const next = !isOnline
              setIsOnline(next)
              localStorage.setItem('ntx_admin_online', next ? '1' : '0')
              toast.success(next ? '✅ Ahora apareces como online para tus clientes' : '⭕ Ahora apareces como offline para tus clientes')
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
              isOnline
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
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
        {/* Sidebar — conversation list */}
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
                    style={{ backgroundColor: m.avatar_color }}>
                    {m.initials}
                  </div>
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
          </div>
        </div>

        {/* Chat area */}
        {activeConvo ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: activeConvo.avatar_color }}>
                    {activeConvo.initials}
                  </div>
                  {activeConvo.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
                </div>
                <div>
                  <p className="text-sm font-bold">{activeConvo.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeConvo.contact}
                    {typing ? <span className="ml-1 text-green-600 font-medium"> · escribiendo...</span>
                      : activeConvo.online ? <span className="ml-1 text-green-600"> · En línea</span> : ''}
                  </p>
                </div>
              </div>

              {/* Admin status indicator visible to team */}
              <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold mr-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-zinc-400'}`} />
                <span className="text-muted-foreground">Tú: {isOnline ? 'online' : 'offline'}</span>
              </div>

              {/* Action buttons with labels */}
              <div className="flex gap-1">
                {CHAT_ACTIONS.map((a, i) => (
                  <button key={i} onClick={a.action} title={a.tip}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                    {a.icon}
                    <span className="hidden lg:block">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Hoy</div>
              {activeConvo.messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.from === 'admin' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: msg.from === 'admin' ? '#18181b' : activeConvo.avatar_color }}>
                    {msg.from === 'admin' ? 'AC' : activeConvo.initials}
                  </div>
                  <div className={`max-w-[70%] flex flex-col ${msg.from === 'admin' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.from === 'admin'
                        ? 'bg-foreground text-background rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      {formatRelative(msg.at)}
                      {msg.from === 'admin' && <span className="text-blue-500">✓✓</span>}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <TypingIndicator name={activeConvo.company} />
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-border flex items-center gap-2 shrink-0">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <Input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Escribe un mensaje... (Enter para enviar)"
                className="flex-1 border-0 bg-muted rounded-full px-4 focus-visible:ring-0 text-sm"
              />
              <button onClick={handleSend} disabled={!text.trim()}
                className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0">
                <Send className="w-4 h-4" />
              </button>
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

        {/* Client info panel */}
        {activeConvo && (
          <div className="w-[220px] border-l border-border overflow-y-auto shrink-0 p-4 space-y-4">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">CLIENTE</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: activeConvo.avatar_color }}>
                  {activeConvo.initials}
                </div>
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
                {clientProjects.map(p => (
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
          </div>
        )}
      </div>

      {showNew && (
        <NewConvoDialog contacts={contacts} companies={companies}
          onStart={handleNewConvo} onClose={() => setShowNew(false)} />
      )}
    </div>
  )
}
