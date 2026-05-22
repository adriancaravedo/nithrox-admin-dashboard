import { useState, useRef } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  Plus, Trash2, Copy, ExternalLink, Eye, Pencil, X, Check,
  DollarSign, ChevronDown, ChevronRight, ArrowRight, Star,
  Package, Zap, Clock, Globe, Smartphone, ShoppingCart,
  Palette, Search, BarChart2, Shield, Users, FileCheck,
  Send, Download, Settings, GripVertical, Image
} from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Service catalog (editable) ────────────────────────────────
const DEFAULT_CATALOG = [
  { id: 'web_corp',    name: 'Sitio web corporativo', icon: '🌐', base_price: 1500, unit: 'proyecto', description: 'Diseño y desarrollo de sitio web profesional', category: 'Desarrollo', popular: false },
  { id: 'ecommerce',  name: 'Tienda online',          icon: '🛒', base_price: 3000, unit: 'proyecto', description: 'E-commerce completo con carrito y pagos', category: 'Desarrollo', popular: true },
  { id: 'app_web',    name: 'Aplicación web',         icon: '💻', base_price: 5000, unit: 'proyecto', description: 'App web a medida, SaaS, dashboard', category: 'Desarrollo', popular: false },
  { id: 'app_mobile', name: 'App móvil',              icon: '📱', base_price: 6000, unit: 'proyecto', description: 'iOS + Android con React Native', category: 'Mobile', popular: false },
  { id: 'landing',    name: 'Landing page',           icon: '🎯', base_price: 800,  unit: 'proyecto', description: 'Página de conversión optimizada', category: 'Desarrollo', popular: false },
  { id: 'branding',   name: 'Identidad visual',       icon: '🎨', base_price: 800,  unit: 'proyecto', description: 'Logo, paleta, tipografías, manual', category: 'Diseño', popular: false },
  { id: 'figma',      name: 'Diseño UI/UX Figma',     icon: '✏️', base_price: 1200, unit: 'proyecto', description: 'Wireframes, prototipos, design system', category: 'Diseño', popular: false },
  { id: 'seo',        name: 'SEO mensual',            icon: '🔍', base_price: 500,  unit: '/mes',     description: 'Posicionamiento orgánico en Google', category: 'Marketing', popular: false },
  { id: 'social',     name: 'Community Manager',      icon: '📱', base_price: 400,  unit: '/mes',     description: 'Gestión de redes sociales', category: 'Marketing', popular: false },
  { id: 'hosting',    name: 'Hosting + dominio',      icon: '🖥️',  base_price: 120,  unit: '/año',     description: 'VPS optimizado + dominio .pe o .com', category: 'Infraestructura', popular: false },
  { id: 'maintenance',name: 'Mantenimiento web',      icon: '🔧', base_price: 200,  unit: '/mes',     description: 'Actualizaciones, backups, soporte', category: 'Infraestructura', popular: false },
  { id: 'consulting', name: 'Consultoría',            icon: '🎓', base_price: 150,  unit: '/hora',    description: 'Estrategia digital 1-on-1', category: 'Consultoría', popular: false },
  { id: 'converter',  name: 'Figma → Código',         icon: '⚡', base_price: 300,  unit: 'por pantalla', description: 'Conversión pixel-perfect con IA', category: 'Desarrollo', popular: true },
]

const CATEGORIES = ['Todos', 'Desarrollo', 'Diseño', 'Mobile', 'Marketing', 'Infraestructura', 'Consultoría']

const CURRENCIES = [
  { id: 'USD', symbol: '$', label: 'USD' },
  { id: 'PEN', symbol: 'S/', label: 'PEN (Soles)' },
  { id: 'EUR', symbol: '€', label: 'EUR' },
]

const DISCOUNT_TYPES = [
  { id: 'percent', label: '%' },
  { id: 'fixed', label: 'fijo' },
]

