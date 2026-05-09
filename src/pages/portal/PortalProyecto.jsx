import { useState } from 'react'
import { CheckCircle2, Lock, Clock, ExternalLink } from 'lucide-react'

const PHASES = [
  { id: 'kickoff', label: 'Kick-off', pct: 10, status: 'approved', icon: '🚀',
    items: ['Contrato firmado', 'Pago inicial recibido', 'Brief completado', 'Reunión de inicio'] },
  { id: 'design', label: 'Diseño', pct: 40, status: 'in_progress', icon: '🎨',
    figma_url: 'https://figma.com', preview: true,
    items: ['Wireframes', 'Diseño mobile', 'Diseño desktop', 'Aprobación del cliente'] },
  { id: 'development', label: 'Desarrollo', pct: 40, status: 'locked', icon: '💻',
    items: ['Maquetado', 'Funcionalidades', 'Pruebas', 'Staging review'] },
  { id: 'publication', label: 'Publicación', pct: 10, status: 'locked', icon: '🎉',
    items: ['Dominio configurado', 'SEO básico', 'Analytics', 'Lanzamiento'] },
]

const STATUS = {
  approved:    { label: '✅ Completada', c: 'bg-green-50 border-green-200 text-green-700' },
  in_progress: { label: '🔄 En progreso', c: 'bg-blue-50 border-blue-200 text-blue-700' },
  locked:      { label: '🔒 Pendiente', c: 'bg-zinc-50 border-zinc-200 text-zinc-400' },
}

export default function PortalProyecto() {
  const [active, setActive] = useState('design')
  const ph = PHASES.find(p => p.id === active)
  const st = STATUS[ph.status]

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TU PROYECTO</p>
        <h1 className="text-xl font-bold mt-0.5">Sitio web corporativo</h1>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PHASES.map(p => (
          <button key={p.id} onClick={() => setActive(p.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all ${
              active === p.id ? 'bg-zinc-900 text-white border-zinc-900' :
              p.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
              p.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-zinc-50 text-zinc-400 border-zinc-200'
            }`}>
            {p.icon} {p.label} <span className="opacity-60">({p.pct}%)</span>
          </button>
        ))}
      </div>

      {/* Phase content */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-sm font-bold">{ph.icon} {ph.label}</p>
          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${st.c}`}>{st.label}</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Figma preview for design */}
          {ph.figma_url && ph.status === 'in_progress' && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-center">
              <p className="text-3xl mb-2">🎨</p>
              <p className="text-sm font-bold text-zinc-700 mb-3">El diseño está listo para revisar</p>
              <a href={ph.figma_url} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-2 mx-auto px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Ver diseño en Figma
                </button>
              </a>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-2">
            {ph.items.map((item, i) => {
              const done = ph.status === 'approved' || (ph.status === 'in_progress' && i < 2)
              return (
                <div key={item} className="flex items-center gap-3 py-2 border-b border-zinc-50 last:border-0">
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    : ph.status === 'locked'
                      ? <Lock className="w-4 h-4 text-zinc-300 shrink-0" />
                      : <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  }
                  <span className={`text-sm ${done ? 'text-zinc-700' : 'text-zinc-400'}`}>{item}</span>
                </div>
              )
            })}
          </div>

          {/* Approve button */}
          {ph.status === 'in_progress' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-blue-900">Tu aprobación es necesaria</p>
              <p className="text-xs text-blue-700">¿Estás de acuerdo con el avance del diseño? Tu aprobación permite continuar.</p>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 uppercase tracking-wider">
                  ✅ Aprobar
                </button>
                <button className="flex-1 py-2.5 border border-blue-300 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 uppercase tracking-wider">
                  💬 Solicitar cambios
                </button>
              </div>
            </div>
          )}

          {ph.status === 'locked' && (
            <p className="text-xs text-zinc-400 text-center py-4">
              Esta fase se desbloqueará cuando completes las anteriores.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
