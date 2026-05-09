import { useState } from 'react'
import { CheckCircle2, Clock, Lock, Copy } from 'lucide-react'
import { toast } from 'sonner'

const PHASES = [
  { label: 'Kick-off', pct: 10, amount: 500, paid: true, date: '02 Abr 2026' },
  { label: 'Diseño', pct: 40, amount: 2000, paid: false, current: true },
  { label: 'Desarrollo', pct: 40, amount: 2000, paid: false },
  { label: 'Publicación', pct: 10, amount: 500, paid: false },
]

const METHODS = [
  { icon: '🏦', label: 'Transferencia bancaria', detail: 'BCP — CCI: 00212300123456789012' },
  { icon: '📱', label: 'Yape / Plin', detail: '+51 999 000 111 — Adrian Caravedo' },
  { icon: '₿', label: 'USDT (TRC20)', detail: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
  { icon: '💳', label: 'Tarjeta (Culqi)', detail: 'Link de pago: culqi.com/nithrox' },
]

export default function PortalPagos() {
  const total = PHASES.reduce((s, p) => s + p.amount, 0)
  const paid = PHASES.filter(p => p.paid).reduce((s, p) => s + p.amount, 0)
  const pct = Math.round((paid / total) * 100)

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Pagos</h1>

      {/* Summary */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PROGRESO DE PAGO</p>
          <p className="text-sm font-bold">{pct}% pagado</p>
        </div>
        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Pagado: ${paid.toLocaleString()}</span>
          <span>Total: ${total.toLocaleString()} USD</span>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {PHASES.map(ph => (
          <div key={ph.label} className={`bg-white border-2 rounded-2xl p-4 flex items-center gap-4 ${ph.current ? 'border-amber-300' : 'border-zinc-200'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${ph.paid ? 'bg-green-100' : ph.current ? 'bg-amber-100' : 'bg-zinc-100'}`}>
              {ph.paid ? '✅' : ph.current ? '💳' : '🔒'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{ph.label}</p>
              <p className="text-xs text-zinc-400">{ph.pct}% del proyecto{ph.date ? ` · Pagado ${ph.date}` : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-black">${ph.amount.toLocaleString()}</p>
              <p className={`text-[10px] font-bold ${ph.paid ? 'text-green-600' : ph.current ? 'text-amber-600' : 'text-zinc-400'}`}>
                {ph.paid ? '✓ Pagado' : ph.current ? '⚡ Pendiente' : 'Bloqueado'}
              </p>
            </div>
            {ph.current && (
              <button className="px-3 py-2 bg-amber-600 text-white text-[10px] font-bold rounded-xl hover:bg-amber-700 shrink-0 uppercase tracking-wider">
                Pagar
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">MÉTODOS DE PAGO</p>
        <div className="space-y-2.5">
          {METHODS.map(m => (
            <div key={m.label} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
              <span className="text-xl shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">{m.label}</p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">{m.detail}</p>
              </div>
              <button onClick={() => { navigator.clipboard?.writeText(m.detail); toast.success('Copiado') }}
                className="p-1.5 border border-zinc-200 rounded-lg hover:bg-white transition-colors shrink-0">
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 mt-3">Envía tu comprobante a <strong>facturas@nithrox.com</strong> o por mensaje.</p>
      </div>
    </div>
  )
}
