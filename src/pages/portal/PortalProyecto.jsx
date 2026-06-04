import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePortalData } from '../../hooks/usePortalData'
import { toast } from 'sonner'
import {
  CheckCircle2, Lock, Clock, ExternalLink, Send,
  MessageSquare, ThumbsUp, AlertTriangle,
  Monitor, Maximize2
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
const PHASE_ORDER = ['kickoff', 'design', 'development', 'publication']
const PHASE_PCT   = { kickoff: 10, design: 40, development: 40, publication: 10 }

const PHASE_DEFS = [
  {
    id: 'kickoff', label: 'Kick-off', icon: '🚀',
    items: ['Contrato firmado', 'Pago inicial recibido', 'Brief completado', 'Reunión de inicio'],
  },
  {
    id: 'design', label: 'Diseño', icon: '🎨',
    items: ['Wireframes', 'Diseño mobile', 'Diseño desktop', 'Aprobación del cliente'],
  },
  {
    id: 'development', label: 'Desarrollo', icon: '💻',
    items: ['Maquetado', 'Funcionalidades', 'Pruebas', 'Staging review'],
  },
  {
    id: 'publication', label: 'Publicación', icon: '🎉',
    items: ['Dominio configurado', 'SEO básico', 'Analytics', 'Lanzamiento'],
  },
]

function figmaEmbedUrl(url) {
  if (!url) return null
  if (url.includes('figma.com/embed')) return url
  return `https://www.figma.com/embed?embed_host=nithrox&url=${encodeURIComponent(url)}`
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
}

// ── Phase comments ─────────────────────────────────────────────
function PhaseComments({ phaseKey, project, addPhaseComment, clientName }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()

  const comments = project?.phases?.[phaseKey]?.comments || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await addPhaseComment(phaseKey, text.trim(), clientName || 'Cliente')
      setText('')
    } catch {
      toast.error('No se pudo enviar el comentario')
    } finally {
      setSending(false)
    }
  }

  // Group by date
  const grouped = comments.reduce((acc, c) => {
    const key = fmtDate(c.at)
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="flex flex-col bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden" style={{ height: 340 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-200 bg-white shrink-0">
        <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
        <p className="text-xs font-bold text-zinc-700">Comentarios con el equipo</p>
        {comments.length > 0 && (
          <span className="ml-auto text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full font-medium">
            {comments.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {comments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
            <MessageSquare className="w-6 h-6 opacity-30" />
            <p className="text-xs">Sin comentarios aún. ¡Sé el primero!</p>
          </div>
        )}
        {Object.entries(grouped).map(([date, cms]) => (
          <div key={date}>
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="text-[10px] text-zinc-400 font-medium shrink-0">{date}</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>
            <div className="space-y-2.5">
              {cms.map(c => {
                const isClient = !!c.fromClient
                return (
                  <div key={c.id} className={`flex gap-2 ${isClient ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 self-end ${isClient ? 'bg-zinc-700' : 'bg-zinc-900'}`}>
                      {isClient ? (clientName?.[0]?.toUpperCase() || 'C') : 'NX'}
                    </div>
                    <div className={`max-w-[80%] flex flex-col ${isClient ? 'items-end' : 'items-start'}`}>
                      <p className="text-[10px] text-zinc-400 mb-0.5 px-1">
                        {isClient ? (clientName || 'Tú') : 'Nithrox'}
                      </p>
                      <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                        ${isClient
                          ? 'bg-zinc-900 text-white rounded-tr-sm'
                          : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm'}`}>
                        {c.text}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 px-1">{fmtTime(c.at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-zinc-200 bg-white shrink-0 flex gap-2 items-center">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Escribe un comentario..."
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs outline-none focus:border-zinc-400 transition-colors"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-8 h-8 bg-zinc-900 text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-zinc-700 transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Figma embed ───────────────────────────────────────────────
function FigmaEmbed({ url }) {
  const [expanded, setExpanded] = useState(false)
  const embedSrc = figmaEmbedUrl(url)

  if (!embedSrc) return null

  return (
    <div className={`bg-white border border-zinc-200 rounded-2xl overflow-hidden transition-all ${expanded ? 'fixed inset-4 z-50 shadow-2xl flex flex-col' : ''}`}
      style={expanded ? {} : { height: 380 }}>
      {/* Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 bg-zinc-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-bold text-zinc-700">Vista previa del diseño</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors font-medium">
            <ExternalLink className="w-3 h-3" /> Abrir en Figma
          </a>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {expanded && (
            <button onClick={() => setExpanded(false)}
              className="text-[10px] text-zinc-400 hover:text-zinc-700 font-medium ml-1">✕</button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src={embedSrc}
          className="w-full h-full border-0"
          allowFullScreen
          title="Figma Preview"
        />
      </div>
    </div>
  )
}

// ── Staging embed ──────────────────────────────────────────────
function StagingEmbed({ url }) {
  const [expanded, setExpanded] = useState(false)

  if (!url) return null

  return (
    <div className={`bg-white border border-zinc-200 rounded-2xl overflow-hidden transition-all ${expanded ? 'fixed inset-4 z-50 shadow-2xl flex flex-col' : ''}`}
      style={expanded ? {} : { height: 380 }}>
      {/* Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 bg-zinc-50 shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] bg-zinc-200 text-zinc-600 font-mono px-2 py-0.5 rounded-full truncate max-w-[200px]">{url}</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-600 font-medium">En vivo</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors font-medium">
            <ExternalLink className="w-3 h-3" /> Abrir
          </a>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {expanded && (
            <button onClick={() => setExpanded(false)}
              className="text-[10px] text-zinc-400 hover:text-zinc-700 font-medium ml-1">✕</button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title="Staging Preview"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>
    </div>
  )
}

// ── Checklist ─────────────────────────────────────────────────
function Checklist({ items, phaseStatus }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
      {items.map((item, i) => {
        const done = phaseStatus === 'approved' || (phaseStatus === 'in_progress' && i < 2)
        return (
          <div key={item}
            className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0">
            {done
              ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              : phaseStatus === 'locked'
                ? <Lock className="w-4 h-4 text-zinc-300 shrink-0" />
                : <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
            <span className={`text-sm ${done ? 'text-zinc-800' : 'text-zinc-400'}`}>{item}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function PortalProyecto() {
  const { profile, user } = useAuth()
  const { project, loading, addPhaseComment, updatePhaseStatus } = usePortalData(
    profile?.contact_id,
    user?.id,
  )

  const [activePhase, setActivePhase] = useState('design')
  const [approving, setApproving] = useState(false)

  // Derive phase statuses
  const phases   = project?.phases || {}
  const phaseDef = PHASE_DEFS.find(p => p.id === activePhase)
  const phaseData = phases[activePhase] || {}
  const phaseStatus = phaseData.status || 'locked'

  // Overall progress
  const overallPct = Math.round(
    PHASE_ORDER.reduce((sum, key) => {
      const st = phases[key]?.status
      if (st === 'approved')    return sum + PHASE_PCT[key]
      if (st === 'in_progress') return sum + PHASE_PCT[key] * 0.5
      return sum
    }, 0)
  )

  const handleApprove = async () => {
    setApproving(true)
    try {
      await updatePhaseStatus(activePhase, 'approved')
      toast.success('¡Fase aprobada! Gracias por tu feedback.')
    } catch {
      toast.error('No se pudo actualizar el estado')
    } finally {
      setApproving(false)
    }
  }

  const handleRequestChanges = async () => {
    setApproving(true)
    try {
      await addPhaseComment(activePhase, '🔄 El cliente solicitó cambios en esta fase.', profile?.name || 'Cliente')
      toast.success('Solicitud enviada. El equipo la revisará pronto.')
    } catch {
      toast.error('Error al enviar solicitud')
    } finally {
      setApproving(false)
    }
  }

  const STATUS_CONFIG = {
    approved:    { label: 'Completada',  bg: 'bg-green-50 border-green-200 text-green-700',  dot: 'bg-green-500' },
    in_progress: { label: 'En progreso', bg: 'bg-blue-50 border-blue-200 text-blue-700',     dot: 'bg-blue-500' },
    locked:      { label: 'Pendiente',   bg: 'bg-zinc-50 border-zinc-200 text-zinc-400',     dot: 'bg-zinc-300' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        Cargando proyecto...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm font-bold text-zinc-700 mb-1">Sin proyecto activo</p>
          <p className="text-xs text-zinc-400">Cuando tu proyecto comience, verás todo el progreso aquí.</p>
        </div>
      </div>
    )
  }

  const stConf = STATUS_CONFIG[phaseStatus] || STATUS_CONFIG.locked

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TU PROYECTO</p>
        <h1 className="text-xl font-bold mt-0.5">{project.name || 'Mi proyecto'}</h1>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-semibold text-zinc-500">Progreso general</p>
          <p className="text-lg font-black">{overallPct}%</p>
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-900 rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%` }} />
        </div>
        <div className="flex justify-between mt-2.5">
          {PHASE_DEFS.map(ph => {
            const st = phases[ph.id]?.status || 'locked'
            return (
              <div key={ph.id} className="flex flex-col items-center gap-0.5">
                <div className={`w-2 h-2 rounded-full transition-colors
                  ${st === 'approved' ? 'bg-green-500' : st === 'in_progress' ? 'bg-blue-500' : 'bg-zinc-200'}`} />
                <p className="text-[9px] text-zinc-400 font-medium">{ph.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PHASE_DEFS.map(ph => {
          const st = phases[ph.id]?.status || 'locked'
          const isActive = activePhase === ph.id
          return (
            <button key={ph.id} onClick={() => setActivePhase(ph.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all
                ${isActive ? 'bg-zinc-900 text-white border-zinc-900' :
                  st === 'approved'    ? 'bg-green-50 text-green-700 border-green-200 hover:border-green-400' :
                  st === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400' :
                  'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
              {ph.icon} {ph.label}
              {st === 'approved' && !isActive && <CheckCircle2 className="w-3 h-3 text-green-500" />}
            </button>
          )
        })}
      </div>

      {/* Phase content */}
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-700">{phaseDef?.icon} {phaseDef?.label}</h2>
          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${stConf.bg}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${stConf.dot}`} />
            {stConf.label}
          </span>
        </div>

        {/* ── FIGMA EMBED (Design phase) ── */}
        {activePhase === 'design' && phaseData.figma_url && (
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">🎨 Diseño para revisar</p>
            <FigmaEmbed url={phaseData.figma_url} />
          </div>
        )}

        {activePhase === 'design' && !phaseData.figma_url && phaseStatus === 'in_progress' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-blue-700">El equipo aún no ha subido el diseño. Te notificaremos cuando esté listo.</p>
          </div>
        )}

        {/* ── STAGING EMBED (Development phase) ── */}
        {activePhase === 'development' && phaseData.staging_url && (
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">💻 Vista previa en desarrollo</p>
            <StagingEmbed url={phaseData.staging_url} />
          </div>
        )}

        {activePhase === 'development' && !phaseData.staging_url && phaseStatus === 'in_progress' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-blue-700">La URL de staging estará disponible cuando el equipo la suba.</p>
          </div>
        )}

        {/* ── PUBLICATION: domain link ── */}
        {activePhase === 'publication' && phaseData.domain && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-800 mb-0.5">🌐 Tu sitio está en línea</p>
              <p className="text-sm font-bold text-green-900">{phaseData.domain}</p>
            </div>
            <a href={`https://${phaseData.domain}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white text-xs font-bold rounded-xl hover:bg-green-800 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Ver sitio
            </a>
          </div>
        )}

        {/* Checklist */}
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Checklist de la fase</p>
          <Checklist items={phaseDef?.items || []} phaseStatus={phaseStatus} />
        </div>

        {/* ── APPROVAL (active phases) ── */}
        {phaseStatus === 'in_progress' && (activePhase === 'design' || activePhase === 'development') && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900">Se necesita tu aprobación</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  {activePhase === 'design'
                    ? '¿El diseño cumple tus expectativas? Tu aprobación permite que pasemos a desarrollo.'
                    : '¿El sitio funciona correctamente? Tu aprobación permite la publicación.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" />
                {approving ? 'Guardando...' : 'Aprobar'}
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={approving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-blue-300 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
                Solicitar cambios
              </button>
            </div>
          </div>
        )}

        {phaseStatus === 'locked' && (
          <div className="text-center py-6 text-xs text-zinc-400">
            🔒 Esta fase se desbloqueará cuando completes las anteriores.
          </div>
        )}

        {phaseStatus === 'approved' && (
          <div className="flex items-center gap-2.5 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">Esta fase está completada. ¡Buen trabajo!</p>
          </div>
        )}

        {/* ── COMMENTS (design & development) ── */}
        {(activePhase === 'design' || activePhase === 'development') && (
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Comentarios</p>
            <PhaseComments
              phaseKey={activePhase}
              project={project}
              addPhaseComment={addPhaseComment}
              clientName={profile?.name || 'Cliente'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
