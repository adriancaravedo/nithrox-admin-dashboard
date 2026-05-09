const DOCS = [
  { name: 'Contrato de servicios', type: 'contract', date: '02 Abr 2026', icon: '📝', size: '245 KB' },
  { name: 'Brief del proyecto', type: 'brief', date: '05 Abr 2026', icon: '📋', size: '128 KB' },
  { name: 'Propuesta inicial', type: 'proposal', date: '30 Mar 2026', icon: '📄', size: '312 KB' },
  { name: 'Factura #001 — Kick-off', type: 'invoice', date: '02 Abr 2026', icon: '🧾', size: '89 KB' },
]

export default function PortalDocumentos() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Documentos</h1>
      <div className="space-y-3">
        {DOCS.map(doc => (
          <div key={doc.name} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-300 transition-colors">
            <span className="text-2xl shrink-0">{doc.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{doc.name}</p>
              <p className="text-[10px] text-zinc-400">{doc.date} · {doc.size}</p>
            </div>
            <button className="px-3 py-1.5 border border-zinc-200 rounded-xl text-[10px] font-bold hover:bg-zinc-50 transition-colors shrink-0 uppercase tracking-wider">
              Ver →
            </button>
          </div>
        ))}
      </div>
      {DOCS.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-3xl mb-3">📂</p>
          <p className="text-sm font-bold">Sin documentos disponibles</p>
        </div>
      )}
    </div>
  )
}
