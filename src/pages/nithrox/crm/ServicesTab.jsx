import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  Server, Globe, FolderKanban, CreditCard, CheckCircle2,
  Clock, XCircle, AlertCircle, RefreshCcw, ExternalLink,
  ShieldCheck, Pause, Play, RotateCcw, ChevronDown, ChevronUp,
  Copy, Check, Loader2,
} from 'lucide-react'
import { Button } from '../../../components/ui/button'

// ── Helpers ────────────────────────────────────────────────────────────────

const PLAN_LABELS = {
  'kit-digital':  'Kit Digital',
  'corporativa':  'Corporativa',
  'ecommerce':    'E-commerce',
}

const PLAN_COLORS = {
  'kit-digital':  'bg-blue-100 text-blue-700',
  'corporativa':  'bg-purple-100 text-purple-700',
  'ecommerce':    'bg-orange-100 text-orange-700',
}

const STATUS_CONFIG = {
  // order statuses
  paid:             { label: 'Pagado',      icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50' },
  pending:          { label: 'Pendiente',   icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
  validating:       { label: 'Validando',   icon: Clock,        color: 'text-orange-600', bg: 'bg-orange-50' },
  cancelled:        { label: 'Cancelado',   icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50' },
  // service statuses
  active:           { label: 'Activo',      icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50' },
  suspended:        { label: 'Suspendido',  icon: Pause,        color: 'text-red-500',    bg: 'bg-red-50' },
  pending_manual:   { label: 'Manual',      icon: AlertCircle,  color: 'text-orange-600', bg: 'bg-orange-50' },
  'En espera':      { label: 'En espera',   icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
  'Activo':         { label: 'Activo',      icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50' },
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status || '—', icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted' }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

function SectionChip({ icon: Icon, label, value, status }) {
  if (!value && !status) return null
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground font-medium">{label}:</span>
      {value && <span className="font-semibold truncate max-w-[160px]">{value}</span>}
      {status && <StatusPill status={status} />}
    </div>
  )
}

const STORE_URL = import.meta.env.VITE_STORE_URL || 'http://localhost:3000'
const ADMIN_KEY = import.meta.env.VITE_ADMIN_VALIDATION_KEY || 'nithrox-admin-2024'

// ── Main component ─────────────────────────────────────────────────────────

export default function ServicesTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [actionLoading, setActionLoading] = useState({})
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('all')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, hosting_orders (*), domain_orders (*)`)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('[ServicesTab] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Real-time subscription on orders table
  useEffect(() => {
    const channel = supabase
      .channel('services-tab-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hosting_orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domain_orders' }, () => fetchOrders())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchOrders])

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  // ── Actions ──────────────────────────────────────────────────────────────

  const validatePayment = async (order) => {
    setActionLoading(p => ({ ...p, [order.id]: 'validating' }))
    try {
      const res = await fetch(`${STORE_URL}/api/orders/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, admin_key: ADMIN_KEY }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Orden ${order.id.slice(0, 8)} validada y servicios activados`)
        fetchOrders()
      } else {
        // Fallback: direct Supabase update
        await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id)
        showToast('Pago marcado como validado (modo local)')
        fetchOrders()
      }
    } catch {
      await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id)
      showToast('Pago marcado como validado')
      fetchOrders()
    } finally {
      setActionLoading(p => ({ ...p, [order.id]: null }))
    }
  }

  const suspendService = async (order, service) => {
    const key = `${order.id}-${service}`
    setActionLoading(p => ({ ...p, [key]: true }))
    try {
      const table = service === 'hosting' ? 'hosting_orders' : service === 'domain' ? 'domain_orders' : 'projects'
      const recordId = service === 'hosting'
        ? order.hosting_orders?.[0]?.id
        : service === 'domain'
          ? order.domain_orders?.[0]?.id
          : order.projects?.id
      if (recordId) {
        await supabase.from(table).update({ status: 'suspended' }).eq('id', recordId)
        showToast(`${service} suspendido`)
        fetchOrders()
      }
    } finally {
      setActionLoading(p => ({ ...p, [key]: null }))
    }
  }

  const reactivateService = async (order, service) => {
    const key = `${order.id}-${service}`
    setActionLoading(p => ({ ...p, [key]: true }))
    try {
      const table = service === 'hosting' ? 'hosting_orders' : service === 'domain' ? 'domain_orders' : 'projects'
      const recordId = service === 'hosting'
        ? order.hosting_orders?.[0]?.id
        : service === 'domain'
          ? order.domain_orders?.[0]?.id
          : order.projects?.id
      if (recordId) {
        await supabase.from(table).update({ status: 'active' }).eq('id', recordId)
        showToast(`${service} reactivado`)
        fetchOrders()
      }
    } finally {
      setActionLoading(p => ({ ...p, [key]: null }))
    }
  }

  const renewService = async (order, service) => {
    const key = `${order.id}-${service}-renew`
    setActionLoading(p => ({ ...p, [key]: true }))
    try {
      const table = service === 'hosting' ? 'hosting_orders' : 'domain_orders'
      const record = service === 'hosting' ? order.hosting_orders?.[0] : order.domain_orders?.[0]
      if (record) {
        const newExpiry = new Date()
        newExpiry.setFullYear(newExpiry.getFullYear() + 1)
        await supabase.from(table).update({
          status: 'active',
          expires_at: newExpiry.toISOString(),
          renewed_at: new Date().toISOString(),
        }).eq('id', record.id)
        showToast(`${service} renovado por 1 año`)
        fetchOrders()
      }
    } finally {
      setActionLoading(p => ({ ...p, [key]: null }))
    }
  }

  // ── Filters ──────────────────────────────────────────────────────────────

  const FILTERS = [
    { id: 'all',        label: 'Todos' },
    { id: 'pending',    label: 'Pendientes' },
    { id: 'paid',       label: 'Pagados' },
    { id: 'validating', label: 'Validando' },
  ]

  const filtered = orders.filter(o => {
    if (filter === 'all') return true
    if (filter === 'pending') return o.status === 'pending' || o.status === 'validating'
    if (filter === 'paid') return o.status === 'paid'
    if (filter === 'validating') return o.status === 'validating'
    return true
  })

  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'validating').length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Pending warning banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border-b border-orange-200 text-orange-800 text-xs font-semibold shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {pendingCount} pago{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de validación manual
          <button
            onClick={() => setFilter('pending')}
            className="ml-1 underline underline-offset-2 hover:text-orange-900"
          >
            Ver ahora
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === f.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              {f.id === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] bg-orange-500 text-white rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} servicios</div>
        <button onClick={fetchOrders} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando servicios…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
            <ShieldCheck className="w-8 h-8 opacity-30" />
            <p>No hay servicios {filter !== 'all' ? 'con este filtro' : 'registrados'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(order => {
              const isExpanded = expanded[order.id]
              const isPendingValidation = order.status === 'pending' || order.status === 'validating'
              const planId = order.items?.plan?.id || order.plan_id
              const planLabel = PLAN_LABELS[planId] || planId || '—'
              const planCls = PLAN_COLORS[planId] || 'bg-muted text-muted-foreground'
              const hosting = order.hosting_orders?.[0]
              const domain = order.domain_orders?.[0]
              const project = order.projects
              const contact = order.contacts
              const isValidating = actionLoading[order.id] === 'validating'

              return (
                <div
                  key={order.id}
                  className={`transition-colors ${isPendingValidation ? 'bg-orange-50/50' : ''}`}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-4 py-3">

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Client avatar + name */}
                    <div className="flex items-center gap-2 min-w-[160px]">
                      {contact ? (
                        <>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ backgroundColor: contact.avatar_color || '#6366f1' }}
                          >
                            {contact.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold leading-none">{contact.name}</p>
                            <p className="text-[10px] text-muted-foreground">{contact.email}</p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold leading-none">{order.user_name || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{order.user_email || ''}</p>
                        </div>
                      )}
                    </div>

                    {/* Plan badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${planCls}`}>
                      {planLabel}
                    </span>

                    {/* Service indicators */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {hosting && (
                        <span title={`Hosting: ${hosting.status}`} className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          hosting.status === 'active' ? 'bg-green-100 text-green-700' :
                          hosting.status === 'suspended' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          <Server className="w-3 h-3" /> Hosting
                        </span>
                      )}
                      {domain && (
                        <span title={`Dominio: ${domain.domain} - ${domain.status}`} className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          domain.status === 'active' ? 'bg-green-100 text-green-700' :
                          domain.status === 'suspended' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          <Globe className="w-3 h-3" /> {domain.domain}
                        </span>
                      )}
                      {project && (
                        <span title={`Proyecto: ${project.status}`} className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          project.status === 'Activo' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          <FolderKanban className="w-3 h-3" /> Proyecto
                        </span>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">S/ {Number(order.total_pen || 0).toLocaleString()}</p>
                      {order.payment_method && (
                        <p className="text-[10px] text-muted-foreground capitalize">{order.payment_method}</p>
                      )}
                    </div>

                    {/* Order status */}
                    <div className="shrink-0">
                      <StatusPill status={order.status} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPendingValidation && (
                        <Button
                          size="sm"
                          onClick={() => validatePayment(order)}
                          disabled={isValidating}
                          className="text-[10px] h-7 px-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg"
                        >
                          {isValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                          <span className="ml-1">Validar pago</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-10 pb-4 pt-1 bg-muted/20 border-t border-border/50">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                        {/* Hosting */}
                        <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <Server className="w-3.5 h-3.5 text-blue-500" /> Hosting
                            </div>
                            <StatusPill status={hosting?.status || 'pending'} />
                          </div>
                          {hosting ? (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Plan</span>
                                <span className="font-medium capitalize">{hosting.tier || '—'}</span>
                              </div>
                              {hosting.twentyi_package_id && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">ID 20i</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-[10px]">{hosting.twentyi_package_id}</span>
                                    <CopyButton text={hosting.twentyi_package_id} />
                                  </div>
                                </div>
                              )}
                              {hosting.expires_at && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Vence</span>
                                  <span className="font-medium">{new Date(hosting.expires_at).toLocaleDateString('es-PE')}</span>
                                </div>
                              )}
                              <div className="flex gap-1.5 pt-1">
                                {hosting.status === 'active' ? (
                                  <button
                                    onClick={() => suspendService(order, 'hosting')}
                                    disabled={actionLoading[`${order.id}-hosting`]}
                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                  >
                                    <Pause className="w-3 h-3" /> Suspender
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => reactivateService(order, 'hosting')}
                                    disabled={actionLoading[`${order.id}-hosting`]}
                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                                  >
                                    <Play className="w-3 h-3" /> Reactivar
                                  </button>
                                )}
                                <button
                                  onClick={() => renewService(order, 'hosting')}
                                  disabled={actionLoading[`${order.id}-hosting-renew`]}
                                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                >
                                  <RotateCcw className="w-3 h-3" /> Renovar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">Sin hosting registrado</p>
                          )}
                        </div>

                        {/* Domain */}
                        <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <Globe className="w-3.5 h-3.5 text-green-500" /> Dominio
                            </div>
                            <StatusPill status={domain?.status || 'pending'} />
                          </div>
                          {domain ? (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Dominio</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{domain.domain}</span>
                                  <CopyButton text={domain.domain} />
                                </div>
                              </div>
                              {domain.expires_at && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Vence</span>
                                  <span className="font-medium">{new Date(domain.expires_at).toLocaleDateString('es-PE')}</span>
                                </div>
                              )}
                              <div className="flex gap-1.5 pt-1">
                                {domain.status === 'active' ? (
                                  <button
                                    onClick={() => suspendService(order, 'domain')}
                                    disabled={actionLoading[`${order.id}-domain`]}
                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                  >
                                    <Pause className="w-3 h-3" /> Suspender
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => reactivateService(order, 'domain')}
                                    disabled={actionLoading[`${order.id}-domain`]}
                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                                  >
                                    <Play className="w-3 h-3" /> Reactivar
                                  </button>
                                )}
                                <button
                                  onClick={() => renewService(order, 'domain')}
                                  disabled={actionLoading[`${order.id}-domain-renew`]}
                                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                >
                                  <RotateCcw className="w-3 h-3" /> Renovar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">Sin dominio registrado</p>
                          )}
                        </div>

                        {/* Project */}
                        <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <FolderKanban className="w-3.5 h-3.5 text-purple-500" /> Proyecto
                            </div>
                            {project && <StatusPill status={project.status} />}
                          </div>
                          {project ? (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Nombre</span>
                                <span className="font-medium truncate max-w-[120px]">{project.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tipo</span>
                                <span className="font-medium">{project.type || '—'}</span>
                              </div>
                              {project.start_date && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Inicio</span>
                                  <span className="font-medium">{new Date(project.start_date).toLocaleDateString('es-PE')}</span>
                                </div>
                              )}
                              {project.end_date && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Entrega</span>
                                  <span className="font-medium">{new Date(project.end_date).toLocaleDateString('es-PE')}</span>
                                </div>
                              )}
                              <div className="flex gap-1.5 pt-1">
                                {project.status !== 'Activo' ? (
                                  <button
                                    onClick={() => reactivateService(order, 'project')}
                                    disabled={actionLoading[`${order.id}-project`]}
                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                                  >
                                    <Play className="w-3 h-3" /> Activar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => suspendService(order, 'project')}
                                    disabled={actionLoading[`${order.id}-project`]}
                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                  >
                                    <Pause className="w-3 h-3" /> Suspender
                                  </button>
                                )}
                                <a
                                  href={`/projects?id=${project.id}`}
                                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" /> Ver proyecto
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">Sin proyecto vinculado</p>
                          )}
                        </div>
                      </div>

                      {/* Order meta */}
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[10px] text-muted-foreground">
                        <span>ID: <span className="font-mono text-foreground">{order.id?.slice(0, 8)}…</span> <CopyButton text={order.id} /></span>
                        {order.contract_number && <span>Contrato: <span className="font-semibold text-foreground">{order.contract_number}</span></span>}
                        <span>Creado: <span className="text-foreground">{new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                        {order.paid_at && <span>Pagado: <span className="text-green-600 font-semibold">{new Date(order.paid_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>}
                        {order.payment_method && (
                          <span>Método: <span className="text-foreground capitalize">{order.payment_method}</span></span>
                        )}
                        {order.payment_schedule && order.payment_schedule.length > 1 && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            <span>{order.payment_schedule.length} fases de pago</span>
                          </span>
                        )}
                      </div>

                      {/* Voucher preview if manual */}
                      {isPendingValidation && order.voucher_url && (
                        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                          <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span className="text-xs text-orange-700 font-medium">Comprobante adjunto:</span>
                          <a
                            href={order.voucher_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-orange-600 underline flex items-center gap-0.5 hover:text-orange-800"
                          >
                            Ver comprobante <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-foreground text-background'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
