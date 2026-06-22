import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, Tag, Layers, Server, Settings,
  TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle2,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Edit2, Save,
  X, Plus, Trash2, Eye, ShoppingBag, Upload, Check,
  Globe, CreditCard, Zap, ArrowUpRight, MoreHorizontal,
} from 'lucide-react'

// ── Correct plan defaults ──────────────────────────────────────
const DEFAULT_PLANS = [
  {
    id: 'kit-digital',
    name: 'Kit Digital',
    price_pen: 149,
    billing: 'annual',
    description: 'Presencia digital básica con subdominio y hosting incluido.',
    color: '#6366f1',
    customize_step: false,
    payment_schedule: null,
    features: [
      'Landing page profesional',
      'Subdominio .nithrox.pe',
      'Hosting compartido incluido',
      'SSL gratuito',
      'Formulario de contacto',
      'Optimización básica SEO',
    ],
  },
  {
    id: 'corporativa',
    name: 'Web Corporativa',
    price_pen: 699,
    billing: 'one-time',
    description: 'Sitio web profesional con diseño personalizado y dominio propio.',
    color: '#e8441e',
    customize_step: true,
    payment_schedule: [
      { phase: 1, label: 'Inicio del proyecto', pct: 10 },
      { phase: 2, label: 'Diseño aprobado', pct: 40 },
      { phase: 3, label: 'Desarrollo completado', pct: 40 },
      { phase: 4, label: 'Entrega final', pct: 10 },
    ],
    features: [
      'Diseño web personalizado',
      'Hasta 10 páginas',
      'Dominio propio 1 año',
      'Hosting premium 1 año',
      'SSL gratuito',
      'Blog / Noticias',
      'Formularios avanzados',
      'SEO On-Page completo',
    ],
    page_options: [
      { value: '5', label: '5 páginas', price_extra_pen: 0 },
      { value: '10', label: '10 páginas', price_extra_pen: 0 },
      { value: '15', label: '15 páginas', price_extra_pen: 150 },
      { value: '20+', label: '20+ páginas', price_extra_pen: 350 },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    price_pen: 1499,
    billing: 'one-time',
    description: 'Tienda online completa con pasarela de pagos y gestión de productos.',
    color: '#10b981',
    customize_step: true,
    payment_schedule: [
      { phase: 1, label: 'Inicio del proyecto', pct: 10 },
      { phase: 2, label: 'Diseño aprobado', pct: 40 },
      { phase: 3, label: 'Desarrollo completado', pct: 40 },
      { phase: 4, label: 'Entrega final', pct: 10 },
    ],
    features: [
      'Diseño e-commerce personalizado',
      'Catálogo de productos ilimitado',
      'Pasarela de pagos integrada',
      'Gestión de inventario',
      'Panel de administración',
      'Dominio propio 1 año',
      'Hosting premium 1 año',
      'SEO avanzado + Analytics',
    ],
    page_options: [
      { value: '10', label: '10 páginas + tienda', price_extra_pen: 0 },
      { value: '20', label: '20 páginas + tienda', price_extra_pen: 200 },
      { value: '30+', label: '30+ páginas + tienda', price_extra_pen: 450 },
    ],
  },
]

const DEFAULT_ADDONS = [
  { id: 'extra-pages', name: 'Páginas extra', description: 'Pack de 5 páginas adicionales', price_pen: 150 },
  { id: 'logo', name: 'Diseño de logo', description: 'Identidad visual completa con manual de marca', price_pen: 299 },
  { id: 'seo-monthly', name: 'SEO mensual', description: 'Posicionamiento orgánico y reportes mensuales', price_pen: 199 },
  { id: 'maintenance', name: 'Mantenimiento web', description: 'Actualizaciones y soporte técnico mensual', price_pen: 99 },
  { id: 'email-corp', name: 'Email corporativo', description: 'Correos @tudominio.com (hasta 5 cuentas)', price_pen: 89 },
  { id: 'social-pack', name: 'Pack redes sociales', description: 'Gestión mensual de 2 redes sociales', price_pen: 299 },
]

const DEFAULT_HOSTING = [
  { id: 'shared', name: 'Compartido', price_pen: 0, included: true, specs: { storage: '5GB', bandwidth: '50GB', sites: 1 }, features: ['SSL gratuito', 'cPanel básico', 'Backups semanales'] },
  { id: 'premium', name: 'Premium', price_pen: 49, included: false, specs: { storage: '20GB', bandwidth: '200GB', sites: 3 }, features: ['SSL gratuito', 'cPanel completo', 'Backups diarios', 'Email corporativo', 'CDN incluido'] },
  { id: 'vps', name: 'VPS', price_pen: 149, included: false, specs: { storage: '60GB SSD', bandwidth: 'Ilimitado', sites: 10 }, features: ['SSL gratuito', 'Root access', 'Backups diarios', 'CDN incluido', 'Monitoreo 24/7', 'IP dedicada'] },
]

const DEFAULT_PAYMENT_METHODS = [
  { id: 'transfer', icon: '🏦', name: 'Transferencia bancaria', detail: 'BCP — CCI: 00212300123456789012', active: true },
  { id: 'yape', icon: '📱', name: 'Yape / Plin', detail: '+51 999 000 111 — Nithrox Agency', active: true },
  { id: 'crypto', icon: '₿', name: 'USDT (TRC20)', detail: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', active: true },
  { id: 'stripe', icon: '💳', name: 'Tarjeta (Stripe)', detail: 'pk_live_...', active: false },
]

// ── Status helpers ─────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  validating: { label: 'Validando',   color: '#e8441e', bg: '#fee2d5', icon: AlertCircle },
  paid:       { label: 'Pagado',      color: '#10b981', bg: '#d1fae5', icon: CheckCircle2 },
  active:     { label: 'Activo',      color: '#10b981', bg: '#d1fae5', icon: CheckCircle2 },
  suspended:  { label: 'Suspendido',  color: '#ef4444', bg: '#fee2e2', icon: X },
  cancelled:  { label: 'Cancelado',   color: '#6b7280', bg: '#f3f4f6', icon: X },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', icon: Clock }
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg,
    }}>
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  )
}

