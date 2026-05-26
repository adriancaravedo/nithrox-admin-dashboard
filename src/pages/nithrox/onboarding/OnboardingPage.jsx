import { useState, useCallback } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import { toast } from 'sonner'
import {
  Plus, Trash2, Pencil, X, Check, GripVertical, Eye,
  Settings, Users, ArrowRight, ChevronRight, ChevronLeft,
  Star, Copy, BarChart2, Clock, CheckCircle2,
  UserRound, Building2, Mail, Phone, Zap, Package
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Default data ─────────────────────────────────────────────
const DEFAULT_PACKAGES = [
  {
    id: 'landing',
    name: 'Landing Page',
    icon: '🚀',
    desc: 'Página de aterrizaje de alta conversión, perfecta para lanzar un producto o servicio.',
    features: ['1 página optimizada', 'Formulario de contacto', 'SEO básico', 'Responsive', 'Entrega en 7 días'],
    price: 699,
    currency: 'USD',
    popular: false,
    active: true,
  },
  {
    id: 'corporate',
    name: 'Sitio Corporativo',
    icon: '🏢',
    desc: 'Sitio web profesional de múltiples páginas con todo lo que tu empresa necesita.',
    features: ['Hasta 8 páginas', 'Blog integrado', 'SEO avanzado', 'CMS incluido', 'Entrega en 21 días'],
    price: 1499,
    currency: 'USD',
    popular: true,
    active: true,
  },
  {
    id: 'ecommerce',
    name: 'Tienda Online',
    icon: '🛍️',
    desc: 'E-commerce completo con carrito, pagos y gestión de inventario.',
    features: ['Catálogo ilimitado', 'Carrito de compras', 'Stripe + Yape/BCP', 'Panel de pedidos', 'Entrega en 30 días'],
    price: 2799,
    currency: 'USD',
    popular: false,
    active: true,
  },
  {
    id: 'custom',
    name: 'Proyecto Custom',
    icon: '⚡',
    desc: 'Web app, plataforma o sistema a medida. Cotizamos según tus requerimientos.',
    features: ['Análisis de requerimientos', 'Arquitectura personalizada', 'Integraciones API', 'Soporte dedicado', 'Timeline acordado'],
    price: 0,
    currency: 'USD',
    popular: false,
    active: true,
    isCustom: true,
  },
]

const DEFAULT_ADDONS = [
  { id: 'seo',         name: 'SEO Premium',          desc: 'Optimización avanzada + Google Search Console + reportes mensuales', price: 249, period: 'mes',  icon: '📈', active: true },
  { id: 'cms',         name: 'CMS Nithrox',           desc: 'Panel de administración para editar contenido sin tocar código',     price: 0,   period: null, icon: '✏️', active: true },
  { id: 'hosting',     name: 'Hosting VPS',           desc: 'Servidor privado, SSL, backups diarios y soporte 24/7',              price: 49,  period: 'mes',  icon: '☁️', active: true },
  { id: 'bot',         name: 'WhatsApp Bot',          desc: 'Asistente IA para responder consultas automáticamente 24/7',         price: 99,  period: 'mes',  icon: '🤖', active: true },
  { id: 'analytics',   name: 'Analytics Dashboard',  desc: 'Panel de métricas, heatmaps, conversiones y audiencia en tiempo real', price: 29, period: 'mes',  icon: '📊', active: true },
  { id: 'maintenance', name: 'Mantenimiento',         desc: 'Actualizaciones mensuales, correcciones de bugs y mejoras pequeñas', price: 199, period: 'mes',  icon: '🔧', active: true },
]

const LS_KEY = 'ntx_onboarding_config'

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    return {
      packages: saved.packages || DEFAULT_PACKAGES,
      addons:   saved.addons   || DEFAULT_ADDONS,
      settings: saved.settings || {
        currency:  'USD',
        title:     'Configura tu proyecto',
        subtitle:  'Elige tu plan base y personaliza con los add-ons que necesites. El precio se actualiza en tiempo real.',
        ctaLabel:  'Continuar al pago',
      },
      leads: saved.leads || [],
    }
  } catch {
    return { packages: DEFAULT_PACKAGES, addons: DEFAULT_ADDONS, settings: {}, leads: [] }
  }
}

