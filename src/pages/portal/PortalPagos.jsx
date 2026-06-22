import { useState, useEffect } from 'react'
import { Copy, Loader2, AlertCircle, CheckCircle2, Clock, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const PHASE_LABELS = ['Kick-off', 'Diseño', 'Desarrollo', 'Publicación']
const PHASE_PCTS   = [10, 40, 40, 10]

const METHODS = [
  { icon: '🏦', label: 'Transferencia bancaria', detail: 'BCP — CCI: 00212300123456789012' },
  { icon: '📱', label: 'Yape / Plin', detail: '+51 999 000 111 — Nithrox Agency' },
  { icon: '₿', label: 'USDT (TRC20)', detail: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
  { icon: '💳', label: 'Tarjeta (Culqi)', detail: 'Link de pago: culqi.com/nithrox' },
]

export default function PortalPagos() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState({})

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    fetch()

    // Real-time: update order status when admin validates
    const channel = supabase
      .channel(`portal-orders-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  async function uploadVoucher(orderId, file) {
    if (!file) return
    setUploading(p => ({ ...p, [orderId]: true }))
    try {
      // Upload to Supabase Storage (or convert to data URL as fallback)
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target.result
        await supabase.from('orders').update({ voucher_url: dataUrl, status: 'validating' }).eq('id', orderId)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, voucher_url: dataUrl, status: 'validating' } : o))
        toast.success('Comprobante enviado. El equipo lo revisará pronto.')
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error('Error al subir el comprobante')
    } finally {
      setUploading(p => ({ ...p, [orderId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 gap-2 text-zinc-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando pagos…
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Pagos</h1>
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center">
          <p className="text-zinc-400 text-sm">No tienes pedidos registrados aún.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Pagos</h1>

      {orders.map(order => {
        const total     = Number(order.total_pen || 0)
        const isPhased  = Array.isArray(order.payment_schedule) && order.payment_schedule.length > 1
        const isPending = order.status === 'pending' || order.status === 'validating'
        const isPaid    = order.status === 'paid'

        const phases = isPhased
          ? order.payment_schedule.map((ph, i) => ({
              label: PHASE_LABELS[i] || `Fase ${ph.phase}`,
              pct:   ph.pct,
              amount: Math.round(total * ph.pct / 100 * 100) / 100,
              paid:  i === 0 && isPaid,
              current: i === 0 && isPending,
            }))
          : null

        const paidAmount = isPaid ? total : (isPhased ? Math.round(total * PHASE_PCTS[0] / 100 * 100) / 100 : 0)
        const paidPct    = total > 0 ? Math.round((paidAmount / total) * 100) : 0

        return (
          <div key={order.id} className="space-y-3">
            {/* Order header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-base">{order.plan_name || 'Plan'}</p>
                <p className="text-xs text-zinc-400 font-mono">{order.id?.slice(0, 8)}… · {new Date(order.created_at).toLocaleDateString('es-PE')}</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                isPaid ? 'bg-green-100 text-green-700' :
                order.status === 'validating' ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {isPaid ? '✓ Pagado' : order.status === 'validating' ? '⏳ Validando' : '⚡ Pendiente'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PROGRESO DE PAGO</p>
                <p className="text-xs font-bold">{paidPct}% pagado</p>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${paidPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Pagado: S/ {paidAmount.toLocaleString('es-PE')}</span>
                <span>Total: S/ {total.toLocaleString('es-PE')}</span>
              </div>
            </div>

            {/* Phase breakdown (phased plans) */}
            {isPhased && phases && (
              <div className="space-y-2">
                {phases.map((ph, i) => (
                  <div key={i} className={`bg-white border-2 rounded-2xl p-4 flex items-center gap-4 ${ph.current ? 'border-amber-300' : ph.paid ? 'border-green-200' : 'border-zinc-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${ph.paid ? 'bg-green-100' : ph.current ? 'bg-amber-100' : 'bg-zinc-100'}`}>
                      {ph.paid ? '✅' : ph.current ? '💳' : '🔒'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{ph.label}</p>
                      <p className="text-xs text-zinc-400">{ph.pct}% del proyecto</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black">S/ {ph.amount.toLocaleString('es-PE')}</p>
                      <p className={`text-[10px] font-bold ${ph.paid ? 'text-green-600' : ph.current ? 'text-amber-600' : 'text-zinc-400'}`}>
                        {ph.paid ? '✓ Pagado' : ph.current ? 'Pendiente' : 'Bloqueado'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single payment (Kit Digital) */}
            {!isPhased && (
              <div className={`bg-white border-2 rounded-2xl p-4 flex items-center gap-4 ${isPaid ? 'border-green-200' : 'border-amber-300'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${isPaid ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {isPaid ? '✅' : '💳'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Pago único anual</p>
                  <p className="text-xs text-zinc-400">{order.payment_method || 'Sin método'}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black">S/ {total.toLocaleString('es-PE')}</p>
                  <p className={`text-[10px] font-bold ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                    {isPaid ? '✓ Pagado' : 'Pendiente'}
                  </p>
                </div>
              </div>
            )}

            {/* Voucher upload for pending manual payments */}
            {isPending && !['stripe', 'izipay', 'paypal'].includes(order.payment_method) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs font-semibold text-amber-800">
                    {order.status === 'validating'
                      ? 'Tu comprobante fue recibido. El equipo lo está validando...'
                      : 'Adjunta tu comprobante de pago para activar tus servicios'}
                  </p>
                </div>
                {order.status !== 'validating' && (
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors w-fit">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading[order.id] ? 'Subiendo...' : 'Subir comprobante'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploading[order.id]}
                      onChange={e => uploadVoucher(order.id, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        )
      })}

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