const STORE_URL = import.meta.env.VITE_STORE_URL || 'http://localhost:3000'
const ADMIN_KEY = import.meta.env.VITE_ADMIN_VALIDATION_KEY || 'nithrox-admin-2024'

// ── Main page ──────────────────────────────────────────────────
const TABS = [
  { id: 'resumen',  label: 'Resumen',       icon: LayoutDashboard },
  { id: 'pedidos',  label: 'Pedidos',       icon: Package },
  { id: 'planes',   label: 'Planes',        icon: Tag },
  { id: 'addons',   label: 'Addons',        icon: Layers },
  { id: 'hosting',  label: 'Hosting',       icon: Server },
  { id: 'config',   label: 'Configuración', icon: Settings },
]

export default function StoreAdminPage() {
  const [activeTab, setActiveTab] = useState('resumen')
  const [orders, setOrders] = useState([])
  const [config, setConfig] = useState({
    plans: DEFAULT_PLANS,
    addons: DEFAULT_ADDONS,
    hosting: DEFAULT_HOSTING,
    payment_methods: DEFAULT_PAYMENT_METHODS,
  })
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingConfig, setLoadingConfig] = useState(true)

  const pendingCount = orders.filter(o => o.status === 'validating').length

  // ── Load from Supabase ─────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    const { data } = await supabase
      .from('orders')
      .select('*, contacts(full_name, email)')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoadingOrders(false)
  }, [])

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true)
    const { data } = await supabase.from('store_config').select('*')
    if (data?.length) {
      const map = {}
      data.forEach(row => { map[row.id] = row.value })
      setConfig(prev => ({
        plans: map.plans || prev.plans,
        addons: map.addons || prev.addons,
        hosting: map.hosting || prev.hosting,
        payment_methods: map.payment_methods || prev.payment_methods,
      }))
    }
    setLoadingConfig(false)
  }, [])

  useEffect(() => {
    loadOrders()
    loadConfig()

    const ch = supabase
      .channel('store-admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [loadOrders, loadConfig])

  const saveConfig = async (id, value) => {
    const { error } = await supabase.from('store_config').upsert(
      { id, value, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    if (error) { toast.error('Error al guardar'); return false }
    toast.success('Configuración guardada en Supabase')
    setConfig(prev => ({ ...prev, [id]: value }))
    return true
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Inner sidebar ────────────────────────────────── */}
      <aside className="w-44 shrink-0 border-r border-border flex flex-col py-3 gap-0.5 overflow-y-auto">
        <div className="px-4 pb-2 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-foreground" />
          <span className="text-xs font-black uppercase tracking-wide">Tienda</span>
        </div>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="mx-2 flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors relative text-left"
              style={{
                background: isActive ? 'hsl(var(--foreground))' : 'transparent',
                color: isActive ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {tab.label}
              {tab.id === 'pedidos' && pendingCount > 0 && (
                <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none"
                  style={{ background: isActive ? 'rgba(255,255,255,0.25)' : '#e8441e', color: isActive ? 'white' : 'white' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </aside>

      {/* ── Tab content ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'resumen'  && <ResumenTab orders={orders} loading={loadingOrders} onRefresh={loadOrders} />}
        {activeTab === 'pedidos'  && <PedidosTab orders={orders} loading={loadingOrders} onRefresh={loadOrders} />}
        {activeTab === 'planes'   && <PlanesTab  plans={config.plans}   onSave={v => saveConfig('plans', v)} loading={loadingConfig} />}
        {activeTab === 'addons'   && <AddonsTab  addons={config.addons} onSave={v => saveConfig('addons', v)} loading={loadingConfig} />}
        {activeTab === 'hosting'  && <HostingTab tiers={config.hosting} onSave={v => saveConfig('hosting', v)} loading={loadingConfig} />}
        {activeTab === 'config'   && <ConfigTab  methods={config.payment_methods} onSave={v => saveConfig('payment_methods', v)} loading={loadingConfig} />}
      </div>
    </div>
  )
}

// ── Resumen tab ────────────────────────────────────────────────
function ResumenTab({ orders, loading, onRefresh }) {
  const totalRevenue = orders.filter(o => o.status === 'paid' || o.status === 'active').reduce((sum, o) => sum + (Number(o.total_pen) || 0), 0)
  const thisMonth = (() => {
    const now = new Date()
    return orders.filter(o => {
      const d = new Date(o.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  })()
  const pending = orders.filter(o => o.status === 'validating').length
  const active = orders.filter(o => o.status === 'active' || o.status === 'paid').length

  const kpis = [
    { label: 'Ingresos totales', value: `S/ ${totalRevenue.toLocaleString('es-PE')}`, icon: DollarSign, color: '#10b981' },
    { label: 'Pedidos este mes', value: thisMonth, icon: TrendingUp, color: '#6366f1' },
    { label: 'Por validar', value: pending, icon: AlertCircle, color: '#f59e0b' },
    { label: 'Servicios activos', value: active, icon: CheckCircle2, color: '#e8441e' },
  ]

  const byStatus = Object.entries(
    orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  )

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Resumen de tienda</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{orders.length} pedidos en total · Sincronizado con Supabase</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-muted-foreground font-medium">{k.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: k.color + '20' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                </div>
              </div>
              <p className="text-2xl font-black tracking-tight">{k.value}</p>
            </div>
          )
        })}
      </div>

      {/* Status breakdown */}
      {byStatus.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-bold mb-3 uppercase tracking-widest text-muted-foreground">Por estado</p>
          <div className="flex flex-wrap gap-2">
            {byStatus.map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                <StatusBadge status={status} />
                <span className="text-xs font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Últimos pedidos</p>
          <span className="text-[10px] text-muted-foreground">{orders.slice(0, 10).length} de {orders.length}</span>
        </div>
        <div className="divide-y divide-border">
          {orders.slice(0, 10).map(order => (
            <div key={order.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{order.contacts?.full_name || order.client_name || 'Cliente'}</p>
                <p className="text-[11px] text-muted-foreground">{order.plan_name} · {new Date(order.created_at).toLocaleDateString('es-PE')}</p>
              </div>
              <p className="text-sm font-bold shrink-0">S/ {Number(order.total_pen || 0).toLocaleString('es-PE')}</p>
              <StatusBadge status={order.status} />
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Sin pedidos aún</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Pedidos tab ────────────────────────────────────────────────
function PedidosTab({ orders, loading, onRefresh }) {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const FILTERS = [
    { id: 'all',        label: 'Todos' },
    { id: 'validating', label: 'Por validar' },
    { id: 'pending',    label: 'Pendientes' },
    { id: 'paid',       label: 'Pagados' },
    { id: 'active',     label: 'Activos' },
    { id: 'suspended',  label: 'Suspendidos' },
  ]

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  async function validatePayment(order) {
    try {
      const res = await fetch(`${STORE_URL}/api/orders/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, adminKey: ADMIN_KEY }),
      })
      if (!res.ok) throw new Error('Store API error')
      toast.success(`✅ Pago validado: ${order.contacts?.full_name || 'Cliente'}`)
    } catch {
      // Fallback: update directly in Supabase
      const { error } = await supabase.from('orders').update({ status: 'active', validated_at: new Date().toISOString() }).eq('id', order.id)
      if (error) { toast.error('Error al validar'); return }
      toast.success(`✅ Pago validado: ${order.contacts?.full_name || 'Cliente'}`)
    }
  }

  async function updateStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(`Estado actualizado: ${STATUS_CONFIG[status]?.label || status}`)
  }

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Pedidos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestión de pedidos en tiempo real · Supabase Realtime activo</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => {
          const count = f.id === 'all' ? orders.length : orders.filter(o => o.status === f.id).length
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors"
              style={{
                background: filter === f.id ? 'hsl(var(--foreground))' : 'transparent',
                color: filter === f.id ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
                borderColor: filter === f.id ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
              }}
            >
              {f.label} {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Orders list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No hay pedidos en esta categoría</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(order => {
              const isExpanded = expanded === order.id
              const isManual = !['stripe', 'izipay', 'paypal'].includes(order.payment_method)
              const needsValidation = order.status === 'validating' && isManual
              return (
                <div key={order.id}>
                  {/* Row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                      {(order.contacts?.full_name || order.client_name || 'C')[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{order.contacts?.full_name || order.client_name || 'Cliente'}</p>
                        {needsValidation && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">Comprobante adjunto</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {order.plan_name} · {order.payment_method || 'Sin método'} · {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Amount */}
                    <p className="text-sm font-black shrink-0">S/ {Number(order.total_pen || 0).toLocaleString('es-PE')}</p>

                    {/* Status */}
                    <StatusBadge status={order.status} />

                    {/* Chevron */}
                    <div className="text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-muted/20 border-t border-border space-y-3 pt-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-0.5">ID del pedido</p>
                          <p className="font-mono font-semibold">{order.id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-0.5">Email cliente</p>
                          <p className="font-semibold">{order.contacts?.email || order.client_email || '—'}</p>
                        </div>
                        {order.voucher_url && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground mb-1">Comprobante adjunto</p>
                            <a
                              href={order.voucher_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                            >
                              <Eye className="w-3 h-3" /> Ver comprobante
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap pt-1">
                        {needsValidation && (
                          <button
                            onClick={() => validatePayment(order)}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors"
                            style={{ background: '#10b981' }}
                          >
                            <Check className="w-3 h-3" /> Validar pago
                          </button>
                        )}
                        {order.status === 'active' && (
                          <button
                            onClick={() => updateStatus(order.id, 'suspended')}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                          >
                            <X className="w-3 h-3" /> Suspender
                          </button>
                        )}
                        {order.status === 'suspended' && (
                          <button
                            onClick={() => updateStatus(order.id, 'active')}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                          >
                            <Check className="w-3 h-3" /> Reactivar
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(order.id, 'active')}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors"
                            style={{ background: '#e8441e' }}
                          >
                            <Check className="w-3 h-3" /> Activar manualmente
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Planes tab ─────────────────────────────────────────────────
function PlanesTab({ plans, onSave, loading }) {
  const [editedPlans, setEditedPlans] = useState(plans)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setEditedPlans(plans) }, [plans])

  function updatePlan(id, field, value) {
    setEditedPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function updateFeature(planId, idx, value) {
    setEditedPlans(prev => prev.map(p => {
      if (p.id !== planId) return p
      const features = [...p.features]
      features[idx] = value
      return { ...p, features }
    }))
  }

  function addFeature(planId) {
    setEditedPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, features: [...p.features, 'Nueva característica'] } : p
    ))
  }

  function removeFeature(planId, idx) {
    setEditedPlans(prev => prev.map(p => {
      if (p.id !== planId) return p
      return { ...p, features: p.features.filter((_, i) => i !== idx) }
    }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(editedPlans)
    setSaving(false)
    setEditingId(null)
  }

  if (loading) return <LoadingState />

  const PLAN_COLORS = { 'kit-digital': '#6366f1', 'corporativa': '#e8441e', 'ecommerce': '#10b981' }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Planes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Edita precios y características · Se guardan en Supabase y la tienda los lee automáticamente</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
          style={{ background: '#e8441e' }}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {editedPlans.map(plan => {
          const isEditing = editingId === plan.id
          const color = PLAN_COLORS[plan.id] || '#6b7280'
          return (
            <div key={plan.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Plan header */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between" style={{ borderBottom: `2px solid ${color}20` }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    {isEditing ? (
                      <input
                        className="text-sm font-black bg-transparent border-b border-border outline-none w-full"
                        value={plan.name}
                        onChange={e => updatePlan(plan.id, 'name', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-black">{plan.name}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">S/</span>
                    {isEditing ? (
                      <input
                        type="number"
                        className="text-2xl font-black bg-transparent border-b border-border outline-none w-24"
                        value={plan.price_pen}
                        onChange={e => updatePlan(plan.id, 'price_pen', Number(e.target.value))}
                        style={{ color }}
                      />
                    ) : (
                      <span className="text-2xl font-black" style={{ color }}>{plan.price_pen.toLocaleString('es-PE')}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{plan.billing === 'annual' ? '/año' : ''}</span>
                  </div>

                  {/* Billing type badge */}
                  <div className="mt-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: color + '15', color }}>
                      {plan.billing === 'annual' ? 'Pago anual único' : plan.payment_schedule ? `${plan.payment_schedule.length} pagos (${plan.payment_schedule.map(p => p.pct + '%').join('/')})` : 'Pago único'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setEditingId(isEditing ? null : plan.id)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Description */}
              <div className="px-4 py-2">
                {isEditing ? (
                  <textarea
                    className="text-xs text-muted-foreground bg-transparent border border-border rounded-lg p-2 outline-none w-full resize-none"
                    rows={2}
                    value={plan.description}
                    onChange={e => updatePlan(plan.id, 'description', e.target.value)}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                )}
              </div>

              {/* Features */}
              <div className="px-4 pb-4 space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Características</p>
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-3 h-3 shrink-0" style={{ color }} />
                    {isEditing ? (
                      <input
                        className="text-xs flex-1 bg-transparent border-b border-border outline-none"
                        value={f}
                        onChange={e => updateFeature(plan.id, i, e.target.value)}
                      />
                    ) : (
                      <span className="text-xs">{f}</span>
                    )}
                    {isEditing && (
                      <button onClick={() => removeFeature(plan.id, i)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addFeature(plan.id)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-2"
                  >
                    <Plus className="w-3 h-3" /> Agregar característica
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Addons tab ─────────────────────────────────────────────────
function AddonsTab({ addons, onSave, loading }) {
  const [items, setItems] = useState(addons)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setItems(addons) }, [addons])

  function updateItem(id, field, value) {
    setItems(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  function addNew() {
    const id = 'addon-' + Date.now()
    setItems(prev => [...prev, { id, name: 'Nuevo addon', description: '', price_pen: 0 }])
  }

  function remove(id) {
    setItems(prev => prev.filter(a => a.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(items)
    setSaving(false)
  }

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Addons</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Servicios adicionales que los clientes pueden agregar al checkout</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addNew} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <Plus className="w-3 h-3" /> Agregar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ background: '#e8441e' }}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Guardar
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2.5 text-[11px] font-black text-muted-foreground uppercase tracking-wider">Nombre</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-black text-muted-foreground uppercase tracking-wider">Descripción</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-black text-muted-foreground uppercase tracking-wider">Precio (S/)</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map(addon => (
              <tr key={addon.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <input
                    className="text-sm font-semibold bg-transparent outline-none border-b border-transparent hover:border-border focus:border-border w-full transition-colors"
                    value={addon.name}
                    onChange={e => updateItem(addon.id, 'name', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    className="text-xs text-muted-foreground bg-transparent outline-none border-b border-transparent hover:border-border focus:border-border w-full transition-colors"
                    value={addon.description}
                    onChange={e => updateItem(addon.id, 'description', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <input
                    type="number"
                    className="text-sm font-bold bg-transparent outline-none border-b border-transparent hover:border-border focus:border-border text-right w-20 transition-colors"
                    value={addon.price_pen}
                    onChange={e => updateItem(addon.id, 'price_pen', Number(e.target.value))}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={() => remove(addon.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Hosting tab ────────────────────────────────────────────────
function HostingTab({ tiers, onSave, loading }) {
  const [items, setItems] = useState(tiers)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setItems(tiers) }, [tiers])

  function updateItem(id, field, value) {
    setItems(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  function updateSpec(id, specKey, value) {
    setItems(prev => prev.map(t => t.id === id ? { ...t, specs: { ...t.specs, [specKey]: value } } : t))
  }

  function addFeature(id) {
    setItems(prev => prev.map(t => t.id === id ? { ...t, features: [...t.features, 'Nueva característica'] } : t))
  }

  function removeFeature(id, idx) {
    setItems(prev => prev.map(t => t.id === id ? { ...t, features: t.features.filter((_, i) => i !== idx) } : t))
  }

  function updateFeature(id, idx, value) {
    setItems(prev => prev.map(t => {
      if (t.id !== id) return t
      const features = [...t.features]
      features[idx] = value
      return { ...t, features }
    }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(items)
    setSaving(false)
  }

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Hosting</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Tiers de hosting disponibles en el checkout</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ background: '#e8441e' }}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(tier => (
          <div key={tier.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <input
                className="text-sm font-black bg-transparent outline-none border-b border-transparent hover:border-border focus:border-border"
                value={tier.name}
                onChange={e => updateItem(tier.id, 'name', e.target.value)}
              />
              {tier.included ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Incluido</span>
              ) : (
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[10px] text-muted-foreground">S/</span>
                  <input
                    type="number"
                    className="text-sm font-black bg-transparent outline-none border-b border-border w-12 text-right"
                    value={tier.price_pen}
                    onChange={e => updateItem(tier.id, 'price_pen', Number(e.target.value))}
                  />
                  <span className="text-[10px] text-muted-foreground">/mes</span>
                </div>
              )}
            </div>

            {/* Specs */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {Object.entries(tier.specs).map(([k, v]) => (
                <div key={k} className="bg-muted rounded-lg p-2">
                  <p className="text-[9px] text-muted-foreground uppercase">{k}</p>
                  <input
                    className="text-xs font-bold bg-transparent outline-none text-center w-full"
                    value={v}
                    onChange={e => updateSpec(tier.id, k, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="space-y-1">
              {tier.features.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <input
                    className="text-xs flex-1 bg-transparent outline-none border-b border-transparent hover:border-border focus:border-border"
                    value={f}
                    onChange={e => updateFeature(tier.id, i, e.target.value)}
                  />
                  <button onClick={() => removeFeature(tier.id, i)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addFeature(tier.id)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Config tab ─────────────────────────────────────────────────
function ConfigTab({ methods, onSave, loading }) {
  const [items, setItems] = useState(methods)
  const [saving, setSaving] = useState(false)
  const [apiKeys, setApiKeys] = useState({
    stripe_key: '',
    izipay_merchant: '',
    nowpayments_key: '',
    admin_validation_key: import.meta.env.VITE_ADMIN_VALIDATION_KEY || '',
  })

  useEffect(() => { setItems(methods) }, [methods])

  function updateItem(id, field, value) {
    setItems(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(items)
    setSaving(false)
  }

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black">Configuración</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Métodos de pago y claves de integración</p>
      </div>

      {/* Payment methods */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Métodos de pago</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ background: '#e8441e' }}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Guardar
          </button>
        </div>
        <div className="divide-y divide-border">
          {items.map(method => (
            <div key={method.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl shrink-0">{method.icon}</span>
              <div className="flex-1 min-w-0 space-y-1">
                <input
                  className="text-sm font-semibold bg-transparent outline-none border-b border-transparent hover:border-border focus:border-border w-full"
                  value={method.name}
                  onChange={e => updateItem(method.id, 'name', e.target.value)}
                />
                <input
                  className="text-xs text-muted-foreground font-mono bg-transparent outline-none border-b border-transparent hover:border-border focus:border-border w-full"
                  value={method.detail}
                  onChange={e => updateItem(method.id, 'detail', e.target.value)}
                />
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={method.active}
                  onChange={e => updateItem(method.id, 'active', e.target.checked)}
                />
                <div className={`w-8 h-4 rounded-full transition-colors ${method.active ? 'bg-emerald-500' : 'bg-muted'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mt-0.5 ${method.active ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys (read-only display from env) */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Variables de entorno (VITE_*)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Configura estas variables en el archivo .env del admin dashboard</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { key: 'VITE_STORE_URL', desc: 'URL de la tienda online', example: 'http://localhost:3000' },
            { key: 'VITE_ADMIN_VALIDATION_KEY', desc: 'Clave para validar pagos desde el admin', example: 'nithrox-admin-2024' },
            { key: 'VITE_SUPABASE_URL', desc: 'URL del proyecto Supabase', example: 'https://xxx.supabase.co' },
            { key: 'VITE_SUPABASE_ANON_KEY', desc: 'Clave anon de Supabase', example: 'eyJhbGci...' },
          ].map(v => (
            <div key={v.key} className="px-4 py-3">
              <p className="text-xs font-mono font-bold">{v.key}</p>
              <p className="text-[11px] text-muted-foreground">{v.desc}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">Ejemplo: {v.example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Store integration */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Integración con la tienda</p>
        </div>
        <div className="px-4 py-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            La tienda online lee la configuración de planes, addons y hosting desde Supabase.<br />
            Endpoint: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">GET /api/store/config</code>
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-emerald-600 font-semibold">Supabase Realtime activo — los cambios se propagan en tiempo real</p>
          </div>
          <a
            href={`${STORE_URL}/api/store/config`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline mt-1"
          >
            <ArrowUpRight className="w-3 h-3" /> Ver config actual de la tienda
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
    </div>
  )
}
