import { useState } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { CreditCard, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, Link, Copy, MessageSquare, X } from 'lucide-react'

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

const CURRENCY_SYMBOLS = { USD: '$', PEN: 'S/' }

function buildMessage({ clientName, concept, amount, currency, method, yapeNumber, bcpAccount, paypalLink }) {
  const symbol = CURRENCY_SYMBOLS[currency] || '$'
  let methodBlock = ''
  if (method === 'Yape') {
    methodBlock = `📱 Yape al número: ${yapeNumber}`
  } else if (method === 'Transferencia BCP') {
    methodBlock = `🏦 Transferencia BCP\nCuenta: ${bcpAccount}`
  } else if (method === 'PayPal') {
    methodBlock = `💳 PayPal: ${paypalLink}`
  }

  return `Hola ${clientName} 👋

Te envío el link de pago por el servicio de ${concept}:

💰 Monto: ${symbol}${amount} ${currency}

${methodBlock}

Por favor realiza el pago y envíame el comprobante. ¡Gracias!
— Nithrox`
}

function PaymentLinkModal({ onClose }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [clientName, setClientName] = useState('')
  const [concept, setConcept] = useState('')
  const [method, setMethod] = useState('Yape')
  const [yapeNumber, setYapeNumber] = useState('999 999 999')
  const [bcpAccount, setBcpAccount] = useState('193-123456789-0-12')
  const [paypalLink, setPaypalLink] = useState('paypal.me/nithrox')
  const [toast, setToast] = useState(false)

  const message = buildMessage({ clientName: clientName || '{cliente}', concept: concept || '{concepto}', amount: amount || '0', currency, method, yapeNumber, bcpAccount, paypalLink })

  function handleCopy() {
    navigator.clipboard.writeText(message)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  function handleWhatsApp() {
    window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-zinc-600" />
            <h2 className="text-sm font-bold">Generar link de pago</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Amount + Currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-zinc-500 mb-1 block">Monto</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="w-28">
              <label className="text-xs font-bold text-zinc-500 mb-1 block">Moneda</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
              >
                <option value="USD">USD</option>
                <option value="PEN">PEN</option>
              </select>
            </div>
          </div>

          {/* Client name */}
          <div>
            <label className="text-xs font-bold text-zinc-500 mb-1 block">Nombre del cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Ej. Marco Torres"
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Concept */}
          <div>
            <label className="text-xs font-bold text-zinc-500 mb-1 block">Concepto</label>
            <input
              type="text"
              value={concept}
              onChange={e => setConcept(e.target.value)}
              placeholder="Ej. Diseño web - Cuota 1"
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs font-bold text-zinc-500 mb-2 block">Método de pago</label>
            <div className="flex gap-2">
              {['Yape', 'Transferencia BCP', 'PayPal'].map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${method === m ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="mt-3">
              {method === 'Yape' && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Número Yape</label>
                  <input
                    type="text"
                    value={yapeNumber}
                    onChange={e => setYapeNumber(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              )}
              {method === 'Transferencia BCP' && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Cuenta BCP</label>
                  <input
                    type="text"
                    value={bcpAccount}
                    onChange={e => setBcpAccount(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              )}
              {method === 'PayPal' && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">PayPal.me link</label>
                  <input
                    type="text"
                    value={paypalLink}
                    onChange={e => setPaypalLink(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Auto-generated message */}
          <div>
            <label className="text-xs font-bold text-zinc-500 mb-1 block">Mensaje para el cliente</label>
            <textarea
              value={message}
              onChange={() => {}}
              rows={8}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none text-zinc-700"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 border border-zinc-200 rounded-xl py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors relative"
            >
              <Copy className="w-4 h-4" />
              {toast ? 'Copiado' : 'Copiar mensaje'}
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const totalPaid    = SAMPLE_PAYMENTS.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = SAMPLE_PAYMENTS.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="FACTURACIÓN"
        actions={
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 bg-zinc-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            <Link className="w-3.5 h-3.5" />
            Generar link de pago
          </button>
        }
      />

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

      {showPaymentModal && <PaymentLinkModal onClose={() => setShowPaymentModal(false)} />}
    </div>
  )
}
