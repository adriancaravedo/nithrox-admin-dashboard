import Topbar from '../../../components/layout/Topbar'
import { CreditCard, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const SAMPLE_PAYMENTS = [
  { id: '1', client: 'Tienda Max',     amount: 2800,  currency: 'USD', status: 'paid',    date: '2025-05-01', method: 'Transferencia', concept: 'Tienda Online' },
  { id: '2', client: 'Marco Torres',   amount: 350,   currency: 'USD', status: 'paid',    date: '2025-05-03', method: 'Yape',          concept: 'SEO Mensual' },
  { id: '3', client: 'AB Consultoría', amount: 1500,  currency: 'USD', status: 'pending', date: '2025-05-10', method: 'Transferencia', concept: 'Sitio Web' },
  { id: '4', client: 'InnoTech SAC',   amount: 49,    currency: 'USD', status: 'paid',    date: '2025-05-05', method: 'Stripe',        concept: 'Hosting VPS' },
  { id: '5', client: 'Moda Perú',      amount: 700,   currency: 'USD', status: 'overdue', date: '2025-04-30', method: 'Transferencia', concept: 'Cuota 2/4 - App Móvil' },
]

const STATUS_MAP = {
  paid:    { label: 'Pagado',   color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  pending: { label: 'Pendiente',color: 'bg-yellow-100 text-yellow-700',icon: Clock },
  overdue: { label: 'Vencido',  color: 'bg-red-100 text-red-600',      icon: AlertCircle },
}

export default function BillingPage() {
  const totalPaid    = SAMPLE_PAYMENTS.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = SAMPLE_PAYMENTS.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="FACTURACIÓN" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cobrado (mes)', value: `$${totalPaid.toLocaleString()}`, icon: DollarSign, sub: 'USD' },
            { label: 'Por cobrar', value: `$${totalPending.toLocaleString()}`, icon: Clock, sub: 'USD', warn: true },
            { label: 'Transacciones', value: SAMPLE_PAYMENTS.length, icon: CreditCard, sub: 'este mes' },
            { label: 'Crecimiento', value: '+18%', icon: TrendingUp, sub: 'vs mes anterior' },
          ].map(({ label, value, icon: Icon, sub, warn }) => (
            <div key={label} className="bg-background border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={`w-4 h-4 ${warn ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </div>
              <p className={`text-2xl font-black ${warn ? 'text-yellow-600' : ''}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Payments table */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm">Últimos pagos</h3>
            <span className="text-xs text-muted-foreground">Mayo 2025</span>
          </div>
          <div className="divide-y divide-border">
            {SAMPLE_PAYMENTS.map(p => {
              const s = STATUS_MAP[p.status]
              const StatusIcon = s.icon
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold">
                    {p.client[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.client}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.concept} · {p.method}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{new Date(p.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</p>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${s.color}`}>
                    <StatusIcon className="w-3 h-3" /> {s.label}
                  </span>
                  <p className="font-black text-sm shrink-0 w-20 text-right">${p.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{p.currency}</span></p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border border-dashed border-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground font-bold">Gráficos y reportes avanzados</p>
          <p className="text-xs text-muted-foreground mt-1">Revenue mensual, clientes top, proyección de ingresos — Fase 4</p>
        </div>
      </div>
    </div>
  )
}
