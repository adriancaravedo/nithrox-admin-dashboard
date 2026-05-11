import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePortalData } from '../../hooks/usePortalData'
import { FileText, PenLine, CheckCircle2, Clock, X } from 'lucide-react'

// ── SignatureModal ──────────────────────────────────────────────────────────
function SignatureModal({ contract, onClose, onSign }) {
  const [typedName, setTypedName] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [signing, setSigning] = useState(false)

  const canSign = typedName.trim().length > 3 && accepted

  const handleSign = async () => {
    if (!canSign) return
    setSigning(true)
    try {
      await onSign(typedName.trim())
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            <span className="font-bold text-sm">Firma tu contrato</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Contrato</p>
            <p className="text-sm font-semibold text-zinc-900">{contract.name}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Escribe tu nombre completo
            </label>
            <input
              type="text"
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>

          {/* Handwritten preview */}
          {typedName.trim().length > 0 && (
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 min-h-[64px] flex items-center justify-center">
              <span style={{ fontFamily: 'Times New Roman, serif', fontSize: '24px', color: '#1e40af', fontStyle: 'italic' }}>
                {typedName}
              </span>
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-zinc-900"
            />
            <span className="text-xs text-zinc-600 leading-relaxed">
              He leído y acepto el contrato en todos sus términos y condiciones.
            </span>
          </label>

          <button
            onClick={handleSign}
            disabled={!canSign || signing}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all
              disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed
              bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
          >
            {signing ? 'Firmando...' : 'Firmar digitalmente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Status badge ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  draft:         { label: 'Borrador',            color: 'bg-zinc-100 text-zinc-500' },
  sent:          { label: 'Pendiente de firma',  color: 'bg-amber-100 text-amber-700' },
  client_signed: { label: 'Firmado por ti',      color: 'bg-blue-100 text-blue-700' },
  both_signed:   { label: 'Completado',          color: 'bg-green-100 text-green-700' },
}

function StatusBadge({ status }) {
  const { label, color } = STATUS_MAP[status] || STATUS_MAP.draft
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${color}`}>
      {label}
    </span>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function PortalContratos() {
  const { profile, user } = useAuth()
  const { contracts, loading, signContract } = usePortalData(profile?.contact_id, user?.id)
  const [signingContract, setSigningContract] = useState(null)

  const handleSign = async (name) => {
    if (!signingContract) return
    await signContract(signingContract.id, name, signingContract.data)
    setSigningContract(null)
  }

  const formatCurrency = (amount, currency = 'PEN') => {
    if (!amount) return '—'
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount)
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto" style={{ fontFamily: "'Geist Mono', monospace" }}>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-zinc-700" />
          <h1 className="text-lg font-bold text-zinc-900">Contratos</h1>
        </div>
        <p className="text-xs text-zinc-500">Revisa y firma tus contratos pendientes.</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && contracts.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">No tienes contratos aún</p>
        </div>
      )}

      {/* Contract list */}
      {!loading && contracts.length > 0 && (
        <div className="space-y-3">
          {contracts.map(contract => {
            const { data = {} } = contract
            const isPending = contract.status === 'sent'
            const isCompleted = contract.status === 'both_signed'

            return (
              <div
                key={contract.id}
                className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-sm font-bold text-zinc-900 leading-tight">{contract.name}</span>
                      <StatusBadge status={contract.status} />
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500">
                      {data.project && (
                        <span><span className="text-zinc-400">Proyecto:</span> {data.project}</span>
                      )}
                      {data.amount && (
                        <span><span className="text-zinc-400">Monto:</span> {formatCurrency(data.amount, data.currency)}</span>
                      )}
                      {contract.created_at && (
                        <span><span className="text-zinc-400">Fecha:</span> {new Date(contract.created_at).toLocaleDateString('es-PE')}</span>
                      )}
                      {isCompleted && contract.client_signed_at && (
                        <span><span className="text-zinc-400">Firmado:</span> {contract.client_signed_at}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && (
                      <button
                        onClick={() => setSigningContract(contract)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all active:scale-[0.97]"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        Firmar ahora
                      </button>
                    )}
                    {isCompleted && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completado ✅
                      </div>
                    )}
                    {contract.status === 'client_signed' && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Esperando confirmación
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed certificate info */}
                {isCompleted && (
                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <p className="text-[11px] text-zinc-400">
                      Contrato completado y firmado por ambas partes. Puedes solicitar una copia al equipo de Nithrox a través de mensajes.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Signature modal */}
      {signingContract && (
        <SignatureModal
          contract={signingContract}
          onClose={() => setSigningContract(null)}
          onSign={handleSign}
        />
      )}
    </div>
  )
}
