import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  ShoppingBag, Package, FileText, Key, ShoppingCart, Settings2,
  Plus, Trash2, Eye, EyeOff, Copy, Check, ExternalLink,
  Save, ToggleLeft, ToggleRight, ChevronDown, X, RefreshCw,
  DollarSign, Tag, CreditCard, Globe, AlertCircle, Clock,
  CheckCircle2, XCircle, Loader2
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Constants & defaults
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'planes',    label: 'Planes',        icon: Package },
  { id: 'addons',   label: 'Addons',         icon: Tag },
  { id: 'contrato', label: 'Contrato',       icon: FileText },
  { id: 'apikeys',  label: 'API Keys',       icon: Key },
  { id: 'pedidos',  label: 'Pedidos',        icon: ShoppingCart },
  { id: 'general',  label: 'Configuración',  icon: Settings2 },
]

const DEFAULT_PLANS = [
  {
    id: 'plan_kit-digital',
    name: 'Kit Digital',
    tagline: 'Tu presencia online desde cero',
    price: 1200,
    billing: 'year',
    active: true,
    features: [
      'Dominio .com por 1 año',
      'Hosting SSD 10 GB',
      'Email corporativo x5',
      'Sitio web 5 páginas',
      'SSL gratuito',
      'Soporte básico',
    ],
  },
  {
    id: 'plan_business',
    name: 'Business',
    tagline: 'Para negocios que quieren crecer',
    price: 2400,
    billing: 'year',
    active: true,
    features: [
      'Todo lo de Kit Digital',
      'Hosting SSD 25 GB',
      'Email corporativo ilimitado',
      'Sitio web hasta 15 páginas',
      'Blog integrado',
      'SEO básico',
      'Soporte prioritario',
    ],
  },
  {
    id: 'plan_ecommerce',
    name: 'Ecommerce',
    tagline: 'Vende en línea con todo incluido',
    price: 3600,
    billing: 'year',
    active: true,
    features: [
      'Todo lo de Business',
      'Tienda online completa',
      'Pasarela de pago integrada',
      'Gestión de inventario',
      'Reportes de ventas',
      'App móvil PWA',
      'Soporte 24/7',
    ],
  },
]

const DEFAULT_ADDONS = [
  {
    id: 'addon_logo',
    name_es: 'Diseño de Logo',
    name_en: 'Logo Design',
    description_es: 'Logo profesional con variantes',
    description_en: 'Professional logo with variants',
    price: 299,
    billing: 'once',
    available_for: ['plan_kit-digital', 'plan_business', 'plan_ecommerce'],
    active: true,
  },
  {
    id: 'addon_seo',
    name_es: 'SEO Avanzado',
    name_en: 'Advanced SEO',
    description_es: 'Optimización para buscadores',
    description_en: 'Search engine optimization',
    price: 150,
    billing: 'year',
    available_for: ['plan_business', 'plan_ecommerce'],
    active: true,
  },
]

const CONTRACT_VARS = [
  '{{CLIENT_NAME}}',
  '{{CLIENT_EMAIL}}',
  '{{CLIENT_COMPANY}}',
  '{{PLAN_NAME}}',
  '{{TOTAL}}',
  '{{DATE}}',
]

const DEFAULT_CONTRACT = `CONTRATO DE SERVICIOS DIGITALES

Entre Nithrox y {{CLIENT_NAME}} ({{CLIENT_COMPANY}})

Fecha: {{DATE}}
Email: {{CLIENT_EMAIL}}

SERVICIOS CONTRATADOS
Plan: {{PLAN_NAME}}
Total: {{TOTAL}}

TÉRMINOS Y CONDICIONES

1. ALCANCE DEL SERVICIO
Los servicios descritos en el plan seleccionado serán prestados por Nithrox según los estándares de calidad establecidos.

2. PAGO
El cliente se compromete a realizar el pago dentro de los 5 días hábiles siguientes a la firma de este contrato.

3. ENTREGA
El tiempo de entrega estimado se comunicará al cliente por correo electrónico una vez confirmado el pago.

4. PROPIEDAD INTELECTUAL
Una vez completado el pago total, todos los archivos y diseños entregados son propiedad del cliente.

5. SOPORTE
El soporte está incluido según el plan contratado.

Firmado electrónicamente por ambas partes.

— Nithrox —`

