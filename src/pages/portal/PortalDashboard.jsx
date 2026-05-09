import { useAuth } from '../../context/AuthContext'
import { usePortalData } from '../../hooks/usePortalData'
import { FolderKanban, CreditCard, MessageSquare, FileText, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PHASE_ORDER = ['kickoff', 'design', 'development', 'publication']
const PHASE_LABELS = { kickoff: 'Kick-off', design: 'Diseño', development: 'Desarrollo', publication: 'Publicación' }
const PHASE_PCT = { kickoff: 10, design: 40, development: 40, publication: 10 }

function greet(name) {
  const h = new Date().getHours()
  const gr = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
  return `${gr}, ${name?.split(' ')[0] || 'Cliente'} 👋`
}

export default function PortalDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { project, contracts, loading } = usePortalData(profile?.contact_id)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        Cargando tu proyecto...
      </div>
    )
  }

  // Derive progress from project phases
  const phases = project?.phases || {}
  const phaseList = PHASE_ORDER.map(key => ({
    key,
    label: PHASE_LABELS[key],
    pct: PHASE_PCT[key],
    status: phases[key]?.status || 'locked',
    paid: phases[key]?.paid || false,
    in_progress: phases[key]?.status === 'in_progress',
    done: phases[key]?.status === 'approved',
  }))

  const doneCount = phaseList.filter(p => p.done).length
  const pct = Math.round((doneCount / phaseList.length) * 100)
  const totalPaid = phaseList
    .filter(p => p.paid)
    .reduce((s, p) => s + (project?.value || 0) * p.pct / 100, 0)

  // Pending payment = current phase that's in_progress and not paid
  const pendingPhase = phaseList.find(p => p.in_progress && !p.paid)

  // Pending contracts
  const pendingContracts = contracts.filter(c => c.status !== 'both_signed')

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold">{greet(profile?.name)}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Alerts */}
      {pendingPhase && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">Pago pendiente — {pendingPhase.label}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Para continuar necesitamos el pago de ${((project?.value || 0) * pendingPhase.pct / 100).toLocaleString()} ({pendingPhase.pct}%)
            </p>
          </div>
          <button onClick={() => navigate('/portal/pagos')}
            className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-xl hover:bg-amber-700 transition-colors shrink-0">
            Ver →
          </button>
        </div>
      )}

      {pendingContracts.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-900">Contrato pendiente de firma</p>
            <p className="text-xs text-blue-700 mt-0.5">{pendingContracts[0]?.name}</p>
          </div>
        </div>
      )}

      {/* Progress */}
      {project ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">TU PROYECTO</p>
              <p className="text-sm font-bold mt-0.5">{project.name}</p>
            </div>
            <p className="text-2xl font-black">{pct}%</p>
          </div>
          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-zinc-900 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {phaseList.map(ph => (
              <div key={ph.key} className={`p-2.5 rounded-xl text-center border-2 ${ph.done ? 'border-green-300 bg-green-50' : ph.in_progress ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100'}`}>
                <p className="text-base mb-0.5">
                  {ph.done ? '✅' : ph.in_progress ? '🔄' : '🔒'}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider leading-tight">{ph.label}</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">{ph.pct}%</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 text-sm">
          No tienes proyectos activos por el momento.
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: FolderKanban, label: 'Ver proyecto', sub: project ? `Fase: ${PHASE_LABELS[project.phase] || project.phase}` : 'Sin proyecto activo', to: '/portal/proyecto', dark: true },
          { icon: MessageSquare, label: 'Mensajes', sub: 'Hablar con Nithrox', to: '/portal/mensajes', dark: false },
          { icon: CreditCard, label: 'Pagos', sub: totalPaid > 0 ? `$${totalPaid.toLocaleString()} pagados` : 'Sin pagos aún', to: '/portal/pagos', dark: false },
          { icon: FileText, label: 'Documentos', sub: 'Archivos de tu proyecto', to: '/portal/documentos', dark: false },
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
