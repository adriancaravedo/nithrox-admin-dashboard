import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  Calendar, UserCircle, FileText, Phone,
  Trash2, Settings2, Play, Pause, Download, Check, CheckCheck,
  Volume2, File as FileIcon, Camera, Clock, Link as LinkIcon,
  AlertTriangle, Save, User, MessageCircle
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
function fmtDur(sec) {
  const s = Math.floor(sec || 0)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(blob)
})

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
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${invert ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-foreground/10 hover:bg-foreground/20'}`}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div className={`flex-1 h-1.5 ${invert ? 'bg-white/20' : 'bg-foreground/10'} rounded-full cursor-pointer relative`}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          if (audioRef.current) audioRef.current.currentTime = pct * (duration || audioRef.current.duration || 0)
        }}>
        <div className={`absolute top-0 left-0 h-full ${invert ? 'bg-white/60' : 'bg-foreground/50'} rounded-full transition-all`}
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }} />
      </div>
      <span className={`text-[10px] shrink-0 ${invert ? 'text-white/60' : 'text-muted-foreground'}`}>
        {fmtDur(playing ? current : duration)}
      </span>
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────────
function MessageBubble({ msg, isFromAdmin, convo, onDelete, adminName, adminAvatar }) {
  const [hover, setHover] = useState(false)
  const isDeleted = !!msg.deleted_at
  const isVoice = msg.is_voice_note
  const isImage = msg.attachment_type?.startsWith('image/')
  const hasFile = !!msg.attachment_url && !isVoice
  const isMeeting = msg.text?.startsWith('📅')

  return (
    <div className={`flex gap-2.5 group ${isFromAdmin ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 self-end mb-4 overflow-hidden"
        style={{ backgroundColor: isFromAdmin ? '#18181b' : convo.avatar_color }}>
        {isFromAdmin
          ? (adminAvatar ? <img src={adminAvatar} className="w-full h-full object-cover" /> : (adminName?.[0] || 'A'))
          : convo.initials}
      </div>

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
            <a href={msg.attachment_url} download={msg.attachment_name}
              className="flex items-center gap-2 hover:opacity-80">
              <FileIcon className="w-4 h-4 shrink-0" />
              <span className="text-xs truncate max-w-[150px]">{msg.attachment_name || msg.text}</span>
              <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
            </a>
          </div>
        ) : isMeeting ? (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line border ${
            isFromAdmin ? 'bg-foreground text-background rounded-tr-sm border-foreground/20' : 'bg-blue-50 border-blue-200 rounded-tl-sm text-blue-900'
          }`}>
            {msg.text}
          </div>
        ) : (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isFromAdmin ? 'bg-foreground text-background rounded-tr-sm' : 'bg-muted rounded-tl-sm'
          }`}>
            {msg.text}
          </div>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{formatRelative(msg.at)}</span>
          {isFromAdmin && !isDeleted && (
            msg.read_at
              ? <CheckCheck className="w-3 h-3 text-blue-500" />
              : <Check className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </div>

      {onDelete && !isDeleted && hover && (
        <button onClick={() => onDelete(msg.id)} title="Eliminar"
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
        style={{ backgroundColor: color || '#64748b' }}>{name?.[0] || 'C'}</div>
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
function NewConvoDialog({ contacts, companies, onStart, onClose, preContactId }) {
  const [search, setSearch] = useState('')
  const filtered = contacts.filter(c =>
    // If pre-filtered by contactId, show only that contact
    (preContactId ? c.id === preContactId : true) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()))
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contacto..." autoFocus
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

// ── Meeting Popup ─────────────────────────────────────────────
function MeetingPopup({ convo, contacts, onSend, onClose }) {
  const contact = contacts.find(c => c.company_id === convo?.company_id || c.id === convo?.contact_id)
  const [form, setForm] = useState({
    title: '', date: '', time: '10:00', duration_min: 60, link: '', notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title || !form.date) { toast.error('Completa título y fecha'); return }
    onSend(form, contact)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <h3 className="text-sm font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Agendar reunión</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Título *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Reunión de kickoff..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Fecha *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Hora</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Duración (min)</label>
              <select value={form.duration_min} onChange={e => set('duration_min', Number(e.target.value))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
                {[30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Link (Meet/Zoom)</label>
              <input value={form.link} onChange={e => set('link', e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="Agenda de la reunión..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
          </div>
          {contact && (
            <p className="text-[10px] text-muted-foreground">Se enviará a <span className="font-medium">{contact.name}</span> en el chat y al portal del cliente.</p>
          )}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">Confirmar reunión</button>
        </div>
      </div>
    </div>
  )
}

// ── Client Info Popup ─────────────────────────────────────────
function ClientInfoPopup({ convo, contacts, companies, onClose }) {
  const contact = contacts.find(c => c.company_id === convo?.company_id || c.id === convo?.contact_id)
  const company = companies.find(c => c.id === convo?.company_id)
  if (!contact) return null
  const rows = [
    { label: 'Email', val: contact.email },
    { label: 'Teléfono', val: contact.phone },
    { label: 'Cargo', val: contact.role },
    { label: 'Lead Status', val: contact.lead_status },
    { label: 'Canal', val: contact.preferred_channels },
    { label: 'Empresa', val: company?.name },
    { label: 'RUC', val: company?.ruc },
    { label: 'Industria', val: company?.industry },
  ].filter(r => r.val)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <h3 className="text-sm font-bold flex items-center gap-2"><UserCircle className="w-4 h-4" /> Ficha del cliente</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: contact.avatar_color || '#64748b' }}>
              {getInitials(contact.name)}
            </div>
            <div>
              <p className="font-bold">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{company?.name || '—'}</p>
            </div>
          </div>
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.label} className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground text-xs shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-right">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Contract Popup ────────────────────────────────────────────
function ContractPopup({ convo, contracts, onClose }) {
  const convContracts = contracts.filter(c => c.company_id === convo?.company_id || c.contact_id === convo?.contact_id)
  const STATUS = { draft: 'Borrador', sent: 'Enviado', signed: 'Firmado', expired: 'Vencido' }
  const STATUS_COLOR = { draft: 'text-muted-foreground', sent: 'text-blue-600', signed: 'text-green-600', expired: 'text-red-500' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <h3 className="text-sm font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Contratos</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {convContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin contratos asociados</p>
          ) : convContracts.map(c => (
            <div key={c.id} className="border border-border rounded-lg p-3 mb-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{c.name}</p>
                <span className={`text-[10px] font-bold ${STATUS_COLOR[c.status] || ''}`}>{STATUS[c.status] || c.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{c.party_type}</p>
              {c.expiry_date && <p className="text-[10px] text-muted-foreground mt-1">Vence: {c.expiry_date}</p>}
              {c.pdf_url && (
                <a href={c.pdf_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-1.5">
                  <Download className="w-3 h-3" /> Ver PDF
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Settings Panel ────────────────────────────────────────────
function SettingsPanel({ convo, onToggle, onClose, chatSettings, onSaveSettings, onDeleteConversation }) {
  const [tab, setTab] = useState('profile')
  const [settings, setSettings] = useState(chatSettings)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const avatarInputRef = useRef()
  const setSetting = (k, v) => setSettings(s => ({ ...s, [k]: v }))

  useEffect(() => { setSettings(chatSettings) }, [chatSettings])

  const handleSave = () => {
    onSaveSettings(settings)
    toast.success('Configuración guardada')
  }

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagen muy grande. Máximo 2MB'); return }
    const dataUrl = await fileToDataUrl(file)
    setSetting('avatar_url', dataUrl)
  }

  const TABS = [
    { id: 'profile', label: 'Perfil' },
    { id: 'chat', label: 'Chat' },
    { id: 'perms', label: 'Permisos' },
  ]

  return (
    <div className="w-[260px] border-l border-border flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <p className="text-xs font-bold uppercase tracking-widest">Configuración</p>
        <button onClick={onClose}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${tab === t.id ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Tu perfil en el chat</p>
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-sm overflow-hidden cursor-pointer relative"
                  onClick={() => avatarInputRef.current?.click()}>
                  {settings.avatar_url
                    ? <img src={settings.avatar_url} className="w-full h-full object-cover" />
                    : <span>{settings.display_name?.[0] || 'A'}</span>}
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium">{settings.display_name || 'Admin'}</p>
                  <p className="text-[10px] text-muted-foreground">Click en foto para cambiar</p>
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Nombre visible</label>
                  <input value={settings.display_name || ''} onChange={e => setSetting('display_name', e.target.value)}
                    placeholder="Adrian Caravedo"
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Cargo / Rol</label>
                  <input value={settings.role || ''} onChange={e => setSetting('role', e.target.value)}
                    placeholder="CEO · Nithrox"
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <button onClick={handleSave}
              className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 flex items-center justify-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Guardar perfil
            </button>
          </>
        )}

        {/* ── Chat tab ── */}
        {tab === 'chat' && (
          <>
            <div className="space-y-3">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Configuración global del chat</p>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Mensaje de bienvenida</label>
                <textarea value={settings.welcome_message || ''} onChange={e => setSetting('welcome_message', e.target.value)} rows={2}
                  placeholder="Hola! ¿En qué puedo ayudarte?"
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Tiempo de respuesta estimado</label>
                <input value={settings.response_time || ''} onChange={e => setSetting('response_time', e.target.value)}
                  placeholder="Responde en menos de 1 hora"
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Horario de atención</label>
                <input value={settings.business_hours || ''} onChange={e => setSetting('business_hours', e.target.value)}
                  placeholder="Lun-Vie, 9am - 6pm"
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Auto-respuesta</p>
                  <p className="text-[10px] text-muted-foreground">Respuesta automática fuera de horario</p>
                </div>
                <button onClick={() => setSetting('auto_reply', !settings.auto_reply)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${settings.auto_reply ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.auto_reply ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {settings.auto_reply && (
                <textarea value={settings.auto_reply_message || ''} onChange={e => setSetting('auto_reply_message', e.target.value)} rows={2}
                  placeholder="Gracias por contactarnos. Te responderemos en horario de atención."
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary resize-none" />
              )}
            </div>
            <button onClick={handleSave}
              className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 flex items-center justify-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Guardar
            </button>
          </>
        )}

        {/* ── Permissions tab ── */}
        {tab === 'perms' && convo && (
          <>
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

            {/* Danger zone */}
            <div className="border-t border-border pt-4">
              <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-3">Zona peligrosa</p>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="w-full py-2 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar conversación
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-700">Se eliminarán todos los mensajes. Esta acción no se puede deshacer.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-1.5 text-xs border border-border rounded-lg hover:bg-accent">Cancelar</button>
                    <button onClick={() => { onDeleteConversation(); setConfirmDelete(false) }}
                      className="flex-1 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold">Eliminar</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function MessagesPage() {
  const {
    messages, sendMessage, markRead, createConversation,
    deleteMessage: storeDeleteMsg, updateConversationSettings, updateMessageReadAt,
    appendRealtimeMessage, fetchAndAppendConversation, deleteConversation,
    companies, contacts, deals, projects, contracts,
    chatSettings, fetchChatSettings, saveChatSettings,
    addMeeting, user: storeUser,
  } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [active, setActive] = useState(null)
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [isOnline, setIsOnline] = useState(localStorage.getItem('ntx_admin_online') !== '0')
  const [typing, setTyping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recDuration, setRecDuration] = useState(0)
  const [popup, setPopup] = useState(null) // 'meeting' | 'ficha' | 'contrato'

  const bottomRef = useRef()
  const fileInputRef = useRef()
  const typingTimerRef = useRef()
  const typingChannelRef = useRef()
  const recorderRef = useRef()
  const recTimerRef = useRef()
  const activeRef = useRef(active)

  useEffect(() => { activeRef.current = active }, [active])
  useEffect(() => { fetchChatSettings() }, [])

  // Auto-select conversation by contactId URL param (e.g. from ContactDetail)
  useEffect(() => {
    const contactId = searchParams.get('contactId')
    if (contactId) {
      const conv = messages.find(m => m.contact_id === contactId)
      if (conv) { setActive(conv.id); return }
      // No conversation yet — open new convo dialog
      if (messages.length > 0 || contacts.length > 0) setShowNew(true)
      return
    }
    if (!active && messages.length > 0) setActive(messages[0].id)
  }, [messages.length, searchParams])

  const activeConvo = messages.find(m => m.id === active)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active, activeConvo?.messages?.length])

  // Global Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-global-msgs-v2')
      // New message from client
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        if (msg.from_role !== 'client') return
        appendRealtimeMessage(msg.conversation_id, msg)
        if (msg.conversation_id === activeRef.current) db.messages.markClientRead(msg.conversation_id)
      })
      // Read receipt updates
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        if (msg.read_at && msg.from_role === 'admin') updateMessageReadAt(msg.conversation_id, msg.id, msg.read_at)
      })
      // New conversation initiated by client
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, async (payload) => {
        await fetchAndAppendConversation(payload.new.id)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // Per-conversation typing channel
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
    db.messages.markClientRead(active)
    markRead(active)
    return () => {
      supabase.removeChannel(channel)
      clearTimeout(typingTimerRef.current)
    }
  }, [active])

  const handleSelect = (id) => { setActive(id); setTyping(false); setPopup(null) }
  const handleTextChange = (val) => {
    setText(val)
    typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { role: 'admin' } })
  }
  const handleSend = async () => {
    if (!text.trim() || !active) return
    const msg = text.trim(); setText('')
    await sendMessage(active, msg, user?.id, 'admin')
  }
  const handleNewConvo = async (contact, company) => {
    // Check by contact_id first, then by company_id
    const existing = messages.find(m =>
      m.contact_id === contact.id ||
      (contact.company_id && m.company_id === contact.company_id)
    )
    if (existing) { setActive(existing.id); setShowNew(false); return }
    const conv = await createConversation(contact, company)
    if (conv) setActive(conv.id)
    setShowNew(false)
  }

  // File attachment — base64
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !active) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB por archivo'); e.target.value = ''; return }
    try {
      const dataUrl = await fileToDataUrl(file)
      await sendMessage(active, file.name, user?.id, 'admin', {
        attachment_url: dataUrl,
        attachment_name: file.name,
        attachment_type: file.type,
      })
    } catch { toast.error('Error procesando archivo') }
    e.target.value = ''
  }

  // Voice note — base64
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
        if (blob.size > 5 * 1024 * 1024) { toast.error('Nota de voz muy larga (máx ~5 min)'); setRecording(false); setRecDuration(0); return }
        try {
          const dataUrl = await blobToDataUrl(blob)
          await sendMessage(active, '🎤 Nota de voz', user?.id, 'admin', {
            attachment_url: dataUrl,
            attachment_type: 'audio/webm',
            is_voice_note: true,
            duration_sec: dur,
          })
        } catch { toast.error('Error enviando nota de voz') }
        setRecording(false); setRecDuration(0)
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      recTimerRef.current = setInterval(() => { dur += 1; setRecDuration(dur) }, 1000)
    } catch { toast.error('No se puede acceder al micrófono') }
  }
  const stopRecording = () => recorderRef.current?.stop()
  const cancelRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.ondataavailable = null
      recorderRef.current.onstop = () => { clearInterval(recTimerRef.current); setRecording(false); setRecDuration(0) }
      recorderRef.current.stop()
    }
  }

  const handleDelete = async (msgId) => storeDeleteMsg(msgId, user?.id, active)

  const handleToggleSetting = async (key) => updateConversationSettings(active, { [key]: !activeConvo?.[key] })

  const handleDeleteConversation = async () => {
    await deleteConversation(active)
    setActive(null)
    setShowSettings(false)
  }

  // Meeting: save + send message
  const handleMeetingSubmit = async (form, contact) => {
    if (!active || !activeConvo) return
    const meetingData = {
      title: form.title,
      date: form.date,
      time: form.time,
      duration_min: form.duration_min,
      link: form.link || null,
      notes: form.notes || null,
      contact_id: contact?.id || activeConvo.contact_id || null,
      company_id: activeConvo.company_id || null,
      conversation_id: active,
      status: 'pending',
    }
    const meeting = await addMeeting(meetingData)
    const adminName = chatSettings.display_name || 'Nithrox'
    const dateStr = new Date(form.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const msgText = `📅 Reunión confirmada\n📌 ${form.title}\n📆 ${dateStr} · ${form.time || ''}\n⏱ ${form.duration_min} minutos${form.link ? `\n🔗 ${form.link}` : ''}${form.notes ? `\n📝 ${form.notes}` : ''}\n\n✅ Confirma tu asistencia en el portal del cliente`
    await sendMessage(active, msgText, user?.id, 'admin')
    toast.success('Reunión agendada y confirmación enviada')
  }

  const filtered = messages.filter(m =>
    m.company.toLowerCase().includes(search.toLowerCase()) ||
    m.contact.toLowerCase().includes(search.toLowerCase())
  )

  const clientContact = contacts.find(c => c.company_id === activeConvo?.company_id || c.id === activeConvo?.contact_id)
  const clientProjects = activeConvo ? projects.filter(p => p.company_id === activeConvo.company_id && !p._deleted) : []
  const clientDeals = activeConvo ? deals.filter(d => d.company_id === activeConvo.company_id) : []
  const adminName = chatSettings.display_name || 'Admin'
  const adminAvatar = chatSettings.avatar_url || null

  const CHAT_ACTIONS = [
    { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Reunión', action: () => setPopup('meeting') },
    { icon: <UserCircle className="w-3.5 h-3.5" />, label: 'Ficha', action: () => setPopup('ficha') },
    { icon: <FileText className="w-3.5 h-3.5" />, label: 'Contrato', action: () => setPopup('contrato') },
    { icon: <Phone className="w-3.5 h-3.5" />, label: 'Llamar', action: () => { if (clientContact?.phone) window.location.href = `tel:${clientContact.phone}`; else toast.error('Sin número registrado') } },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="MENSAJES" actions={
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const next = !isOnline; setIsOnline(next)
            localStorage.setItem('ntx_admin_online', next ? '1' : '0')
            toast.success(next ? 'Ahora apareces como online' : 'Ahora apareces como offline')
          }} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${isOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5" /> Nueva conversación
          </button>
        </div>
      } />

      <div className="flex-1 overflow-hidden p-4">
      <div className="h-full rounded-xl border border-border bg-background overflow-hidden shadow-sm flex">
        {/* Sidebar */}
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
            {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">Sin conversaciones</div>}
          </div>
        </div>

        {/* Chat area */}
        {activeConvo ? (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: activeConvo.avatar_color }}>{activeConvo.initials}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{activeConvo.company}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeConvo.contact}{typing && <span className="ml-1 text-green-600 font-medium"> · escribiendo...</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {CHAT_ACTIONS.map((a, i) => (
                  <button key={i} onClick={a.action} title={a.label}
                    className="flex items-center gap-1 px-2 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                    {a.icon}
                    <span className="hidden lg:block">{a.label}</span>
                  </button>
                ))}
                <button onClick={() => setShowSettings(s => !s)} title="Configuración"
                  className={`flex items-center gap-1 px-2 py-1.5 border rounded-lg transition-colors text-[10px] font-bold ${showSettings ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-accent text-muted-foreground'}`}>
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeConvo.messages.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">No hay mensajes aún</div>}
              {activeConvo.messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isFromAdmin={msg.from === 'admin'}
                  convo={activeConvo} onDelete={handleDelete}
                  adminName={adminName} adminAvatar={adminAvatar} />
              ))}
              {typing && <TypingIndicator name={activeConvo.contact} color={activeConvo.avatar_color} />}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-border shrink-0">
              {recording ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-sm font-mono text-red-600 font-bold">{fmtDur(recDuration)}</span>
                  <span className="text-xs text-muted-foreground flex-1">Grabando nota de voz...</span>
                  <button onClick={cancelRecording} className="px-3 py-1.5 text-xs border border-border rounded-full hover:bg-accent text-muted-foreground">Cancelar</button>
                  <button onClick={stopRecording} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-foreground text-background rounded-full hover:bg-foreground/90">
                    <Square className="w-3 h-3 fill-current" /> Enviar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                  <button onClick={() => fileInputRef.current?.click()} title="Adjuntar archivo (máx 5MB)"
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button onClick={startRecording} title="Nota de voz"
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <Mic className="w-4 h-4" />
                  </button>
                  <Input value={text} onChange={e => handleTextChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border-0 bg-muted rounded-full px-4 focus-visible:ring-0 text-sm" />
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

        {/* Right panel */}
        {activeConvo && (
          showSettings ? (
            <SettingsPanel convo={activeConvo} onToggle={handleToggleSetting} onClose={() => setShowSettings(false)}
              chatSettings={chatSettings} onSaveSettings={saveChatSettings}
              onDeleteConversation={handleDeleteConversation} />
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
                    <div key={p.id} className="border border-border rounded-lg p-2 mb-1.5 cursor-pointer hover:bg-accent/50"
                      onClick={() => navigate(`/projects/${p.id}`)}>
                      <p className="text-[10px] font-bold truncate">{p.name}</p>
                      <p className="text-[9px] text-muted-foreground">{p.phase}</p>
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
              <div className="border-t border-border pt-3">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">PERMISOS</p>
                <div className="space-y-1">
                  {[['allow_attachments','Archivos'],['allow_voice_notes','Voz']].map(([key,label]) => (
                    <div key={key} className="flex items-center gap-1.5 text-[10px]">
                      <div className={`w-1.5 h-1.5 rounded-full ${activeConvo[key] ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                      <span className="text-muted-foreground">{label} {activeConvo[key] ? 'permitido' : 'bloqueado'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
      </div>

      {/* Popups */}
      {showNew && <NewConvoDialog contacts={contacts} companies={companies} onStart={handleNewConvo} onClose={() => setShowNew(false)} preContactId={searchParams.get('contactId')} />}
      {popup === 'meeting' && <MeetingPopup convo={activeConvo} contacts={contacts} onSend={handleMeetingSubmit} onClose={() => setPopup(null)} />}
      {popup === 'ficha' && <ClientInfoPopup convo={activeConvo} contacts={contacts} companies={companies} onClose={() => setPopup(null)} />}
      {popup === 'contrato' && <ContractPopup convo={activeConvo} contracts={contracts || []} onClose={() => setPopup(null)} />}
    </div>
  )
}
