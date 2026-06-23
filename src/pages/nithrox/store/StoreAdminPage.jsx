import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, Tag, Layers, Server, Settings,
  TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle2,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Edit2, Save,
  X, Plus, Trash2, Eye, ShoppingBag, Upload, Check,
  Globe, CreditCard, Zap, ArrowUpRight, MoreHorizontal,
  Users, MapPin, Activity, Copy, Terminal,
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
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
    if (error) toast.error(`Error cargando pedidos: ${error.message}`)
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
    if (error) {
      const msg = error.message || error.code || 'Error desconocido'
      toast.error(`Error al guardar: ${msg}`)
      if (msg.includes('does not exist') || msg.includes('relation')) {
        toast.error('La tabla store_config no existe. Ve a Config → SQL para crearla.', { duration: 6000 })
      }
      return false
    }
    toast.success('Guardado en Supabase ✓')
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
                <p className="text-sm font-semibold truncate">{order.profiles?.name || order.client_name || 'Cliente'}</p>
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

// ── Helpers ────────────────────────────────────────────────────
function inferFunnelStep(state) {
  if (!state?.plan) return { step: 0, label: 'Inicio', color: '#9ca3af' }
  if (state.domain) return { step: 6, label: 'En dominio', color: '#8b5cf6' }
  if (state.hosting) return { step: 5, label: 'En hosting', color: '#6366f1' }
  if (state.customization) return { step: 4, label: 'Personalizando', color: '#3b82f6' }
  if (state.plan) return { step: 2, label: 'Plan elegido', color: '#e8441e' }
  return { step: 1, label: 'Sin datos', color: '#9ca3af' }
}