// ── Sortable line item ────────────────────────────────────────
function SortableItem({ item, onUpdate, onDelete, currency }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const sym = CURRENCIES.find(c => c.id === currency)?.symbol || '$'
  const total = item.price * item.qty * (1 - (item.discount || 0) / 100)

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`grid grid-cols-12 gap-2 items-center p-3 border border-border rounded-xl mb-2 bg-background transition-all ${isDragging ? 'opacity-40 shadow-xl' : 'hover:border-foreground/20'}`}>
      <div {...listeners} className="col-span-1 cursor-grab text-muted-foreground touch-none flex justify-center">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="col-span-4">
        <input value={item.name} onChange={e => onUpdate(item.id, { name: e.target.value })}
          className="w-full text-sm font-medium outline-none bg-transparent border-b border-transparent focus:border-primary" />
        <input value={item.description || ''} onChange={e => onUpdate(item.id, { description: e.target.value })}
          placeholder="Descripción..." className="w-full text-[10px] text-muted-foreground outline-none bg-transparent mt-0.5" />
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{sym}</span>
          <input type="number" value={item.price} onChange={e => onUpdate(item.id, { price: parseFloat(e.target.value) || 0 })}
            className="w-full text-sm font-medium outline-none bg-transparent text-right" />
        </div>
      </div>
      <div className="col-span-1">
        <input type="number" min="1" value={item.qty} onChange={e => onUpdate(item.id, { qty: parseInt(e.target.value) || 1 })}
          className="w-full text-sm text-center outline-none bg-transparent border border-border rounded-lg px-1 py-0.5" />
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1">
          <input type="number" min="0" max="100" value={item.discount || 0} onChange={e => onUpdate(item.id, { discount: parseFloat(e.target.value) || 0 })}
            className="w-full text-sm text-center outline-none bg-transparent border border-border rounded-lg px-1 py-0.5" />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </div>
      <div className="col-span-1 text-right">
        <p className="text-sm font-bold tabular-nums">{sym}{total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="col-span-1 flex justify-center">
        <button onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Proposal client view ──────────────────────────────────────
function ProposalClientView({ proposal, onClose, onAccept }) {
  const [accepted, setAccepted] = useState(false)
  const sym = CURRENCIES.find(c => c.id === proposal.currency)?.symbol || '$'
  const subtotal = proposal.items.reduce((s, i) => s + i.price * i.qty * (1 - (i.discount || 0) / 100), 0)
  const discountAmount = proposal.global_discount ? subtotal * proposal.global_discount / 100 : 0
  const taxAmount = proposal.tax ? (subtotal - discountAmount) * proposal.tax / 100 : 0
  const total = subtotal - discountAmount + taxAmount
  const brand = proposal.branding || {}

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ backgroundColor: brand.bg || '#f8fafc', fontFamily: "'Geist Mono', monospace" }}>
      <button onClick={onClose} className="fixed top-4 right-4 z-10 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors">
        <X className="w-4 h-4 text-zinc-600" />
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${brand.primary || '#18181b'} 0%, ${brand.secondary || '#3b82f6'} 100%)` }}>
        <div className="max-w-3xl mx-auto px-8 py-16 text-white">
          {brand.logo ? (
            <img src={brand.logo} alt="logo" className="h-10 mb-8 object-contain" />
          ) : (
            <div className="text-sm font-bold tracking-widest mb-8 opacity-70">NITHROX · NTX LABS LLC</div>
          )}
          <h1 className="text-4xl font-black tracking-tight mb-4">{proposal.name}</h1>
          <p className="text-white/70 text-lg">{proposal.intro || 'Propuesta comercial personalizada para tu negocio.'}</p>
          <div className="flex items-center gap-6 mt-8">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest">Para</p>
              <p className="text-lg font-bold">{proposal.client_name || proposal.company}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest">Válida hasta</p>
              <p className="text-lg font-bold">{proposal.valid_until ? new Date(proposal.valid_until).toLocaleDateString('es-PE') : '—'}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest">Total</p>
              <p className="text-2xl font-black">{sym}{total.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-12 space-y-10">
        {/* About */}
        {proposal.about && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest mb-4">Sobre este proyecto</h2>
            <p className="text-zinc-600 leading-relaxed">{proposal.about}</p>
          </section>
        )}

        {/* Services */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest mb-4">Servicios incluidos</h2>
          <div className="space-y-3">
            {proposal.items.map(item => {
              const lineTotal = item.price * item.qty * (1 - (item.discount || 0) / 100)
              return (
                <div key={item.id} className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl shrink-0">{item.icon || '📦'}</span>
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                        {item.qty > 1 && <p className="text-[10px] text-zinc-400 mt-1">{item.qty} unidades × {sym}{item.price}</p>}
                        {item.discount > 0 && <p className="text-[10px] text-green-600 font-bold mt-0.5">{item.discount}% descuento aplicado</p>}
                      </div>
                    </div>
                    <p className="text-lg font-black shrink-0 tabular-nums">{sym}{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Totals */}
        <section>
          <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-bold tabular-nums">{sym}{subtotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
            </div>
            {proposal.global_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento global ({proposal.global_discount}%)</span>
                <span className="font-bold tabular-nums">-{sym}{discountAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
            )}
            {proposal.tax > 0 && (
              <div className="flex justify-between text-sm text-zinc-500">
                <span>IGV ({proposal.tax}%)</span>
                <span className="font-bold tabular-nums">+{sym}{taxAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
            )}
            <div className="border-t border-zinc-100 pt-3 flex justify-between">
              <span className="text-lg font-black">TOTAL</span>
              <span className="text-2xl font-black tabular-nums">{sym}{total.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
            </div>
          </div>
        </section>

        {/* Terms */}
        {proposal.terms && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest mb-4">Términos y condiciones</h2>
            <p className="text-zinc-500 text-sm leading-relaxed whitespace-pre-wrap">{proposal.terms}</p>
          </section>
        )}

        {/* CTA */}
        {!accepted && proposal.status !== 'accepted' && (
          <section>
            <div className="bg-zinc-900 rounded-3xl p-8 text-white text-center">
              <h2 className="text-2xl font-black mb-2">¿Todo listo para empezar?</h2>
              <p className="text-zinc-400 mb-6">Al aceptar esta propuesta, damos inicio al proceso de contratación.</p>
              <button onClick={() => { setAccepted(true); onAccept() }}
                className="px-8 py-4 font-black text-zinc-900 rounded-2xl text-base hover:opacity-90 transition-all hover:scale-105"
                style={{ backgroundColor: brand.accent || '#ffffff' }}>
                ✅ Acepto esta propuesta
              </button>
              <p className="text-zinc-600 text-xs mt-4">Al aceptar, confirmas que has leído y estás de acuerdo con los términos.</p>
            </div>
          </section>
        )}

        {(accepted || proposal.status === 'accepted') && (
          <div className="bg-green-50 border-2 border-green-300 rounded-3xl p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-green-800 mb-2">¡Propuesta aceptada!</h2>
            <p className="text-green-700">Recibirás un contrato por email en las próximas horas.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-zinc-400 text-xs pb-8">
          <p>Generado por NTX Labs LLC · Nithrox</p>
          <p>{proposal.contact_email || 'hola@nithrox.com'} · {proposal.contact_phone || '+51 999 000 111'}</p>
        </div>
      </div>
    </div>
  )
}

// ── Proposal editor ───────────────────────────────────────────
function ProposalEditor({ proposal, onUpdate, onClose, companies }) {
  const [tab, setTab] = useState('content') // content | catalog | branding | settings
  const [catFilter, setCatFilter] = useState('Todos')
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG)
  const [showCatalogEditor, setShowCatalogEditor] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const sym = CURRENCIES.find(c => c.id === proposal.currency)?.symbol || '$'

  const subtotal = proposal.items.reduce((s, i) => s + i.price * i.qty * (1 - (i.discount || 0) / 100), 0)
  const discountAmount = proposal.global_discount ? subtotal * proposal.global_discount / 100 : 0
  const taxAmount = proposal.tax ? (subtotal - discountAmount) * proposal.tax / 100 : 0
  const total = subtotal - discountAmount + taxAmount

  const updateItem = (id, data) => onUpdate({ items: proposal.items.map(i => i.id === id ? { ...i, ...data } : i) })
  const deleteItem = (id) => onUpdate({ items: proposal.items.filter(i => i.id !== id) })
  const addFromCatalog = (svc) => {
    onUpdate({ items: [...proposal.items, { id: `item${Date.now()}`, name: svc.name, description: svc.description, icon: svc.icon, price: svc.base_price, qty: 1, discount: 0, unit: svc.unit }] })
    toast.success(`"${svc.name}" agregado`)
  }
  const addCustomItem = () => onUpdate({ items: [...proposal.items, { id: `item${Date.now()}`, name: 'Nuevo servicio', description: '', icon: '📦', price: 0, qty: 1, discount: 0 }] })
  const handleItemDrag = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = proposal.items.findIndex(i => i.id === active.id)
    const newIdx = proposal.items.findIndex(i => i.id === over.id)
    onUpdate({ items: arrayMove(proposal.items, oldIdx, newIdx) })
  }

  const logoRef = useRef()

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          <input value={proposal.name} onChange={e => onUpdate({ name: e.target.value })}
            className="text-sm font-bold outline-none bg-transparent border-b border-transparent focus:border-primary uppercase tracking-tight" />
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${proposal.status === 'accepted' ? 'bg-green-100 text-green-700' : proposal.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>
            {proposal.status === 'accepted' ? '✓ Aceptada' : proposal.status === 'sent' ? 'Enviada' : 'Borrador'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-full hover:bg-accent uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" /> Vista cliente
          </button>
          <button onClick={() => { onUpdate({ status: 'sent' }); toast.success('Propuesta marcada como enviada') }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
            <Send className="w-3.5 h-3.5" /> Enviar al cliente
          </button>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Total</p>
            <p className="text-lg font-black tabular-nums">{sym}{total.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6 shrink-0">
        {[
          { id: 'content', label: 'CONTENIDO' },
          { id: 'catalog', label: 'CATÁLOGO' },
          { id: 'branding', label: 'BRANDING' },
          { id: 'settings', label: 'CONFIGURACIÓN' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-[9px] font-bold border-b-2 uppercase tracking-widest transition-colors ${tab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Content tab ──────────────────────────────────── */}
        {tab === 'content' && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Empresa cliente</label>
                  <select value={proposal.company_id || ''} onChange={e => { const co = companies.find(c => c.id === e.target.value); onUpdate({ company_id: e.target.value, company: co?.name || '', client_name: co?.name || '' }) }}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary">
                    <option value="">Seleccionar cliente...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Nombre del contacto</label>
                  <input value={proposal.client_name || ''} onChange={e => onUpdate({ client_name: e.target.value })}
                    placeholder="María Quispe" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Válida hasta</label>
                  <input type="date" value={proposal.valid_until || ''} onChange={e => onUpdate({ valid_until: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Moneda</label>
                  <select value={proposal.currency || 'USD'} onChange={e => onUpdate({ currency: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary">
                    {CURRENCIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Intro */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Introducción (aparece al cliente)</label>
                <textarea value={proposal.intro || ''} onChange={e => onUpdate({ intro: e.target.value })}
                  placeholder="Descripción de la propuesta, enfocada al cliente..."
                  rows={2} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Sobre el proyecto</label>
                <textarea value={proposal.about || ''} onChange={e => onUpdate({ about: e.target.value })}
                  placeholder="Contexto del proyecto, objetivos, alcance..."
                  rows={3} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary resize-none" />
              </div>

              {/* Line items */}
              <div>
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  <div className="col-span-1" />
                  <div className="col-span-4">SERVICIO</div>
                  <div className="col-span-2 text-right">PRECIO</div>
                  <div className="col-span-1 text-center">CANT</div>
                  <div className="col-span-2 text-center">DESC %</div>
                  <div className="col-span-1 text-right">TOTAL</div>
                  <div className="col-span-1" />
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDrag}>
                  <SortableContext items={proposal.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {proposal.items.map(item => (
                      <SortableItem key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} currency={proposal.currency || 'USD'} />
                    ))}
                  </SortableContext>
                </DndContext>
                <button onClick={addCustomItem}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
                  <Plus className="w-3.5 h-3.5" /> Agregar línea personalizada
                </button>
              </div>

              {/* Totals */}
              <div className="bg-muted/20 border border-border rounded-2xl p-5 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Descuento global (%)</label>
                    <input type="number" min="0" max="100" value={proposal.global_discount || 0}
                      onChange={e => onUpdate({ global_discount: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">IGV / Impuesto (%)</label>
                    <input type="number" min="0" value={proposal.tax || 0}
                      onChange={e => onUpdate({ tax: parseFloat(e.target.value) || 0 })}
                      placeholder="18 para Perú" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  {[
                    { l: 'Subtotal', v: subtotal },
                    proposal.global_discount > 0 && { l: `Descuento (${proposal.global_discount}%)`, v: -discountAmount },
                    proposal.tax > 0 && { l: `IGV (${proposal.tax}%)`, v: taxAmount },
                  ].filter(Boolean).map(row => (
                    <div key={row.l} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{row.l}</span>
                      <span className={`font-medium tabular-nums ${row.v < 0 ? 'text-green-600' : ''}`}>{row.v < 0 ? '-' : ''}{sym}{Math.abs(row.v).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-black pt-2 border-t border-border">
                    <span>TOTAL</span>
                    <span className="tabular-nums">{sym}{total.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Términos y condiciones</label>
                <textarea value={proposal.terms || ''} onChange={e => onUpdate({ terms: e.target.value })}
                  placeholder="• El 50% se paga al inicio del proyecto&#10;• Revisiones incluidas: 2 por fase&#10;• Tiempo de entrega estimado: 6 semanas"
                  rows={5} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary resize-none font-mono" />
              </div>
            </div>
          </div>
        )}

        {/* ── Catalog tab ───────────────────────────────────── */}
        {tab === 'catalog' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Haz click en un servicio para agregarlo a la propuesta</p>
              <button onClick={() => setShowCatalogEditor(!showCatalogEditor)}
                className="flex items-center gap-1.5 text-xs font-bold border border-border rounded-lg px-3 py-1.5 hover:bg-accent uppercase tracking-wider">
                <Settings className="w-3.5 h-3.5" /> {showCatalogEditor ? 'Cerrar editor' : 'Editar catálogo'}
              </button>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`text-[9px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border transition-colors ${catFilter === cat ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Services grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {catalog.filter(s => catFilter === 'Todos' || s.category === catFilter).map(svc => (
                <div key={svc.id} className="bg-background border border-border rounded-2xl overflow-hidden hover:shadow-sm hover:border-foreground/30 transition-all group">
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-2xl">{svc.icon}</span>
                      <div>
                        <p className="text-xs font-bold">{svc.name}</p>
                        <p className="text-[10px] text-muted-foreground">{svc.category}</p>
                      </div>
                      {svc.popular && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0">★ TOP</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-3">{svc.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-black">${svc.base_price.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{svc.unit}</p>
                      </div>
                      <button onClick={() => addFromCatalog(svc)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg hover:bg-primary/90 uppercase tracking-wider">
                        <Plus className="w-3 h-3" /> Agregar
                      </button>
                    </div>
                  </div>
                  {showCatalogEditor && (
                    <div className="border-t border-border p-3 space-y-2 bg-muted/10">
                      <div className="flex gap-2">
                        <input value={svc.name} onChange={e => setCatalog(p => p.map(s => s.id === svc.id ? { ...s, name: e.target.value } : s))}
                          className="flex-1 text-xs border border-border rounded px-2 py-1 bg-background outline-none" />
                        <input type="number" value={svc.base_price} onChange={e => setCatalog(p => p.map(s => s.id === svc.id ? { ...s, base_price: parseFloat(e.target.value) } : s))}
                          className="w-20 text-xs border border-border rounded px-2 py-1 bg-background outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add to catalog */}
              {showCatalogEditor && (
                <button onClick={() => setCatalog(p => [...p, { id: `custom${Date.now()}`, name: 'Nuevo servicio', icon: '📦', base_price: 0, unit: 'proyecto', description: '', category: 'Desarrollo', popular: false }])}
                  className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-accent/20 transition-all">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Agregar al catálogo</p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Branding tab ──────────────────────────────────── */}
        {tab === 'branding' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-lg">
            <p className="text-xs text-muted-foreground">Personaliza cómo el cliente ve tu propuesta. Estos colores y logo se aplican solo a esta propuesta.</p>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Logo</label>
              <div className="flex items-center gap-3">
                {proposal.branding?.logo && (
                  <img src={proposal.branding.logo} alt="logo" className="h-12 object-contain border border-border rounded-xl p-1" />
                )}
                <button onClick={() => logoRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-xs hover:bg-accent font-bold uppercase tracking-wider">
                  <Image className="w-3.5 h-3.5" /> {proposal.branding?.logo ? 'Cambiar logo' : 'Subir logo'}
                </button>
                {proposal.branding?.logo && (
                  <button onClick={() => onUpdate({ branding: { ...proposal.branding, logo: null } })} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                )}
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return
                  const reader = new FileReader()
                  reader.onload = ev => onUpdate({ branding: { ...proposal.branding, logo: ev.target.result } })
                  reader.readAsDataURL(f)
                }} />
              </div>
            </div>

            {[
              { key: 'primary', label: 'Color primario (header)', default: '#18181b' },
              { key: 'secondary', label: 'Color secundario (gradiente)', default: '#3b82f6' },
              { key: 'accent', label: 'Color de acento (botones)', default: '#ffffff' },
              { key: 'bg', label: 'Fondo de la propuesta', default: '#f8fafc' },
            ].map(col => (
              <div key={col.key} className="flex items-center gap-4">
                <input type="color" value={proposal.branding?.[col.key] || col.default}
                  onChange={e => onUpdate({ branding: { ...proposal.branding, [col.key]: e.target.value } })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-border p-1 bg-transparent" />
                <div>
                  <p className="text-xs font-bold">{col.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{proposal.branding?.[col.key] || col.default}</p>
                </div>
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Email de contacto (aparece en el footer)</label>
              <input value={proposal.contact_email || ''} onChange={e => onUpdate({ contact_email: e.target.value })}
                placeholder="hola@nithrox.com" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Teléfono de contacto</label>
              <input value={proposal.contact_phone || ''} onChange={e => onUpdate({ contact_phone: e.target.value })}
                placeholder="+51 999 000 111" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
            </div>

            {/* Preview */}
            <div className="rounded-2xl overflow-hidden border border-border">
              <div className="h-16 flex items-center px-5" style={{ background: `linear-gradient(135deg, ${proposal.branding?.primary || '#18181b'}, ${proposal.branding?.secondary || '#3b82f6'})` }}>
                {proposal.branding?.logo
                  ? <img src={proposal.branding.logo} alt="logo" className="h-6 object-contain" />
                  : <span className="text-white font-black text-xs tracking-widest">NITHROX</span>
                }
              </div>
              <div className="p-4 text-xs text-muted-foreground" style={{ backgroundColor: proposal.branding?.bg || '#f8fafc' }}>
                Vista previa del encabezado
              </div>
            </div>
          </div>
        )}

        {/* ── Settings tab ──────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-lg">
            {[
              { key: 'show_unit_prices', label: 'Mostrar precios unitarios', desc: 'El cliente ve el precio por unidad' },
              { key: 'show_discounts', label: 'Mostrar descuentos', desc: 'Muestra los descuentos por línea' },
              { key: 'show_totals_breakdown', label: 'Mostrar desglose de totales', desc: 'Subtotal, descuentos, impuestos separados' },
              { key: 'allow_client_accept', label: 'Permitir aceptar online', desc: 'El cliente puede aceptar la propuesta en el portal' },
              { key: 'require_name_to_accept', label: 'Requerir nombre al aceptar', desc: 'El cliente escribe su nombre al aceptar' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl cursor-pointer hover:border-foreground/20 transition-colors">
                <div>
                  <p className="text-sm font-bold">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                </div>
                <div onClick={() => onUpdate({ settings: { ...proposal.settings, [opt.key]: !proposal.settings?.[opt.key] } })}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ml-4 ${proposal.settings?.[opt.key] ? 'bg-foreground' : 'bg-muted'}`}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: proposal.settings?.[opt.key] ? '22px' : '2px' }} />
                </div>
              </label>
            ))}

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Notas internas (no visible al cliente)</label>
              <textarea value={proposal.internal_notes || ''} onChange={e => onUpdate({ internal_notes: e.target.value })}
                placeholder="Contexto de la negociación, notas privadas..."
                rows={4} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary resize-none" />
            </div>
          </div>
        )}
      </div>

      {previewOpen && (
        <ProposalClientView proposal={proposal} onClose={() => setPreviewOpen(false)}
          onAccept={() => { onUpdate({ status: 'accepted', accepted_at: new Date().toISOString() }); setPreviewOpen(false); toast.success('¡Propuesta aceptada por el cliente!') }} />
      )}
    </div>
  )
}

// ── Main Proposals page ───────────────────────────────────────
const DEMO_PROPOSALS = [
  {
    id: 'prop1', name: 'Propuesta Tienda Online — Fashion Co.', company: 'Fashion Co.', company_id: 'co1',
    client_name: 'María Quispe', status: 'accepted', currency: 'USD', created_at: '2026-04-01',
    valid_until: '2026-05-01', views: 5, accepted: true, accepted_at: '2026-04-02',
    intro: 'Propuesta personalizada para el desarrollo de la tienda online de Fashion Co.',
    about: 'Desarrollo completo de e-commerce con catálogo, carrito y pasarela de pago integrada.',
    global_discount: 10, tax: 18, items: [
      { id: 'i1', name: 'Tienda online WooCommerce', description: 'Diseño + desarrollo completo', icon: '🛒', price: 3500, qty: 1, discount: 0 },
      { id: 'i2', name: 'Diseño UI/UX Figma', description: '3 breakpoints + design system', icon: '✏️', price: 1200, qty: 1, discount: 0 },
      { id: 'i3', name: 'Hosting + dominio', description: 'VPS + fashionco.pe por 1 año', icon: '🖥️', price: 120, qty: 1, discount: 0 },
    ],
    branding: { primary: '#18181b', secondary: '#7c3aed', accent: '#a78bfa', bg: '#faf5ff' },
    terms: '• 50% al inicio, 50% al publicar\n• 2 rondas de revisiones por fase\n• Plazo estimado: 10 semanas',
    settings: { allow_client_accept: true, show_totals_breakdown: true },
  },
  {
    id: 'prop2', name: 'Propuesta SEO + Social — TechPe', company: 'TechPe', company_id: 'co2',
    client_name: 'Luis Vera', status: 'sent', currency: 'USD', created_at: '2026-04-15',
    valid_until: '2026-05-15', views: 2, accepted: false,
    intro: 'Plan mensual de posicionamiento y gestión de redes para TechPe.',
    global_discount: 0, tax: 18, items: [
      { id: 'i1', name: 'SEO mensual', description: 'Optimización y link building', icon: '🔍', price: 600, qty: 3, discount: 0 },
      { id: 'i2', name: 'Community Manager', description: 'IG + LinkedIn + TikTok', icon: '📱', price: 450, qty: 3, discount: 10 },
    ],
    branding: { primary: '#1d4ed8', secondary: '#0ea5e9', accent: '#38bdf8', bg: '#f0f9ff' },
    terms: '• Plan mínimo 3 meses\n• Reporte mensual incluido\n• Cancelación con 30 días de aviso',
    settings: { allow_client_accept: true },
  },
]

const ST = {
  draft:    { l: 'Borrador',   c: 'bg-zinc-100 text-zinc-600' },
  sent:     { l: 'Enviada',    c: 'bg-blue-100 text-blue-700' },
  accepted: { l: '✓ Aceptada', c: 'bg-green-100 text-green-700' },
  expired:  { l: 'Expirada',   c: 'bg-red-100 text-red-700' },
}

export default function ProposalsPage() {
  const { companies, addProposal, proposals, updateProposal, deleteProposal } = useStore()
  const [all, setAll] = useState([...DEMO_PROPOSALS, ...proposals])
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [nf, setNf] = useState({ name: '', company_id: '' })

  const filtered = filter === 'all' ? all : all.filter(p => p.status === filter)
  const updateLocal = (id, data) => setAll(p => p.map(x => x.id === id ? { ...x, ...data } : x))

  const createProposal = () => {
    const co = companies.find(c => c.id === nf.company_id)
    const newP = {
      id: `prop${Date.now()}`, name: nf.name || `Propuesta — ${co?.name || 'Cliente'}`,
      company: co?.name || '', company_id: nf.company_id, client_name: '',
      status: 'draft', currency: 'USD', created_at: new Date().toLocaleDateString('es-PE'),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      views: 0, accepted: false, items: [], global_discount: 0, tax: 18,
      branding: { primary: '#18181b', secondary: '#3b82f6', accent: '#ffffff', bg: '#f8fafc' },
      settings: { allow_client_accept: true, show_totals_breakdown: true },
    }
    setAll(p => [newP, ...p])
    setEditing(newP)
    setShowNew(false)
  }

  const stats = {
    total: all.length,
    accepted: all.filter(p => p.status === 'accepted').length,
    sent: all.filter(p => p.status === 'sent').length,
    value: all.filter(p => p.status === 'accepted').reduce((s, p) => {
      const sub = p.items.reduce((is, i) => is + i.price * i.qty * (1 - (i.discount || 0) / 100), 0)
      return s + sub * (1 - (p.global_discount || 0) / 100) * (1 + (p.tax || 0) / 100)
    }, 0),
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="PROPUESTAS" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nueva propuesta
        </button>
      } />

      <div className="flex-1 overflow-hidden p-4">
      <div className="h-full rounded-xl border border-border bg-background overflow-y-auto shadow-sm p-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: 'TOTAL', v: stats.total },
            { l: 'ACEPTADAS', v: stats.accepted, c: 'text-green-600' },
            { l: 'ENVIADAS', v: stats.sent, c: 'text-blue-600' },
            { l: 'VALOR CERRADO', v: `$${Math.round(stats.value).toLocaleString()}` },
          ].map(s => (
            <div key={s.l} className="bg-background border border-border rounded-xl p-4">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
              <p className={`text-2xl font-bold mt-1 tabular-nums ${s.c || ''}`}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[['all','Todas'],['draft','Borradores'],['sent','Enviadas'],['accepted','Aceptadas'],['expired','Expiradas']].map(([id, l]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`text-[9px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border transition-colors ${filter === id ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['PROPUESTA','CLIENTE','TOTAL','VISTAS','CREADA','VÁLIDA HASTA','ESTADO',''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => {
                const sub = p.items.reduce((s, i) => s + i.price * i.qty * (1 - (i.discount || 0) / 100), 0)
                const total = sub * (1 - (p.global_discount || 0) / 100) * (1 + (p.tax || 0) / 100)
                const sym = CURRENCIES.find(c => c.id === p.currency)?.symbol || '$'
                const st = ST[p.status] || ST.draft
                const daysLeft = p.valid_until ? Math.ceil((new Date(p.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) : null

                return (
                  <tr key={p.id} className="hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => setEditing(p)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-xs font-bold">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{p.company}</td>
                    <td className="px-5 py-4 text-xs font-bold tabular-nums">{sym}{Math.round(total).toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{p.views || 0}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{p.created_at}</td>
                    <td className="px-5 py-4">
                      {daysLeft !== null && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${daysLeft <= 0 ? 'bg-red-100 text-red-700' : daysLeft <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                          {daysLeft <= 0 ? 'Expirada' : `${daysLeft}d`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${st.c}`}>{st.l}</span>
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(p)} className="w-7 h-7 border border-border rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setAll(prev => prev.filter(x => x.id !== p.id))} className="w-7 h-7 border border-border rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Sin propuestas</p>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* New proposal modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-5">Nueva propuesta</h3>
            <div className="space-y-3">
              <input value={nf.name} onChange={e => setNf(p => ({ ...p, name: e.target.value }))}
                placeholder="Nombre de la propuesta..." autoFocus
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:border-primary" />
              <select value={nf.company_id} onChange={e => setNf(p => ({ ...p, company_id: e.target.value }))}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:border-primary">
                <option value="">Seleccionar cliente...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
              <button onClick={createProposal} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider">Crear y editar →</button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal editor */}
      {editing && (
        <ProposalEditor
          proposal={editing}
          companies={companies}
          onUpdate={(data) => { const updated = { ...editing, ...data }; setEditing(updated); updateLocal(editing.id, data) }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
