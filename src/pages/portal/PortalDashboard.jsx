import { useAuth } from '../../context/AuthContext'
import { FolderKanban, CreditCard, MessageSquare, FileText, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const DEMO_PROJECT = {
  name: 'Sitio web corporativo',
  phase: 'design',
  phases: {
    kickoff:     { label: 'Kick-off',    pct: 10, done: true,  paid: true },
    design:      { label: 'Diseño',      pct: 40, done: false, paid: false, in_progress: true },
    development: { label: 'Desarrollo',  pct: 40, done: false, paid: false },
    publication: { label: 'Publicación', pct: 10, done: false, paid: false },
  },
  value: 5000,
  currency: 'USD',
}

function greet(name) {
  const h = new Date().getHours()
  const gr = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
  return `${gr}, ${name?.split(' ')[0] || 'Cliente'} 👋`
}

export default function PortalDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const phases = Object.values(DEMO_PROJECT.phases)
  const done = phases.filter(p => p.done).length
  const pct = Math.round((done / phases.length) * 100)
  const totalPaid = phases.filter(p => p.paid).reduce((s, p) => s + DEMO_PROJECT.value * p.pct / 100, 0)

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold">{greet(profile?.name)}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Alert — payment pending */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">Pago pendiente — Diseño</p>
          <p className="text-xs text-amber-700 mt-0.5">Para continuar con tu proyecto necesitamos el pago de $2,000 (40%)</p>
        </div>
        <button onClick={() => navigate('/portal/pagos')}
          className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-xl hover:bg-amber-700 transition-colors shrink-0">
          Ver →
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">TU PROYECTO</p>
            <p className="text-sm font-bold mt-0.5">{DEMO_PROJECT.name}</p>
          </div>
          <p className="text-2xl font-black">{pct}%</p>
        </div>
        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-zinc-900 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Object.values(DEMO_PROJECT.phases).map(ph => (
            <div key={ph.label} className={`p-2.5 rounded-xl text-center border-2 ${ph.done ? 'border-green-300 bg-green-50' : ph.in_progress ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100'}`}>
              <p className="text-base mb-0.5">
                {ph.done ? '✅' : ph.in_progress ? '🔄' : '🔒'}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider leading-tight">{ph.label}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">{ph.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: FolderKanban, label: 'Ver proyecto', sub: 'Fase actual: Diseño', to: '/portal/proyecto', dark: true },
          { icon: MessageSquare, label: 'Mensajes', sub: '1 mensaje sin leer', to: '/portal/mensajes', dark: false },
          { icon: CreditCard, label: 'Pagos', sub: `$${totalPaid.toLocaleString()} pagados`, to: '/portal/pagos', dark: false },
          { icon: FileText, label: 'Documentos', sub: '3 archivos', to: '/portal/documentos', dark: false },
        ].map((item) => {
          const Icon = item.icon
          return (
            <button key={item.to} onClick={() => navigate(item.to)}
              className={`flex items-start gap-3 p-4 rounded-2xl text-left transition-all hover:scale-[1.01] ${item.dark ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 hover:border-zinc-300'}`}>
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${item.dark ? 'text-white/70' : 'text-zinc-500'}`} />
              <div className="min-w-0">
                <p className={`text-sm font-bold ${item.dark ? 'text-white' : 'text-zinc-900'}`}>{item.label}</p>
                <p className={`text-[10px] mt-0.5 ${item.dark ? 'text-white/60' : 'text-zinc-400'}`}>{item.sub}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-zinc-900 font-black text-[10px]">AC</span>
          </div>
          <div>
            <p className="text-white text-xs font-bold">Adrian Caravedo</p>
            <p className="text-zinc-400 text-[10px]">hola@nithrox.com</p>
          </div>
        </div>
        <button onClick={() => navigate('/portal/mensajes')}
          className="text-[10px] font-bold bg-white text-zinc-900 px-3 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors">
          Mensaje →
        </button>
      </div>
    </div>
  )
}