function saveConfig(c) { localStorage.setItem(LS_KEY, JSON.stringify(c)) }

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-all duration-200 shrink-0 focus:outline-none
        ${checked ? 'bg-foreground' : 'bg-border'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200
        ${checked ? 'translate-x-4 bg-background' : 'translate-x-0.5 bg-muted-foreground/50'}`} />
    </button>
  )
}

// ── Sortable row ─────────────────────────────────────────────
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}>
      <div className="flex items-center gap-2 group">
        <div {...attributes} {...listeners}
          className="cursor-grab shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors touch-none p-1">
          <GripVertical className="w-3 h-3" />
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Step indicator ───────────────────────────────────────────
const STEPS = ['Tu plan', 'Personaliza', 'Tus datos', 'Confirmar']

function StepBar({ step }) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-5 border-b border-border shrink-0">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex items-center gap-2 ${i <= step ? '' : 'opacity-30'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all
              ${i < step ? 'bg-foreground text-background' : i === step ? 'bg-foreground text-background' : 'bg-border text-muted-foreground'}`}>
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 sm:w-12 h-px mx-2 transition-all ${i < step ? 'bg-foreground/40' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── CLIENT-FACING CONFIGURATOR ───────────────────────────────
function Configurator({ packages, addons, settings, embedded = false }) {
  const [step, setStep] = useState(0)
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState({})
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', notes: '' })

  const activePackages = packages.filter(p => p.active)
  const activeAddons   = addons.filter(a => a.active)
  const pkg = packages.find(p => p.id === selectedPkg)

  const oneTimeTotal = pkg?.price ?? 0
  const monthlyTotal = Object.entries(selectedAddons)
    .filter(([, on]) => on)
    .reduce((sum, [id]) => {
      const a = addons.find(a => a.id === id)
      return sum + (a?.period === 'mes' ? a.price : 0)
    }, 0)

  const toggleAddon = (id) => {
    const addon = addons.find(a => a.id === id)
    if (addon?.price === 0) return
    setSelectedAddons(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const freeAddons = activeAddons.filter(a => a.price === 0)
  const paidAddons = activeAddons.filter(a => a.price > 0)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const canAdvance = step === 0 ? !!selectedPkg
    : step === 1 ? !!selectedPkg
    : step === 2 ? (form.name.trim() && form.email.trim())
    : false

  return (
    <div className={`flex flex-col font-sans ${embedded ? 'h-full' : 'min-h-screen'} bg-background`}>
      <StepBar step={step} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-7">

          {/* ── STEP 0: Elige tu plan ── */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">{settings.title || 'Configura tu proyecto'}</h2>
              <p className="text-sm text-muted-foreground mb-7">{settings.subtitle || 'Elige el plan que se adapta a tu negocio'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activePackages.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPkg(p.id); setStep(1) }}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all group hover:-translate-y-0.5 hover:shadow-lg
                      ${selectedPkg === p.id
                        ? 'border-foreground shadow-md'
                        : 'border-border hover:border-foreground/40 hover:shadow-sm'}`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 left-4 text-[9px] font-black bg-foreground text-background px-2.5 py-0.5 rounded-full tracking-widest uppercase">
                        Popular
                      </span>
                    )}
                    <div className="text-2xl mb-3">{p.icon}</div>
                    <h3 className="font-bold text-sm mb-1 tracking-tight">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{p.desc}</p>
                    <ul className="space-y-1.5 mb-5">
                      {p.features.slice(0, 4).map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-foreground shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-baseline gap-1.5">
                      {p.isCustom ? (
                        <span className="text-sm font-bold text-muted-foreground">Cotización a medida</span>
                      ) : (
                        <>
                          <span className="text-2xl font-black">${p.price.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">{p.currency}</span>
                        </>
                      )}
                    </div>
                    <ArrowRight className={`absolute bottom-5 right-5 w-4 h-4 transition-all ${selectedPkg === p.id ? 'text-foreground' : 'text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: Personaliza ── */}
          {step === 1 && pkg && (
            <div>
              <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
                <ChevronLeft className="w-3.5 h-3.5" /> Cambiar plan
              </button>

              {/* Selected plan pill */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border mb-7">
                <span className="text-xl shrink-0">{pkg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Plan seleccionado</p>
                  <p className="text-sm font-bold">{pkg.name}</p>
                </div>
                {!pkg.isCustom && (
                  <span className="text-sm font-black shrink-0">${pkg.price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{pkg.currency}</span></span>
                )}
              </div>

              <h2 className="text-xl font-black tracking-tight mb-1">Personaliza tu plan</h2>
              <p className="text-sm text-muted-foreground mb-6">Agrega los servicios que necesites. El total se actualiza al instante.</p>

              {/* Free addons */}
              {freeAddons.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5">Incluido sin costo</p>
                  <div className="space-y-2">
                    {freeAddons.map(a => (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-muted/20">
                        <span className="text-lg shrink-0">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold">{a.name}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{a.desc}</p>
                        </div>
                        <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full shrink-0">Gratis</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paid addons */}
              {paidAddons.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5">Add-ons opcionales</p>
                  <div className="space-y-2">
                    {paidAddons.map(a => {
                      const on = !!selectedAddons[a.id]
                      return (
                        <button key={a.id} onClick={() => toggleAddon(a.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all
                            ${on ? 'border-foreground bg-foreground/[0.03]' : 'border-border hover:border-foreground/30'}`}>
                          <span className="text-lg shrink-0">{a.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{a.desc}</p>
                          </div>
                          <div className="text-right shrink-0 mr-2">
                            <p className="text-xs font-black">+${a.price}</p>
                            <p className="text-[10px] text-muted-foreground">/{a.period}</p>
                          </div>
                          <Toggle checked={on} onChange={() => toggleAddon(a.id)} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Tus datos ── */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
                <ChevronLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <h2 className="text-2xl font-black tracking-tight mb-1">Tus datos</h2>
              <p className="text-sm text-muted-foreground mb-7">Cuéntanos sobre ti para poder ponernos en contacto.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <UserRound className="w-3 h-3" /> Nombre completo <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Building2 className="w-3 h-3" /> Empresa
                    </label>
                    <input
                      value={form.company}
                      onChange={e => setField('company', e.target.value)}
                      placeholder="Mi Empresa S.A.C."
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Mail className="w-3 h-3" /> Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
                      placeholder="juan@empresa.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Phone className="w-3 h-3" /> Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setField('phone', e.target.value)}
                      placeholder="+51 999 000 000"
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">¿Algo más que debamos saber?</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    placeholder="Cuéntanos brevemente sobre tu proyecto, plazos, referencias o cualquier detalle relevante..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background transition-colors resize-none placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirmar ── */}
          {step === 3 && pkg && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-foreground text-background flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                  {pkg.icon}
                </div>
                <h2 className="text-2xl font-black tracking-tight">Resumen de tu pedido</h2>
                <p className="text-sm text-muted-foreground mt-1.5">Revisa los detalles antes de continuar al pago</p>
              </div>

              {/* Order card */}
              <div className="border border-border rounded-2xl overflow-hidden mb-4 shadow-sm">
                {/* Base plan */}
                <div className="px-5 py-4 border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{pkg.icon}</span>
                      <span className="text-sm font-bold">{pkg.name}</span>
                    </div>
                    <span className="text-sm font-black">
                      {pkg.isCustom ? 'Personalizado' : `$${pkg.price.toLocaleString()} ${pkg.currency}`}
                    </span>
                  </div>
                  {!pkg.isCustom && <p className="text-[10px] text-muted-foreground mt-0.5 ml-[26px]">Pago único</p>}
                </div>

                {/* Free addons */}
                {freeAddons.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">{a.icon} {a.name}</span>
                    <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">Gratis</span>
                  </div>
                ))}

                {/* Selected paid addons */}
                {paidAddons.filter(a => selectedAddons[a.id]).map(a => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">{a.icon} {a.name}</span>
                    <span className="text-xs font-bold">+${a.price}/{a.period}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              {!pkg.isCustom && (
                <div className="border border-border rounded-2xl px-5 py-4 mb-6 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Desarrollo (pago único)</span>
                    <span className="font-black">${oneTimeTotal.toLocaleString()} USD</span>
                  </div>
                  {monthlyTotal > 0 && (
                    <div className="flex items-center justify-between text-sm border-t border-border pt-2.5">
                      <span className="text-muted-foreground">Servicios mensuales</span>
                      <span className="font-black">+${monthlyTotal}/mes</span>
                    </div>
                  )}
                </div>
              )}

              {/* Contact summary */}
              {form.name && (
                <div className="border border-border rounded-2xl px-5 py-4 mb-6 space-y-1.5">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Datos de contacto</p>
                  <p className="text-xs font-semibold">{form.name} {form.company && `— ${form.company}`}</p>
                  <p className="text-xs text-muted-foreground">{form.email} {form.phone && `· ${form.phone}`}</p>
                </div>
              )}

              <button className="w-full py-4 bg-foreground text-background rounded-2xl text-sm font-black hover:bg-foreground/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg">
                {settings.ctaLabel || 'Continuar al pago'} <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[11px] text-muted-foreground mt-3">
                Sin compromiso · Puedes modificar tu plan después
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating price bar ─────────────────────────── */}
      {step < 3 && (
        <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-5 py-3.5">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="flex-1 min-w-0">
              {step === 0 && (
                <p className="text-xs text-muted-foreground">← Selecciona un plan para continuar</p>
              )}
              {step >= 1 && pkg && (
                <div className="flex items-baseline gap-3 flex-wrap">
                  {!pkg.isCustom ? (
                    <>
                      <span className="text-base font-black">${oneTimeTotal.toLocaleString()} USD</span>
                      {monthlyTotal > 0 && (
                        <span className="text-xs text-muted-foreground font-semibold">+ ${monthlyTotal}/mes</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">Cotización personalizada</span>
                  )}
                </div>
              )}
              {step === 2 && !canAdvance && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Completa nombre y email para continuar</p>
              )}
            </div>
            {step === 1 && selectedPkg && (
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-full text-xs font-bold hover:bg-foreground/90 active:scale-95 transition-all shrink-0">
                Siguiente <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => { if (canAdvance) setStep(3) }}
                disabled={!canAdvance}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0
                  ${canAdvance ? 'bg-foreground text-background hover:bg-foreground/90 active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                Ver resumen <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────
function EditItemModal({ item, type, onSave, onClose }) {
  const [form, setForm] = useState({ ...item })
  const [newFeature, setNewFeature] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">Editar {type === 'package' ? 'plan' : 'add-on'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Emoji</label>
              <input value={form.icon || ''} onChange={e => set('icon', e.target.value)}
                className="w-full text-center text-lg border border-border rounded-xl py-2 outline-none focus:border-foreground bg-background" />
            </div>
            <div className="col-span-4 space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Nombre *</label>
              <input value={form.name || ''} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Descripción</label>
            <textarea value={form.desc || ''} onChange={e => set('desc', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground resize-none bg-background" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Precio (USD)</label>
              <input type="number" min={0} value={form.price || 0}
                onChange={e => set('price', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
            </div>
            {type === 'addon' && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Período</label>
                <select value={form.period || ''}
                  onChange={e => set('period', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background">
                  <option value="">Único</option>
                  <option value="mes">Mensual</option>
                  <option value="año">Anual</option>
                </select>
              </div>
            )}
            {type === 'package' && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Moneda</label>
                <select value={form.currency || 'USD'}
                  onChange={e => set('currency', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background">
                  <option value="USD">USD</option>
                  <option value="PEN">PEN (S/)</option>
                </select>
              </div>
            )}
          </div>

          {type === 'package' && (
            <>
              <div className="space-y-2">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Características</label>
                {(form.features || []).map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={f}
                      onChange={e => set('features', form.features.map((x, j) => j === i ? e.target.value : x))}
                      className="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg outline-none focus:border-foreground bg-background" />
                    <button onClick={() => set('features', form.features.filter((_, j) => j !== i))}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={newFeature} onChange={e => setNewFeature(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newFeature.trim()) {
                        set('features', [...(form.features || []), newFeature.trim()])
                        setNewFeature('')
                      }
                    }}
                    placeholder="Agregar característica..."
                    className="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg outline-none focus:border-foreground bg-background" />
                  <Button size="sm" variant="outline"
                    onClick={() => {
                      if (newFeature.trim()) {
                        set('features', [...(form.features || []), newFeature.trim()])
                        setNewFeature('')
                      }
                    }}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => set('popular', !form.popular)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all
                    ${form.popular ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/40'}`}>
                  <Star className="w-3 h-3" /> Popular
                </button>
                <button onClick={() => set('isCustom', !form.isCustom)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all
                    ${form.isCustom ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/40'}`}>
                  <Zap className="w-3 h-3" /> Es cotización
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="flex-1 text-xs" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 text-xs" onClick={() => { onSave(form); onClose() }}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}

// ── Admin editor panel (left) ─────────────────────────────────
function EditorPanel({ config, mutate, sensors, onEdit }) {
  const settings = config.settings || {}

  const handlePkgDrag = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const pkgs = config.packages
    mutate({ ...config, packages: arrayMove(pkgs, pkgs.findIndex(p => p.id === active.id), pkgs.findIndex(p => p.id === over.id)) })
  }

  const handleAddonDrag = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ads = config.addons
    mutate({ ...config, addons: arrayMove(ads, ads.findIndex(a => a.id === active.id), ads.findIndex(a => a.id === over.id)) })
  }

  const addPackage = () => {
    const newPkg = { id: `pkg_${Date.now()}`, name: 'Nuevo plan', icon: '📦', desc: '', features: [], price: 0, currency: 'USD', popular: false, active: true }
    mutate({ ...config, packages: [...config.packages, newPkg] })
    onEdit({ type: 'package', item: newPkg })
  }

  const addAddon = () => {
    const newAddon = { id: `addon_${Date.now()}`, name: 'Nuevo add-on', icon: '✨', desc: '', price: 0, period: 'mes', active: true }
    mutate({ ...config, addons: [...config.addons, newAddon] })
    onEdit({ type: 'addon', item: newAddon })
  }

  return (
    <div className="w-[380px] shrink-0 border-r border-border flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto divide-y divide-border">

        {/* Texts */}
        <div className="p-4">
          <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mb-3">Textos del flujo</p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Título principal</label>
              <input value={settings.title || ''} placeholder="Configura tu proyecto"
                onChange={e => mutate({ ...config, settings: { ...settings, title: e.target.value } })}
                className="mt-1 w-full px-3 py-2 text-xs border border-border rounded-lg outline-none focus:border-foreground bg-background" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Subtítulo</label>
              <textarea value={settings.subtitle || ''} rows={2} placeholder="Elige tu plan base..."
                onChange={e => mutate({ ...config, settings: { ...settings, subtitle: e.target.value } })}
                className="mt-1 w-full px-3 py-2 text-xs border border-border rounded-lg outline-none focus:border-foreground resize-none bg-background" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Texto del botón final</label>
              <input value={settings.ctaLabel || ''} placeholder="Continuar al pago"
                onChange={e => mutate({ ...config, settings: { ...settings, ctaLabel: e.target.value } })}
                className="mt-1 w-full px-3 py-2 text-xs border border-border rounded-lg outline-none focus:border-foreground bg-background" />
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Planes base <span className="text-foreground/40">({config.packages.length})</span>
            </p>
            <button onClick={addPackage}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium">
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePkgDrag}>
            <SortableContext items={config.packages.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {config.packages.map(pkg => (
                  <SortableItem key={pkg.id} id={pkg.id}>
                    <div className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all
                      ${pkg.active ? 'border-border bg-background' : 'border-dashed border-border/50 bg-muted/20 opacity-50'}`}>
                      <span className="text-sm shrink-0">{pkg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{pkg.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {pkg.isCustom ? 'Cotización' : `$${pkg.price.toLocaleString()} ${pkg.currency}`}
                        </p>
                      </div>
                      {pkg.popular && (
                        <span className="text-[8px] font-black bg-foreground text-background px-1.5 py-0.5 rounded-full shrink-0">POP</span>
                      )}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => onEdit({ type: 'package', item: pkg })}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <Toggle checked={pkg.active}
                          onChange={() => mutate({ ...config, packages: config.packages.map(p => p.id === pkg.id ? { ...p, active: !p.active } : p) })} />
                        <button
                          onClick={() => mutate({ ...config, packages: config.packages.filter(p => p.id !== pkg.id) })}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Addons */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Add-ons <span className="text-foreground/40">({config.addons.length})</span>
            </p>
            <button onClick={addAddon}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium">
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAddonDrag}>
            <SortableContext items={config.addons.map(a => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {config.addons.map(addon => (
                  <SortableItem key={addon.id} id={addon.id}>
                    <div className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all
                      ${addon.active ? 'border-border bg-background' : 'border-dashed border-border/50 bg-muted/20 opacity-50'}`}>
                      <span className="text-sm shrink-0">{addon.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{addon.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {addon.price === 0 ? 'Gratis' : `+$${addon.price}${addon.period ? `/${addon.period}` : ''}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => onEdit({ type: 'addon', item: addon })}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <Toggle checked={addon.active}
                          onChange={() => mutate({ ...config, addons: config.addons.map(a => a.id === addon.id ? { ...a, active: !a.active } : a) })} />
                        <button
                          onClick={() => mutate({ ...config, addons: config.addons.filter(a => a.id !== addon.id) })}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}

// ── Leads tab ─────────────────────────────────────────────────
function LeadsTab({ leads, onSwitchToPreview }) {
  const total     = leads.length
  const paid      = leads.filter(l => l.status === 'paid').length
  const pending   = leads.filter(l => l.status === 'pending').length
  const rate      = total > 0 ? Math.round((paid / total) * 100) : 0

  const STATS = [
    { label: 'Total leads',   value: total,   icon: Users,         color: 'text-blue-500' },
    { label: 'Completados',   value: paid,    icon: CheckCircle2,  color: 'text-green-500' },
    { label: 'En proceso',    value: pending, icon: Clock,         color: 'text-amber-500' },
    { label: 'Conversión',    value: `${rate}%`, icon: BarChart2,  color: 'text-purple-500' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="border border-border rounded-2xl p-4 bg-background">
            <s.icon className={`w-4 h-4 ${s.color} mb-2.5`} />
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div className="border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold mb-1.5">Sin leads todavía</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
            Cuando tus clientes completen el flujo de onboarding desde tu web, aparecerán aquí con su configuración y estado de pago.
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-full hover:bg-accent transition-colors">
              <Copy className="w-3.5 h-3.5" /> Copiar link
            </button>
            <button onClick={onSwitchToPreview}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Previsualizar flujo
            </button>
          </div>
        </div>
      )}

      {/* Leads table */}
      {total > 0 && (
        <div className="border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={i} className="border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{lead.name || '—'}</p>
                    <p className="text-muted-foreground text-[10px]">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.plan || '—'}</td>
                  <td className="px-4 py-3 font-bold">{lead.total ? `$${lead.total}` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                      ${lead.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {lead.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function OnboardingPage() {
  const [config, setConfig]   = useState(loadConfig)
  const [tab, setTab]         = useState('configurar')
  const [editing, setEditing] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const mutate  = useCallback((next) => { setConfig(next); saveConfig(next) }, [])

  const updateItem = (type, updated) => {
    if (type === 'package') mutate({ ...config, packages: config.packages.map(p => p.id === updated.id ? updated : p) })
    else                    mutate({ ...config, addons:   config.addons.map(a => a.id === updated.id ? updated : a) })
  }

  const totalLeads = config.leads?.length || 0

  const TABS = [
    { id: 'configurar', label: 'Configurar',    icon: Settings },
    { id: 'preview',    label: 'Vista cliente', icon: Eye },
    { id: 'leads',      label: `Leads${totalLeads > 0 ? ` (${totalLeads})` : ''}`, icon: Users },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Onboarding"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-xs rounded-full px-4 h-8"
              onClick={() => { toast.success('Configuración guardada'); saveConfig(config) }}>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Guardar
            </Button>
          </div>
        }
      />

      {/* Sub-tabs */}
      <div className="flex border-b border-border px-4 shrink-0 bg-background">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold border-b-2 transition-colors uppercase tracking-widest
              ${tab === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full rounded-2xl border border-border bg-background overflow-hidden shadow-sm flex flex-col">

          {/* ── CONFIGURAR ── */}
          {tab === 'configurar' && (
            <div className="flex flex-1 overflow-hidden min-h-0">
              <EditorPanel config={config} mutate={mutate} sensors={sensors} onEdit={setEditing} />

              {/* Right: live preview */}
              <div className="flex-1 overflow-hidden flex flex-col bg-muted/20 min-w-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background shrink-0">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Vista previa en tiempo real</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400/70" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
                    <div className="w-2 h-2 rounded-full bg-green-400/70" />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden m-3 rounded-xl border border-border/60 bg-background shadow-sm">
                  <Configurator
                    packages={config.packages}
                    addons={config.addons}
                    settings={config.settings || {}}
                    embedded
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {tab === 'preview' && (
            <div className="flex-1 overflow-hidden">
              <Configurator
                packages={config.packages}
                addons={config.addons}
                settings={config.settings || {}}
                embedded
              />
            </div>
          )}

          {/* ── LEADS ── */}
          {tab === 'leads' && (
            <LeadsTab leads={config.leads || []} onSwitchToPreview={() => setTab('preview')} />
          )}
        </div>
      </div>

      {editing && (
        <EditItemModal
          item={editing.item}
          type={editing.type}
          onSave={updated => updateItem(editing.type, updated)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