const API_KEY_GROUPS = [
  {
    label: '20i Hosting',
    keys: [
      { key: 'TWENTYI_API_KEY', label: '20i API Key', type: 'password' },
    ],
  },
  {
    label: 'RealTime Domains',
    keys: [
      { key: 'REALTIME_API_USER', label: 'API User', type: 'text' },
      { key: 'REALTIME_API_KEY', label: 'API Key', type: 'password' },
    ],
  },
  {
    label: 'Stripe',
    keys: [
      { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', type: 'password' },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', type: 'password' },
      { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Publishable Key', type: 'text' },
    ],
  },
  {
    label: 'Izipay',
    keys: [
      { key: 'IZIPAY_MERCHANT_ID', label: 'Merchant ID', type: 'text' },
      { key: 'IZIPAY_KEY_SERVER', label: 'Key Server', type: 'password' },
      { key: 'IZIPAY_KEY_CLIENT', label: 'Key Client', type: 'password' },
    ],
  },
  {
    label: 'PayPal',
    keys: [
      { key: 'PAYPAL_CLIENT_ID', label: 'Client ID', type: 'text' },
      { key: 'PAYPAL_SECRET', label: 'Secret', type: 'password' },
    ],
  },
  {
    label: 'NOWPayments',
    keys: [
      { key: 'NOWPAYMENTS_API_KEY', label: 'API Key', type: 'password' },
      { key: 'NOWPAYMENTS_IPN_SECRET', label: 'IPN Secret', type: 'password' },
    ],
  },
]

const ORDER_STATUS = {
  pending:   { label: 'Pendiente',    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  paid:      { label: 'Pagado',       cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  active:    { label: 'Activo',       cls: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelado',    cls: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
  validating: { label: 'Validando',   cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
}

const MANUAL_METHODS = ['transfer', 'transferencia', 'crypto', 'nowpayments']
const METHOD_ICONS   = {
  stripe:      '💳',
  izipay:      '🏦',
  paypal:      '🅿️',
  transfer:    '🏧',
  transferencia: '🏧',
  crypto:      '₿',
  nowpayments: '₿',
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${value ? 'bg-foreground' : 'bg-muted'}`}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
        style={{ left: value ? '22px' : '2px' }}
      />
    </button>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className={`w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-foreground transition-colors ${props.className || ''}`}
    />
  )
}

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-foreground transition-colors resize-none ${props.className || ''}`}
    />
  )
}

function SaveBtn({ onClick, loading, children = 'Guardar' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 bg-foreground text-background text-xs font-bold px-4 py-1.5 rounded-full hover:opacity-80 disabled:opacity-50 transition-opacity uppercase tracking-wider"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Planes
// ─────────────────────────────────────────────────────────────────────────────

function PlanCard({ plan, onChange, onSave, saving }) {
  const [features, setFeatures] = useState(plan.features || [])

  useEffect(() => { setFeatures(plan.features || []) }, [plan.id])

  const updateFeature = (i, val) => {
    const next = [...features]
    next[i] = val
    setFeatures(next)
    onChange({ ...plan, features: next })
  }

  const addFeature = () => {
    const next = [...features, '']
    setFeatures(next)
    onChange({ ...plan, features: next })
  }

  const removeFeature = (i) => {
    const next = features.filter((_, j) => j !== i)
    setFeatures(next)
    onChange({ ...plan, features: next })
  }

  const billingLabel = plan.billing === 'year' ? '/año' : 'pago único'

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/30">
        <div className="flex items-center gap-2">
          <Toggle value={plan.active} onChange={(v) => onChange({ ...plan, active: v })} />
          <span className={`text-[10px] font-bold uppercase ${plan.active ? 'text-green-600' : 'text-muted-foreground'}`}>
            {plan.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <SaveBtn onClick={() => onSave(plan)} loading={saving} />
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit form */}
        <div className="space-y-4">
          <Field label="Nombre del plan">
            <Input
              value={plan.name}
              onChange={e => onChange({ ...plan, name: e.target.value })}
              placeholder="Ej: Kit Digital"
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={plan.tagline}
              onChange={e => onChange({ ...plan, tagline: e.target.value })}
              placeholder="Descripción corta del plan"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio (PEN)">
              <Input
                type="number"
                value={plan.price}
                onChange={e => onChange({ ...plan, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </Field>
            <Field label="Facturación">
              <select
                value={plan.billing}
                onChange={e => onChange({ ...plan, billing: e.target.value })}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-foreground"
              >
                <option value="year">Anual</option>
                <option value="once">Pago único</option>
                <option value="month">Mensual</option>
              </select>
            </Field>
          </div>
          <Field label="Características incluidas">
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-500 text-xs shrink-0">✓</span>
                  <input
                    value={f}
                    onChange={e => updateFeature(i, e.target.value)}
                    className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none focus:border-foreground"
                    placeholder="Característica..."
                  />
                  <button onClick={() => removeFeature(i)} className="text-muted-foreground hover:text-red-500 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addFeature}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar característica
              </button>
            </div>
          </Field>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Vista previa</p>
          <div className="border border-border rounded-2xl p-5 bg-accent/10 space-y-3">
            <div>
              <p className="text-lg font-black uppercase tracking-tight">{plan.name || 'Plan'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{plan.tagline || 'Descripción del plan'}</p>
            </div>
            <div>
              <span className="text-3xl font-black">S/ {plan.price?.toLocaleString('es-PE') || '0'}</span>
              <span className="text-xs text-muted-foreground ml-1">{billingLabel}</span>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-border">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span>{f || '—'}</span>
                </div>
              ))}
            </div>
            <button className="w-full bg-foreground text-background text-xs font-bold py-2.5 rounded-xl mt-2 hover:opacity-80">
              Contratar ahora →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanesTab() {
  const [plans, setPlans] = useState(DEFAULT_PLANS)
  const [saving, setSaving] = useState({})

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('store_config')
        .select('id, value')
        .in('id', DEFAULT_PLANS.map(p => p.id))

      if (error) return
      if (data?.length) {
        setPlans(prev => prev.map(p => {
          const row = data.find(d => d.id === p.id)
          return row ? { ...p, ...row.value } : p
        }))
      }
    }
    load()
  }, [])

  const handleChange = (updated) => {
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  const handleSave = async (plan) => {
    setSaving(s => ({ ...s, [plan.id]: true }))
    try {
      const { error } = await supabase
        .from('store_config')
        .upsert({ id: plan.id, value: plan }, { onConflict: 'id' })
      if (error) throw error
      toast.success(`Plan "${plan.name}" guardado`)
    } catch (err) {
      toast.error(`Error al guardar: ${err.message}`)
    } finally {
      setSaving(s => ({ ...s, [plan.id]: false }))
    }
  }

  return (
    <div className="space-y-5">
      {plans.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onChange={handleChange}
          onSave={handleSave}
          saving={saving[plan.id]}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Addons
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_OPTIONS = [
  { value: 'plan_kit-digital', label: 'Kit Digital' },
  { value: 'plan_business', label: 'Business' },
  { value: 'plan_ecommerce', label: 'Ecommerce' },
]

function AddonRow({ addon, onChange, onDelete }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-accent/20 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Toggle value={addon.active} onChange={(v) => onChange({ ...addon, active: v })} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{addon.name_es || 'Sin nombre'}</p>
          <p className="text-[10px] text-muted-foreground">
            S/ {addon.price} · {addon.billing === 'once' ? 'pago único' : addon.billing === 'year' ? 'anual' : 'mensual'}
            {' · '}Para: {(addon.available_for || []).map(id => PLAN_OPTIONS.find(p => p.value === id)?.label || id).join(', ') || 'todos'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete(addon.id) }}
            className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre (ES)">
              <Input value={addon.name_es} onChange={e => onChange({ ...addon, name_es: e.target.value })} placeholder="Nombre en español" />
            </Field>
            <Field label="Nombre (EN)">
              <Input value={addon.name_en} onChange={e => onChange({ ...addon, name_en: e.target.value })} placeholder="Name in English" />
            </Field>
            <Field label="Descripción (ES)">
              <Textarea rows={2} value={addon.description_es} onChange={e => onChange({ ...addon, description_es: e.target.value })} placeholder="Descripción en español" />
            </Field>
            <Field label="Descripción (EN)">
              <Textarea rows={2} value={addon.description_en} onChange={e => onChange({ ...addon, description_en: e.target.value })} placeholder="Description in English" />
            </Field>
            <Field label="Precio (PEN)">
              <Input type="number" value={addon.price} onChange={e => onChange({ ...addon, price: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
            </Field>
            <Field label="Facturación">
              <select
                value={addon.billing}
                onChange={e => onChange({ ...addon, billing: e.target.value })}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-foreground"
              >
                <option value="once">Pago único</option>
                <option value="year">Anual</option>
                <option value="month">Mensual</option>
              </select>
            </Field>
          </div>
          <Field label="Disponible para">
            <div className="flex gap-2 flex-wrap mt-1">
              {PLAN_OPTIONS.map(p => {
                const selected = (addon.available_for || []).includes(p.value)
                return (
                  <button
                    key={p.value}
                    onClick={() => {
                      const current = addon.available_for || []
                      const next = selected
                        ? current.filter(x => x !== p.value)
                        : [...current, p.value]
                      onChange({ ...addon, available_for: next })
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${selected ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/50'}`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
      )}
    </div>
  )
}

function AddonsTab() {
  const [addons, setAddons] = useState(DEFAULT_ADDONS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('store_config')
        .select('value')
        .eq('id', 'addons')
        .maybeSingle()
      if (!error && data?.value) setAddons(data.value)
    }
    load()
  }, [])

  const handleChange = (updated) => {
    setAddons(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  const handleDelete = (id) => {
    setAddons(prev => prev.filter(a => a.id !== id))
    toast.success('Addon eliminado — recuerda guardar todos los cambios')
  }

  const handleAdd = () => {
    setAddons(prev => [...prev, {
      id: `addon_${Date.now()}`,
      name_es: '',
      name_en: '',
      description_es: '',
      description_en: '',
      price: 0,
      billing: 'once',
      available_for: ['plan_kit-digital', 'plan_business', 'plan_ecommerce'],
      active: true,
    }])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('store_config')
        .upsert({ id: 'addons', value: addons }, { onConflict: 'id' })
      if (error) throw error
      toast.success('Addons guardados correctamente')
    } catch (err) {
      toast.error(`Error al guardar: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{addons.length} addon{addons.length !== 1 ? 's' : ''} configurados</p>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 border border-border text-xs font-bold px-4 py-1.5 rounded-full hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo addon
          </button>
          <SaveBtn onClick={handleSave} loading={saving}>Guardar todos</SaveBtn>
        </div>
      </div>

      {addons.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest">Sin addons</p>
          <p className="text-xs mt-1">Agrega servicios adicionales que los clientes pueden contratar</p>
        </div>
      ) : (
        addons.map(addon => (
          <AddonRow key={addon.id} addon={addon} onChange={handleChange} onDelete={handleDelete} />
        ))
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Contrato
// ─────────────────────────────────────────────────────────────────────────────

function ContratoTab() {
  const [content, setContent] = useState(DEFAULT_CONTRACT)
  const [saving, setSaving] = useState(false)
  const [versions, setVersions] = useState([])
  const textareaRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('id, content, version, created_at, active')
        .order('version', { ascending: false })
        .limit(6)
      if (!error && data?.length) {
        const active = data.find(d => d.active)
        if (active) setContent(active.content)
        setVersions(data)
      }
    }
    load()
  }, [])

  const insertVar = (variable) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = content.slice(0, start) + variable + content.slice(end)
    setContent(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Deactivate previous versions
      await supabase.from('contract_templates').update({ active: false }).eq('active', true)

      const nextVersion = (versions[0]?.version || 0) + 1
      const { error } = await supabase
        .from('contract_templates')
        .insert({ content, version: nextVersion, active: true })
      if (error) throw error

      // Reload versions
      const { data } = await supabase
        .from('contract_templates')
        .select('id, content, version, created_at, active')
        .order('version', { ascending: false })
        .limit(6)
      if (data) setVersions(data)
      toast.success(`Contrato guardado — versión ${nextVersion}`)
    } catch (err) {
      toast.error(`Error al guardar: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const restoreVersion = (v) => {
    setContent(v.content)
    toast.success(`Versión ${v.version} cargada — guarda para activarla`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        {/* Variable chips */}
        <div className="bg-background border border-border rounded-2xl p-4 space-y-2">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Variables disponibles — haz click para insertar</p>
          <div className="flex flex-wrap gap-2">
            {CONTRACT_VARS.map(v => (
              <button
                key={v}
                onClick={() => insertVar(v)}
                className="px-2.5 py-1 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-lg text-xs font-mono transition-colors hover:border-foreground/30"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/20">
            <p className="text-xs font-bold uppercase tracking-widest">Editor de contrato</p>
            <SaveBtn onClick={handleSave} loading={saving}>Guardar nueva versión</SaveBtn>
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={24}
            className="w-full px-5 py-4 text-sm font-mono bg-background outline-none resize-none leading-relaxed"
            placeholder="Escribe el contrato aquí..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Version history */}
      <div className="space-y-3">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Historial de versiones</p>
        {versions.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">Sin versiones guardadas</p>
          </div>
        ) : (
          versions.slice(0, 5).map(v => (
            <div
              key={v.id}
              className={`bg-background border rounded-xl p-4 space-y-2 ${v.active ? 'border-green-400 dark:border-green-700' : 'border-border'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black">v{v.version}</span>
                  {v.active && (
                    <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Activa</span>
                  )}
                </div>
                {!v.active && (
                  <button
                    onClick={() => restoreVersion(v)}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Restaurar
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {new Date(v.created_at).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 font-mono opacity-60">
                {v.content.slice(0, 80)}...
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: API Keys
// ─────────────────────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState({})
  const [visible, setVisible] = useState({})
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('store_config')
        .select('value')
        .eq('id', 'api_keys')
        .maybeSingle()
      if (!error && data?.value) setKeys(data.value)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('store_config')
        .upsert({ id: 'api_keys', value: keys }, { onConflict: 'id' })
      if (error) throw error
      toast.success('API Keys guardadas correctamente')
    } catch (err) {
      toast.error(`Error al guardar: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const copyEnv = () => {
    const lines = ['# Nithrox Store — .env.local', '# Generado desde el panel admin', '']
    API_KEY_GROUPS.forEach(group => {
      lines.push(`# ${group.label}`)
      group.keys.forEach(({ key }) => {
        lines.push(`${key}=${keys[key] || ''}`)
      })
      lines.push('')
    })
    navigator.clipboard?.writeText(lines.join('\n'))
    setCopied('env')
    toast.success('.env.local copiado al portapapeles')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Notice */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Las keys se guardan en Supabase encriptadas. Para mayor seguridad, configúralas también en tu{' '}
          <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code>
        </p>
      </div>

      {/* Groups */}
      {API_KEY_GROUPS.map(group => (
        <div key={group.label} className="bg-background border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-accent/20">
            <p className="text-xs font-bold uppercase tracking-widest">{group.label}</p>
          </div>
          <div className="p-5 space-y-3">
            {group.keys.map(({ key, label, type }) => {
              const hasValue = !!keys[key]
              const isVisible = visible[key]
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${hasValue ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {hasValue ? 'Guardado' : 'Sin configurar'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type={type === 'password' && !isVisible ? 'password' : 'text'}
                      value={keys[key] || ''}
                      onChange={e => setKeys(k => ({ ...k, [key]: e.target.value }))}
                      placeholder={`${key}=...`}
                      className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-foreground font-mono text-xs transition-colors"
                    />
                    {type === 'password' && (
                      <button
                        onClick={() => setVisible(v => ({ ...v, [key]: !v[key] }))}
                        className="p-2 border border-border rounded-xl hover:bg-accent transition-colors shrink-0"
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <SaveBtn onClick={handleSave} loading={saving}>Guardar todas las keys</SaveBtn>
        <button
          onClick={copyEnv}
          className="flex items-center gap-1.5 border border-border text-xs font-bold px-4 py-1.5 rounded-full hover:bg-accent transition-colors"
        >
          {copied === 'env' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          Copiar .env
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Pedidos
// ─────────────────────────────────────────────────────────────────────────────

function PedidosTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState({})

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id ( name, email )
        `)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      toast.error(`Error cargando pedidos: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()

    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadOrders])

  const validatePayment = async (order) => {
    setActionLoading(a => ({ ...a, [order.id]: 'validating' }))
    try {
      // Step 1: Mark as validating immediately
      await supabase
        .from('orders')
        .update({ status: 'validating' })
        .eq('id', order.id)

      // Step 2: Call store's validate API to trigger full provisioning
      // (hosting on 20i, domain on RealTime, CRM activation)
      const storeUrl = import.meta.env.VITE_STORE_URL || 'https://nithrox-store.vercel.app'
      const adminKey = import.meta.env.VITE_ADMIN_VALIDATION_KEY || 'nithrox-admin-2024'

      let provisioningResult = null
      try {
        const res = await fetch(`${storeUrl}/api/orders/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: order.id, admin_key: adminKey }),
        })
        if (res.ok) {
          provisioningResult = await res.json()
        }
      } catch (provErr) {
        console.warn('[validate] Store API unreachable, marking paid manually:', provErr)
        // Fallback: just mark as paid in Supabase directly
        await supabase
          .from('orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', order.id)
      }

      const shortId = `#${order.id.slice(-6).toUpperCase()}`
      if (provisioningResult?.success) {
        const details = [
          provisioningResult.hosting_provisioned ? '✓ Hosting activado' : null,
          provisioningResult.domain_registered   ? '✓ Dominio registrado' : null,
        ].filter(Boolean).join(' · ')
        toast.success(`Pago ${shortId} validado${details ? ` · ${details}` : ''}`)
      } else {
        toast.success(`Pago ${shortId} validado. Provisioning en proceso.`)
      }
      loadOrders()
    } catch (err) {
      toast.error(`Error al validar: ${err.message}`)
    } finally {
      setActionLoading(a => ({ ...a, [order.id]: null }))
    }
  }

  const cancelOrder = async (order) => {
    setActionLoading(a => ({ ...a, [order.id]: 'cancelling' }))
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
      if (error) throw error
      toast.success(`Pedido #${order.id.slice(-6).toUpperCase()} cancelado`)
      loadOrders()
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setActionLoading(a => ({ ...a, [order.id]: null }))
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusCounts = Object.keys(ORDER_STATUS).reduce((acc, k) => {
    acc[k] = orders.filter(o => o.status === k).length
    return acc
  }, {})

  const manualPending = orders.filter(o => o.status === 'pending' && MANUAL_METHODS.includes(o.payment_method))

  return (
    <div className="space-y-5">
      {/* Banner: manual payments pending validation */}
      {manualPending.length > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-2xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-800/40 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
              {manualPending.length} pago{manualPending.length > 1 ? 's' : ''} manual{manualPending.length > 1 ? 'es' : ''} pendiente{manualPending.length > 1 ? 's' : ''} de validación
            </p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
              Transferencia o cripto — verifica el comprobante y haz clic en "Validar pago"
            </p>
          </div>
          <button
            onClick={() => setFilter('pending')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-100 dark:bg-orange-800/40 px-3 py-1.5 rounded-lg flex-shrink-0"
          >
            Ver pendientes
          </button>
        </div>
      )}

      {/* Filter + reload */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-foreground text-background' : 'border border-border hover:bg-accent'}`}
          >
            Todos ({orders.length})
          </button>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === k ? 'bg-foreground text-background' : 'border border-border hover:bg-accent'}`}
            >
              {v.label} ({statusCounts[k] || 0})
            </button>
          ))}
        </div>
        <button
          onClick={loadOrders}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando pedidos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <ShoppingCart className="w-10 h-10 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Sin pedidos</p>
            <p className="text-xs">
              {filter !== 'all' ? `No hay pedidos con estado "${ORDER_STATUS[filter]?.label}"` : 'Aún no se ha recibido ningún pedido'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  <th className="text-left px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Pedido</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cliente</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Plan</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Método</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Estado</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Fecha</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(order => {
                  const st = ORDER_STATUS[order.status] || { label: order.status, cls: 'bg-muted text-muted-foreground' }
                  const isLoading = actionLoading[order.id]
                  return (
                    <tr key={order.id} className={`hover:bg-accent/20 transition-colors ${order.status === 'pending' && MANUAL_METHODS.includes(order.payment_method) ? 'bg-orange-50/40 dark:bg-orange-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-mono text-xs font-bold">#{order.id.slice(-6).toUpperCase()}</span>
                          {order.items?.is_phased && (
                            <div className="text-[9px] text-orange-500 font-bold mt-0.5 uppercase tracking-wide">4 fases</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold truncate max-w-[120px]">{order.profiles?.name || '—'}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{order.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-bold truncate max-w-[100px]">{order.plan_name || order.plan_id || '—'}</p>
                          {order.items?.first_payment_pen && order.items?.first_payment_pen !== order.total_pen && (
                            <p className="text-[10px] text-orange-500 font-bold">1er pago: S/ {parseFloat(order.items.first_payment_pen || 0).toLocaleString('es-PE')}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-xs font-bold">S/ {parseFloat(order.total_pen || order.total || 0).toLocaleString('es-PE')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span>{METHOD_ICONS[order.payment_method] || '💳'}</span>
                          <div>
                            <span className="text-xs capitalize">{order.payment_method || '—'}</span>
                            {MANUAL_METHODS.includes(order.payment_method) && (
                              <div className="text-[9px] text-orange-500 font-bold">Manual</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-muted-foreground">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('es-PE') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {(order.status === 'pending' || order.status === 'validating') && (
                            <button
                              onClick={() => validatePayment(order)}
                              disabled={!!isLoading}
                              className={`flex items-center gap-1 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                MANUAL_METHODS.includes(order.payment_method)
                                  ? 'bg-orange-500 hover:bg-orange-600'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {isLoading === 'validating' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              {MANUAL_METHODS.includes(order.payment_method) ? 'Validar pago' : 'Activar'}
                            </button>
                          )}
                          {['pending', 'paid', 'validating'].includes(order.status) && (
                            <button
                              onClick={() => cancelOrder(order)}
                              disabled={!!isLoading}
                              className="flex items-center gap-1 border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isLoading === 'cancelling' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Configuración General
// ─────────────────────────────────────────────────────────────────────────────

function GeneralTab() {
  const [exchangeRate, setExchangeRate] = useState({ pen_to_usd: 3.7 })
  const [bankDetails, setBankDetails] = useState({ banco: '', cuenta: '', cci: '', beneficiario: '' })
  const [promoCodes, setPromoCodes] = useState([])
  const [storeUrl, setStoreUrl] = useState('https://store.nithrox.com')
  const [saving, setSaving] = useState({})
  const [newPromo, setNewPromo] = useState({ code: '', discount: 10 })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('store_config')
        .select('id, value')
        .in('id', ['exchange_rate', 'bank_details', 'promo_codes', 'store_url'])
      if (data) {
        data.forEach(row => {
          if (row.id === 'exchange_rate') setExchangeRate(row.value)
          if (row.id === 'bank_details') setBankDetails(row.value)
          if (row.id === 'promo_codes') setPromoCodes(row.value || [])
          if (row.id === 'store_url') setStoreUrl(row.value?.url || storeUrl)
        })
      }
    }
    load()
  }, [])

  const save = async (id, value, label) => {
    setSaving(s => ({ ...s, [id]: true }))
    try {
      const { error } = await supabase
        .from('store_config')
        .upsert({ id, value }, { onConflict: 'id' })
      if (error) throw error
      toast.success(`${label} guardado`)
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setSaving(s => ({ ...s, [id]: false }))
    }
  }

  const addPromo = () => {
    if (!newPromo.code.trim()) return
    const updated = [...promoCodes, { ...newPromo, code: newPromo.code.toUpperCase().trim(), id: Date.now() }]
    setPromoCodes(updated)
    setNewPromo({ code: '', discount: 10 })
  }

  const deletePromo = (id) => {
    setPromoCodes(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Store URL */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/20">
          <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> URL de la tienda
          </p>
          <div className="flex gap-2">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-border text-xs font-bold px-3 py-1.5 rounded-full hover:bg-accent transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Ir a la tienda
            </a>
            <SaveBtn onClick={() => save('store_url', { url: storeUrl }, 'URL')} loading={saving.store_url} />
          </div>
        </div>
        <div className="p-5">
          <Input
            value={storeUrl}
            onChange={e => setStoreUrl(e.target.value)}
            placeholder="https://store.nithrox.com"
          />
        </div>
      </div>

      {/* Exchange rate */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/20">
          <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" /> Tipo de cambio S/ → USD
          </p>
          <SaveBtn onClick={() => save('exchange_rate', exchangeRate, 'Tipo de cambio')} loading={saving.exchange_rate} />
        </div>
        <div className="p-5">
          <Field label="S/ por 1 USD">
            <div className="flex items-center gap-3 max-w-xs">
              <Input
                type="number"
                step="0.01"
                value={exchangeRate.pen_to_usd}
                onChange={e => setExchangeRate({ pen_to_usd: parseFloat(e.target.value) || 3.7 })}
                placeholder="3.70"
              />
              <p className="text-xs text-muted-foreground shrink-0">
                USD 1 = S/ {exchangeRate.pen_to_usd}
              </p>
            </div>
          </Field>
        </div>
      </div>

      {/* Bank details */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/20">
          <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" /> Datos bancarios (transferencia)
          </p>
          <SaveBtn onClick={() => save('bank_details', bankDetails, 'Datos bancarios')} loading={saving.bank_details} />
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Banco">
            <Input value={bankDetails.banco} onChange={e => setBankDetails(b => ({ ...b, banco: e.target.value }))} placeholder="BCP, Interbank..." />
          </Field>
          <Field label="Nº de Cuenta">
            <Input value={bankDetails.cuenta} onChange={e => setBankDetails(b => ({ ...b, cuenta: e.target.value }))} placeholder="191-..." />
          </Field>
          <Field label="CCI">
            <Input value={bankDetails.cci} onChange={e => setBankDetails(b => ({ ...b, cci: e.target.value }))} placeholder="00219100..." />
          </Field>
          <Field label="Beneficiario">
            <Input value={bankDetails.beneficiario} onChange={e => setBankDetails(b => ({ ...b, beneficiario: e.target.value }))} placeholder="Nithrox S.A.C." />
          </Field>
        </div>
      </div>

      {/* Promo codes */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/20">
          <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" /> Códigos de descuento
          </p>
          <SaveBtn onClick={() => save('promo_codes', promoCodes, 'Códigos')} loading={saving.promo_codes} />
        </div>
        <div className="p-5 space-y-4">
          {/* Add new */}
          <div className="flex items-end gap-2">
            <Field label="Código" className="flex-1">
              <Input
                value={newPromo.code}
                onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="NITHROX20"
                onKeyDown={e => e.key === 'Enter' && addPromo()}
              />
            </Field>
            <Field label="Descuento %" className="w-28">
              <Input
                type="number"
                min="1"
                max="100"
                value={newPromo.discount}
                onChange={e => setNewPromo(p => ({ ...p, discount: parseInt(e.target.value) || 0 }))}
                placeholder="10"
              />
            </Field>
            <button
              onClick={addPromo}
              disabled={!newPromo.code.trim()}
              className="flex items-center gap-1.5 bg-foreground text-background text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 hover:opacity-80 transition-opacity shrink-0 mb-0.5"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          {/* List */}
          {promoCodes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
              Sin códigos configurados
            </p>
          ) : (
            <div className="space-y-2">
              {promoCodes.map(promo => (
                <div key={promo.id} className="flex items-center justify-between px-4 py-2.5 bg-accent/20 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black tracking-wider">{promo.code}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      -{promo.discount}%
                    </span>
                  </div>
                  <button
                    onClick={() => deletePromo(promo.id)}
                    className="text-muted-foreground hover:text-red-500 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function StoreConfigPage() {
  const [activeTab, setActiveTab] = useState('planes')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-background">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">Tienda Online</h1>
            <p className="text-[10px] text-muted-foreground">Configuración del storefront Nithrox</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-6 border-b border-border bg-background shrink-0 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[9px] font-bold border-b-2 transition-colors uppercase tracking-widest shrink-0 ${
                activeTab === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'planes'    && <PlanesTab />}
        {activeTab === 'addons'    && <AddonsTab />}
        {activeTab === 'contrato'  && <ContratoTab />}
        {activeTab === 'apikeys'   && <ApiKeysTab />}
        {activeTab === 'pedidos'   && <PedidosTab />}
        {activeTab === 'general'   && <GeneralTab />}
      </div>
    </div>
  )
}
