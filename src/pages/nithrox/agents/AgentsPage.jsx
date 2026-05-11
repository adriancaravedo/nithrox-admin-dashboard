import Topbar from '../../../components/layout/Topbar'
import { Bot, Plus, Zap, Users, MessageSquare, Brain } from 'lucide-react'

const AGENT_TYPES = [
  { id: 'support', icon: MessageSquare, label: 'Soporte', desc: 'Responde preguntas frecuentes del cliente automáticamente', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'onboarding', icon: Users, label: 'Onboarding', desc: 'Guía al cliente paso a paso en el inicio del proyecto', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'sales', icon: Zap, label: 'Ventas', desc: 'Califica leads y programa reuniones automáticamente', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'custom', icon: Brain, label: 'Personalizado', desc: 'Crea un agente con instrucciones y personalidad propia', color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

export default function AgentsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="AGENTES IA" actions={
        <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:bg-foreground/90 uppercase tracking-wider opacity-50 cursor-not-allowed">
          <Plus className="w-3.5 h-3.5" /> Nuevo agente
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Coming soon banner */}
        <div className="bg-foreground text-background rounded-2xl p-6 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base">Agentes IA — En desarrollo</h2>
            <p className="text-sm text-white/70 mt-0.5">Crea asistentes IA personalizados para tus clientes. Cada agente puede manejar soporte, onboarding, ventas y más — con tu voz y personalidad.</p>
          </div>
        </div>

        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Tipos de agente disponibles</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENT_TYPES.map(({ id, icon: Icon, label, desc, color }) => (
            <div key={id} className={`border rounded-2xl p-5 ${color} opacity-70`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-white/60 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs mt-0.5 opacity-80">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-dashed border-border rounded-2xl p-8 text-center">
          <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-bold text-muted-foreground">No tienes agentes configurados</p>
          <p className="text-xs text-muted-foreground mt-1">Esta sección estará disponible próximamente. Podrás crear agentes IA con Claude que interactúen con tus clientes en el portal.</p>
        </div>
      </div>
    </div>
  )
}