// ── Pedidos tab ────────────────────────────────────────────────
function PedidosTab({ orders, loading, onRefresh }) {
  const [view, setView] = useState('orders') // 'orders' | 'tracking' | 'clientes'
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [expandedDraft, setExpandedDraft] = useState(null)
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)

  useEffect(() => {
    if (view === 'clientes') {
      setLoadingClients(true)
      supabase
        .from('profiles')
        .select('id, name, email, phone, company, role, created_at')
        .eq('role', 'client')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error) setClients(data || [])
          setLoadingClients(false)
        })
    }
    if (view !== 'tracking') return
    setLoadingDrafts(true)
    supabase
      .from('order_drafts')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setDrafts(data || [])
        setLoadingDrafts(false)
      })
  }, [view])

  useEffect(() => {
    const ch = supabase
      .channel('admin-order-drafts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_drafts' }, payload => {
        if (payload.eventType === 'INSERT') setDrafts(prev => [payload.new, ...prev])
        else if (payload.eventType === 'UPDATE') setDrafts(prev => prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } : d))
        else if (payload.eventType === 'DELETE') setDrafts(prev => prev.filter(d => d.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

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
      toast.success(`✅ Pago validado: ${order.profiles?.name || order.client_name || 'Cliente'}`)
    } catch {
      const { error } = await supabase.from('orders').update({ status: 'active', validated_at: new Date().toISOString() }).eq('id', order.id)
      if (error) { toast.error('Error al validar'); return }
      toast.success(`✅ Pago validado: ${order.profiles?.name || order.client_name || 'Cliente'}`)
    }
  }

  async function updateStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(`Estado actualizado: ${STATUS_CONFIG[status]?.label || status}`)
  }

  // Funnel stats from drafts
  const funnelSteps = [
    { label: 'Registros totales', count: drafts.length, color: '#6b7280' },
    { label: 'Eligieron plan', count: drafts.filter(d => d.state?.plan).length, color: '#e8441e' },
    { label: 'Personalizaron', count: drafts.filter(d => d.state?.customization).length, color: '#3b82f6' },
    { label: 'Eligieron hosting', count: drafts.filter(d => d.state?.hosting).length, color: '#6366f1' },
    { label: 'Eligieron dominio', count: drafts.filter(d => d.state?.domain).length, color: '#8b5cf6' },
    { label: 'Guardaron avance', count: drafts.filter(d => d.user_id).length, color: '#10b981' },
  ]

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Pedidos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Tiempo real via Supabase · {orders.length} pedidos · {drafts.length} borradores</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setView('orders')}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
          style={{ background: view === 'orders' ? 'hsl(var(--background))' : 'transparent', color: view === 'orders' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
        >
          <Package className="w-3 h-3" /> Pedidos ({orders.length})
        </button>
        <button
          onClick={() => setView('tracking')}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
          style={{ background: view === 'tracking' ? 'hsl(var(--background))' : 'transparent', color: view === 'tracking' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
        >
          <Activity className="w-3 h-3" /> Seguimiento ({drafts.length})
        </button>
        <button
          onClick={() => setView('clientes')}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
          style={{ background: view === 'clientes' ? 'hsl(var(--background))' : 'transparent', color: view === 'clientes' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
        >
          <Users className="w-3 h-3" /> Clientes ({clients.length})
        </button>
      </div>

      {/* ── ORDERS VIEW ─────────────────────────────────── */}
      {view === 'orders' && (
        <>
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
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : order.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                          {(order.profiles?.name || order.client_name || 'C')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">{order.profiles?.name || order.client_name || 'Cliente'}</p>
                            {needsValidation && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">Comprobante adjunto</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {order.plan_name} · {order.payment_method || 'Sin método'} · {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <p className="text-sm font-black shrink-0">S/ {Number(order.total_pen || 0).toLocaleString('es-PE')}</p>
                        <StatusBadge status={order.status} />
                        <div className="text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 bg-muted/20 border-t border-border space-y-3 pt-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground mb-0.5">Cliente</p>
                              <p className="font-semibold">{order.profiles?.name || order.client_name || '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-0.5">Email</p>
                              <p className="font-semibold">{order.profiles?.email || order.client_email || '—'}</p>
                            </div>
                            {order.client_phone && (
                              <div>
                                <p className="text-muted-foreground mb-0.5">Teléfono</p>
                                <p className="font-semibold">{order.client_phone}</p>
                              </div>
                            )}
                            {order.client_company && (
                              <div>
                                <p className="text-muted-foreground mb-0.5">Empresa</p>
                                <p className="font-semibold">{order.client_company}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground mb-0.5">Plan</p>
                              <p className="font-semibold">{order.plan_name || '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-0.5">Método de pago</p>
                              <p className="font-semibold">{order.payment_method || '—'}</p>
                            </div>
                            {order.items?.addons?.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground mb-0.5">Addons</p>
                                <p className="font-semibold">{order.items.addons.map(a => typeof a.name === 'object' ? a.name?.es : a.name).join(', ')}</p>
                              </div>
                            )}
                            {order.items?.hosting && !order.items.hosting._noHosting && (
                              <div>
                                <p className="text-muted-foreground mb-0.5">Hosting</p>
                                <p className="font-semibold">{typeof order.items.hosting.name === 'object' ? order.items.hosting.name?.es : order.items.hosting.name}</p>
                              </div>
                            )}
                            {order.items?.domain?.full && (
                              <div>
                                <p className="text-muted-foreground mb-0.5">Dominio</p>
                                <p className="font-semibold">{order.items.domain.full}</p>
                              </div>
                            )}
                            <div className="col-span-2">
                              <p className="text-muted-foreground mb-0.5">ID del pedido</p>
                              <p className="font-mono text-[10px] text-muted-foreground">{order.id}</p>
                            </div>
                            {order.voucher_url && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground mb-1">Comprobante adjunto</p>
                                <a href={order.voucher_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
                                  <Eye className="w-3 h-3" /> Ver comprobante
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap pt-1">
                            {needsValidation && (
                              <button onClick={() => validatePayment(order)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors" style={{ background: '#10b981' }}>
                                <Check className="w-3 h-3" /> Validar pago
                              </button>
                            )}
                            {order.status === 'active' && (
                              <button onClick={() => updateStatus(order.id, 'suspended')} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                                <X className="w-3 h-3" /> Suspender
                              </button>
                            )}
                            {order.status === 'suspended' && (
                              <button onClick={() => updateStatus(order.id, 'active')} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                                <Check className="w-3 h-3" /> Reactivar
                              </button>
                            )}
                            {order.status === 'pending' && (
                              <button onClick={() => updateStatus(order.id, 'active')} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors" style={{ background: '#e8441e' }}>
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
        </>
      )}

      {/* ── CLIENTES VIEW ──────────────────────────────── */}
      {view === 'clientes' && (
        loadingClients ? <LoadingState /> : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Clientes registrados en la tienda</p>
              <span className="text-[10px] text-muted-foreground">{clients.length} clientes</span>
            </div>
            {clients.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Ningún cliente registrado aún</p>
            ) : (
              <div className="divide-y divide-border">
                {clients.map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                      {(c.name || c.email || 'C')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name || '—'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {c.email}{c.company ? ` · ${c.company}` : ''}{c.phone ? ` · ${c.phone}` : ''}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* ── TRACKING VIEW ───────────────────────────────── */}
      {view === 'tracking' && (
        <>
          {loadingDrafts ? (
            <LoadingState />
          ) : (
            <>
              {/* Funnel stats */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {funnelSteps.map((step, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-muted-foreground font-medium">{step.label}</p>
                      <div className="w-2 h-2 rounded-full" style={{ background: step.color }} />
                    </div>
                    <p className="text-2xl font-black">{step.count}</p>
                    {i > 0 && funnelSteps[0].count > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{Math.round(step.count / funnelSteps[0].count * 100)}% del total</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Drafts list */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Borradores guardados</p>
                  <span className="text-[10px] text-muted-foreground">{drafts.length} registros · Realtime activo</span>
                </div>
                {drafts.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">No hay borradores guardados aún</p>
                ) : (
                  <div className="divide-y divide-border">
                    {drafts.map(draft => {
                      const st = draft.state || {}
                      const stepFromDB = draft.current_step
                      const { step, label, color } = inferFunnelStep(st)
                      const isOpen = expandedDraft === draft.id
                      const planName = st.plan?.name || '—'
                      const hostingName = st.hosting?._noHosting ? 'Sin hosting' : (typeof st.hosting?.name === 'object' ? st.hosting.name?.es : st.hosting?.name) || '—'
                      const domainName = st.domain?.full || '—'
                      const addonCount = (st.addons || []).length
                      const updatedAt = draft.updated_at ? new Date(draft.updated_at).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
                      const displayName = st.user_name || (draft.user_id ? `User ${draft.user_id.slice(0, 8)}…` : draft.session_id ? `Anón ${draft.session_id.slice(0, 8)}…` : 'Sin ID')
                      const displayId = displayName
                      const STEP_LABELS = { plan: 'Plan', account: 'Cuenta', customize: 'Proyecto', hosting: 'Hosting', domain: 'Dominio', addons: 'Extras', review: 'Resumen', contract: 'Contrato', payment: 'Pago' }
                      const stepLabel = STEP_LABELS[stepFromDB] || stepFromDB || label
                      return (
                        <div key={draft.id}>
                          <div
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => setExpandedDraft(isOpen ? null : draft.id)}
                          >
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{ background: color }}>
                              {step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold truncate">{displayId}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: color + '20', color }}>
                                  {stepLabel}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {st.user_email ? `${st.user_email} · ` : ''}{planName !== '—' ? `${planName}` : ''}{addonCount > 0 ? ` · ${addonCount} addon${addonCount > 1 ? 's' : ''}` : ''} · {updatedAt}
                              </p>
                            </div>
                            <div className="text-muted-foreground">
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>

                          {isOpen && (
                            <div className="px-4 pb-4 bg-muted/10 border-t border-border pt-3 space-y-3">
                              {/* User identity */}
                              {(st.user_name || st.user_email) && (
                                <div className="grid grid-cols-2 gap-3 text-xs pb-2 border-b border-border">
                                  {st.user_name && <div><p className="text-muted-foreground mb-0.5">Nombre</p><p className="font-semibold">{st.user_name}</p></div>}
                                  {st.user_email && <div><p className="text-muted-foreground mb-0.5">Email</p><p className="font-semibold truncate">{st.user_email}</p></div>}
                                  {st.user_phone && <div><p className="text-muted-foreground mb-0.5">Teléfono</p><p className="font-semibold">{st.user_phone}</p></div>}
                                  {st.user_company && <div><p className="text-muted-foreground mb-0.5">Empresa</p><p className="font-semibold">{st.user_company}</p></div>}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <p className="text-muted-foreground mb-0.5">Plan</p>
                                  <p className="font-semibold">{planName}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-0.5">Precio plan</p>
                                  <p className="font-semibold">{st.plan ? `S/ ${st.plan.price_pen}` : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-0.5">Hosting</p>
                                  <p className="font-semibold">{hostingName}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-0.5">Dominio</p>
                                  <p className="font-semibold">{domainName}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-0.5">Idioma / Moneda</p>
                                  <p className="font-semibold">{st.lang?.toUpperCase() || 'ES'} · {st.currency || 'PEN'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-0.5">Promo</p>
                                  <p className="font-semibold">{st.promoCode || '—'} {st.promoDiscount > 0 ? `(${st.promoDiscount}%)` : ''}</p>
                                </div>
                              </div>
                              {(st.addons || []).length > 0 && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Addons seleccionados</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {st.addons.map((a, i) => (
                                      <span key={i} className="text-[11px] bg-muted px-2 py-0.5 rounded-full font-medium">
                                        {typeof a.name === 'object' ? (a.name?.es || a.name?.en) : a.name} · S/{a.price_pen}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {st.customization && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Personalización</p>
                                  <p className="text-xs font-mono bg-muted rounded px-2 py-1.5 overflow-x-auto">{JSON.stringify(st.customization, null, 2)}</p>
                                </div>
                              )}
                              <div className="flex gap-4 text-[10px] text-muted-foreground">
                                <span>Draft: <span className="font-mono">{draft.id?.slice(0, 12)}…</span></span>
                                {draft.session_id && <span>Session: <span className="font-mono">{draft.session_id.slice(0, 12)}…</span></span>}
                                {draft.user_id && <span>User: <span className="font-mono">{draft.user_id.slice(0, 12)}…</span></span>}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
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

      {/* SQL Migration */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">SQL — Crear tablas si no existen</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-xs text-muted-foreground">Si "Guardar" muestra error de tabla no encontrada, ejecuta este SQL en el editor de Supabase (Database → SQL Editor):</p>
          <pre className="text-[10px] font-mono bg-muted rounded-lg p-3 overflow-x-auto leading-relaxed text-muted-foreground">{`-- CORRE ESTO COMPLETO EN SUPABASE → SQL EDITOR
-- Paso 1: función helper (evita recursión RLS)
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- Paso 2: fix política recursiva en profiles
drop policy if exists "Admins can read all profiles" on profiles;
create policy "Admins can read all profiles" on profiles for select using (is_admin());

-- Paso 3: store_config
create table if not exists store_config (
  id text primary key, value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table store_config enable row level security;
drop policy if exists "Anyone can read store_config" on store_config;
drop policy if exists "Admins can manage store_config" on store_config;
create policy "Anyone can read store_config" on store_config for select using (true);
create policy "Admins can manage store_config" on store_config for all
  using (is_admin()) with check (is_admin());

-- Paso 4: order_drafts
create table if not exists order_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, session_id text, current_step text,
  state jsonb, updated_at timestamptz not null default now()
);
create unique index if not exists order_drafts_user_id_idx
  on order_drafts(user_id) where user_id is not null;
create unique index if not exists order_drafts_session_id_idx
  on order_drafts(session_id) where session_id is not null and user_id is null;
alter table order_drafts enable row level security;
drop policy if exists "Anyone can upsert drafts" on order_drafts;
create policy "Anyone can upsert drafts" on order_drafts for all using (true) with check (true);

-- Paso 5: orders (si no existe)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  plan_id text, plan_name text, items jsonb, total_pen numeric(10,2),
  status text not null default 'pending', payment_method text,
  payment_id text, signature_url text, notes text,
  client_name text, client_email text, client_phone text, client_company text,
  validated_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table orders enable row level security;
drop policy if exists "Users can read own orders" on orders;
drop policy if exists "Users can insert own orders" on orders;
drop policy if exists "Admins can read all orders" on orders;
drop policy if exists "Admins can update orders" on orders;
create policy "Users can read own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on orders for insert with check (auth.uid() = user_id or user_id is null);
create policy "Admins can read all orders" on orders for select using (is_admin());
create policy "Admins can update orders" on orders for update using (is_admin());

-- Paso 6: sync role → JWT
create or replace function sync_role_to_jwt()
returns trigger language plpgsql security definer as $$
begin
  update auth.users set raw_app_meta_data =
    coalesce(raw_app_meta_data,'{}') || jsonb_build_object('role', new.role)
  where id = new.id; return new;
end;$$;
drop trigger if exists on_profile_role_change on profiles;
create trigger on_profile_role_change after insert or update of role on profiles
  for each row execute function sync_role_to_jwt();
update profiles set role = role;`}</pre>
          <button
            onClick={() => {
              const sql = `create or replace function is_admin() returns boolean language sql security definer stable as $$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;\ndrop policy if exists "Admins can read all profiles" on profiles;\ncreate policy "Admins can read all profiles" on profiles for select using (is_admin());\ncreate table if not exists store_config (id text primary key, value jsonb not null default '{}', updated_at timestamptz not null default now());\nalter table store_config enable row level security;\ndrop policy if exists "Anyone can read store_config" on store_config;\ndrop policy if exists "Admins can manage store_config" on store_config;\ncreate policy "Anyone can read store_config" on store_config for select using (true);\ncreate policy "Admins can manage store_config" on store_config for all using (is_admin()) with check (is_admin());\ncreate table if not exists order_drafts (id uuid primary key default gen_random_uuid(), user_id uuid, session_id text, current_step text, state jsonb, updated_at timestamptz not null default now());\ncreate unique index if not exists order_drafts_user_id_idx on order_drafts(user_id) where user_id is not null;\ncreate unique index if not exists order_drafts_session_id_idx on order_drafts(session_id) where session_id is not null and user_id is null;\nalter table order_drafts enable row level security;\ndrop policy if exists "Anyone can upsert drafts" on order_drafts;\ncreate policy "Anyone can upsert drafts" on order_drafts for all using (true) with check (true);`
              navigator.clipboard.writeText(sql)
              toast.success('SQL copiado al portapapeles')
            }}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Copy className="w-3 h-3" /> Copiar SQL
          </button>
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
