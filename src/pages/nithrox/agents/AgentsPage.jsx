import { useState, useEffect } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  Bot, Plus, X, MessageSquare, Users, Zap, Brain,
  Settings, Trash2, ToggleLeft, ToggleRight, Send,
  ChevronRight, Loader2, Check, Globe, Copy
} from 'lucide-react'

// ── Agent types ───────────────────────────────────────────────
const AGENT_TYPES = [
  { id: 'support',    icon: MessageSquare, label: 'Soporte',       color: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500',    desc: 'Responde preguntas frecuentes del cliente' },
  { id: 'onboarding', icon: Users,         label: 'Onboarding',    color: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500',   desc: 'Guía al cliente paso a paso en el inicio' },
  { id: 'sales',      icon: Zap,           label: 'Ventas',        color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', desc: 'Califica leads y agenda reuniones' },
  { id: 'custom',     icon: Brain,         label: 'Personalizado', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', desc: 'Agente con instrucciones propias' },
]

const MODELS = [
  { id: 'claude-sonnet-4-6',           label: 'Claude Sonnet 4.6',  sub: 'Inteligente · Recomendado' },
  { id: 'claude-haiku-4-5-20251001',   label: 'Claude Haiku 4.5',   sub: 'Rápido · Económico' },
  { id: 'claude-opus-4-7',             label: 'Claude Opus 4.7',    sub: 'Máxima capacidad' },
]

const DEFAULT_INSTRUCTIONS = {
  support:    'Eres un asistente de soporte amable y profesional de Nithrox. Responde preguntas sobre el estado del proyecto, plazos y cualquier duda técnica. Sé conciso y útil. Si no sabes algo, di que lo consultarás con el equipo.',
  onboarding: 'Eres un asistente de onboarding de Nithrox. Tu objetivo es guiar al nuevo cliente por los primeros pasos: completar su perfil, entender el proceso de trabajo, conocer el portal del cliente y preparar la información necesaria para el kick-off.',
  sales:      'Eres un asistente de ventas de Nithrox. Califica leads de forma amigable, entiende sus necesidades digitales y agenda reuniones con el equipo. Sé entusiasta pero sin ser invasivo. Ofrece soluciones relevantes del catálogo de Nithrox.',
  custom:     'Eres un asistente de Nithrox. Ayuda al cliente con cualquier consulta de forma profesional y amable.',
}

const LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'pt', label: 'Português' },
]

const LS_KEY = 'ntx_agents'

function loadAgents() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveAgents(agents) {
  localStorage.setItem(LS_KEY, JSON.stringify(agents))
}

// ── Simulated chat test ───────────────────────────────────────
function TestChat({ agent, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hola, soy ${agent.name}. ¿En qué puedo ayudarte hoy?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const simulatedReplies = {
    support:    ['Entiendo tu consulta. Déjame revisar el estado de tu proyecto.', 'El equipo de Nithrox está trabajando en eso. Te confirmo en breve.', 'Puedo ayudarte con eso. ¿Puedes darme más detalles?'],
    onboarding: ['¡Bienvenido! El primer paso es completar tu perfil en el portal.', 'Para empezar necesitamos tu brief del proyecto. ¿Ya lo tienes listo?', 'El proceso tiene 4 fases: Kick-off, Diseño, Desarrollo y Publicación.'],
    sales:      ['Interesante. ¿Cuál es tu presupuesto aproximado para el proyecto?', 'Podríamos hacer una reunión de 30 minutos para entender mejor tus necesidades.', '¡Perfecto! Nithrox tiene experiencia en exactamente ese tipo de proyectos.'],
    custom:     ['Entendido. ¿Hay algo más en lo que pueda ayudarte?', 'Por supuesto, con gusto te ayudo con eso.', 'Déjame verificar esa información para darte una respuesta precisa.'],
  }

  const send = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', text: input }
    setMessages(p => [...p, userMsg])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600))
    const replies = simulatedReplies[agent.type] || simulatedReplies.custom
    const reply = replies[Math.floor(Math.random() * replies.length)]
    setMessages(p => [...p, { role: 'assistant', text: reply }])
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
              <Bot className="w-4 h-4 text-background" />
            </div>
            <div>
              <p className="text-sm font-bold">{agent.name}</p>
              <p className="text-[10px] text-muted-foreground">Vista previa del agente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-foreground text-background rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted px-3.5 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Escribiendo...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
          <button onClick={send} disabled={!input.trim() || loading}
            className="px-3 py-2 bg-foreground text-background rounded-xl hover:bg-foreground/90 disabled:opacity-40 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New agent dialog ──────────────────────────────────────────
function NewAgentDialog({ onClose, onCreate }) {
  const [step, setStep] = useState(1)
  const [type, setType] = useState('')
  const [form, setForm] = useState({ name: '', model: 'claude-sonnet-4-6', language: 'es', instructions: '', welcome_message: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const selectType = (t) => {
    setType(t)
    const def = DEFAULT_INSTRUCTIONS[t] || ''
    set('instructions', def)
    set('name', `Agente de ${AGENT_TYPES.find(x => x.id === t)?.label}`)
    set('welcome_message', `Hola 👋 Soy ${AGENT_TYPES.find(x => x.id === t)?.label.toLowerCase()} de Nithrox. ¿En qué puedo ayudarte?`)
    setStep(2)
  }

  const handleCreate = () => {
    if (!form.name.trim()) return
    onCreate({ ...form, type, active: true, id: `agent_${Date.now()}`, created_at: new Date().toISOString() })
    onClose()
    toast.success('Agente creado correctamente')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-bold text-sm">{step === 1 ? 'Tipo de agente' : 'Configurar agente'}</p>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {step === 1 && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-muted-foreground mb-4">Selecciona el tipo de agente que quieres crear</p>
            {AGENT_TYPES.map(({ id, icon: Icon, label, desc, color }) => (
              <button key={id} onClick={() => selectType(id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left hover:border-foreground/40 transition-all ${color} bg-opacity-30`}>
                <div className="w-9 h-9 bg-white/60 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs opacity-80">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nombre del agente</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mensaje de bienvenida</label>
              <input value={form.welcome_message} onChange={e => set('welcome_message', e.target.value)}
                placeholder="Lo primero que el cliente ve al abrir el chat..."
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Instrucciones del sistema</label>
              <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)}
                rows={5} className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background resize-none font-mono text-xs" />
              <p className="text-[10px] text-muted-foreground">Estas instrucciones definen el comportamiento y personalidad del agente</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Modelo</label>
                <select value={form.model} onChange={e => set('model', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background">
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Idioma</label>
                <select value={form.language} onChange={e => set('language', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background">
                  {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep(1)}
                className="flex-1 py-2.5 text-sm border border-border rounded-xl hover:bg-accent transition-colors">
                Atrás
              </button>
              <button onClick={handleCreate} disabled={!form.name.trim()}
                className="flex-1 py-2.5 text-sm font-bold bg-foreground text-background rounded-xl hover:bg-foreground/90 disabled:opacity-40 transition-colors">
                Crear agente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Edit panel ────────────────────────────────────────────────
function EditPanel({ agent, onSave, onClose }) {
  const [form, setForm] = useState({ ...agent })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const type = AGENT_TYPES.find(t => t.id === agent.type)
  const Icon = type?.icon || Bot

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[420px] z-50 bg-background border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
              <Icon className="w-4 h-4 text-background" />
            </div>
            <div>
              <p className="text-sm font-bold">{form.name}</p>
              <p className="text-xs text-muted-foreground">{type?.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
            <div>
              <p className="text-sm font-bold">Estado del agente</p>
              <p className="text-xs text-muted-foreground">{form.active ? 'Activo — visible para clientes' : 'Desactivado'}</p>
            </div>
            <button onClick={() => set('active', !form.active)}>
              {form.active
                ? <ToggleRight className="w-8 h-8 text-green-500" />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nombre</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mensaje de bienvenida</label>
            <input value={form.welcome_message || ''} onChange={e => set('welcome_message', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Instrucciones del sistema</label>
            <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)}
              rows={6} className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background resize-none font-mono text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Modelo</label>
              <select value={form.model} onChange={e => set('model', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background">
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Idioma</label>
              <select value={form.language || 'es'} onChange={e => set('language', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background">
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Embed snippet */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Script de integración</label>
            <div className="relative">
              <pre className="bg-zinc-950 text-green-400 text-[10px] font-mono p-3 rounded-xl overflow-x-auto leading-relaxed">
{`<script src="https://nithrox.com/agent.js"
  data-agent="${agent.id}"
  data-lang="${form.language || 'es'}">
</script>`}
              </pre>
              <button
                onClick={() => { navigator.clipboard?.writeText(`<script src="https://nithrox.com/agent.js" data-agent="${agent.id}" data-lang="${form.language || 'es'}"></script>`); toast.success('Copiado') }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
          <button onClick={() => { onSave(form); onClose() }}
            className="flex-1 py-2.5 text-sm font-bold bg-foreground text-background rounded-xl hover:bg-foreground/90">
            Guardar
          </button>
        </div>
      </div>
    </>
  )
}

export default function AgentsPage() {
  const [agents, setAgents] = useState(loadAgents)
  const [showNew, setShowNew] = useState(false)
  const [editAgent, setEditAgent] = useState(null)
  const [testAgent, setTestAgent] = useState(null)

  useEffect(() => { saveAgents(agents) }, [agents])

  const addAgent = (a) => setAgents(p => [a, ...p])
  const updateAgent = (id, updates) => setAgents(p => p.map(a => a.id === id ? { ...a, ...updates } : a))
  const deleteAgent = (id) => { setAgents(p => p.filter(a => a.id !== id)); toast.success('Agente eliminado') }
  const toggleAgent = (id) => setAgents(p => p.map(a => a.id === id ? { ...a, active: !a.active } : a))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="AGENTES IA" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:bg-foreground/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nuevo agente
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Info banner */}
        <div className="bg-foreground text-background rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-black text-sm">Agentes IA con Claude</h2>
            <p className="text-xs text-white/70 mt-0.5">Crea asistentes inteligentes para tus clientes. Cada agente tiene su personalidad, instrucciones y modelo. Puedes probarlo antes de publicarlo.</p>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <Bot className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm font-bold text-muted-foreground">Sin agentes todavía</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Crea tu primer agente para empezar</p>
            <button onClick={() => setShowNew(true)}
              className="px-4 py-2 text-xs font-bold bg-foreground text-background rounded-full hover:bg-foreground/90 uppercase tracking-wider">
              <Plus className="w-3 h-3 inline mr-1.5" /> Crear primer agente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map(agent => {
              const type = AGENT_TYPES.find(t => t.id === agent.type)
              const Icon = type?.icon || Bot
              return (
                <div key={agent.id} className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-foreground/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${type?.color || 'bg-muted border-border'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{type?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                      <span className="text-[10px] text-muted-foreground">{agent.active ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Modelo</p>
                    <p className="text-xs font-mono">{MODELS.find(m => m.id === agent.model)?.label || agent.model}</p>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-3">
                    {agent.instructions?.slice(0, 100)}…
                  </p>

                  <div className="flex gap-2">
                    <button onClick={() => setTestAgent(agent)}
                      className="flex-1 py-2 text-xs font-bold border border-border rounded-xl hover:bg-accent flex items-center justify-center gap-1.5 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Probar
                    </button>
                    <button onClick={() => setEditAgent(agent)}
                      className="flex-1 py-2 text-xs font-bold border border-border rounded-xl hover:bg-accent flex items-center justify-center gap-1.5 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Config
                    </button>
                    <button onClick={() => toggleAgent(agent.id)}
                      className="px-3 py-2 border border-border rounded-xl hover:bg-accent transition-colors">
                      {agent.active
                        ? <ToggleRight className="w-4 h-4 text-green-500" />
                        : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => deleteAgent(agent.id)}
                      className="px-3 py-2 border border-border rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showNew && <NewAgentDialog onClose={() => setShowNew(false)} onCreate={addAgent} />}
      {editAgent && <EditPanel agent={editAgent} onSave={(f) => updateAgent(editAgent.id, f)} onClose={() => setEditAgent(null)} />}
      {testAgent && <TestChat agent={testAgent} onClose={() => setTestAgent(null)} />}
    </div>
  )
}
