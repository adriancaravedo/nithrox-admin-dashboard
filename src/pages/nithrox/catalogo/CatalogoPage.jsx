import { useState } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { Tag, Plus, Users, Check, Pencil, Trash2, X, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['Diseño Web', 'App Móvil', 'Marketing', 'Hosting', 'Consultoría', 'Automatización', 'SEO', 'Otro']

const SAMPLE_SERVICES = [
  { id: '1', name: 'Sitio Web Corporativo', category: 'Diseño Web', price: 1500, currency: 'USD', description: 'Diseño y desarrollo de sitio web profesional hasta 8 páginas, responsive, SEO básico.', features: ['Diseño personalizado', 'Hasta 8 páginas', 'Responsive', 'SEO básico', 'Formulario de contacto'], active: true, clients: 4 },
  { id: '2', name: 'Tienda Online', category: 'Diseño Web', price: 2800, currency: 'USD', description: 'E-commerce completo con carrito, pagos, gestión de inventario.', features: ['Catálogo de productos', 'Carrito de compras', 'Pasarela de pago', 'Panel de admin', 'Reportes de ventas'], active: true, clients: 2 },
  { id: '3', name: 'App Móvil', category: 'App Móvil', price: 5000, currency: 'USD', description: 'Aplicación nativa iOS y Android.', features: ['iOS + Android', 'Diseño UX/UI', 'Backend incluido', 'Publicación en stores', '3 meses de soporte'], active: true, clients: 1 },
  { id: '4', name: 'Hosting VPS', category: 'Hosting', price: 49, currency: 'USD', description: 'Servidor privado con soporte 24/7, backups diarios.', features: ['2 vCPU / 4GB RAM', 'Backups diarios', 'SSL gratuito', 'Soporte 24/7', 'Panel de control'], active: true, clients: 6, recurring: 'monthly' },
  { id: '5', name: 'SEO Mensual', category: 'SEO', price: 350, currency: 'USD', description: 'Optimización continua de posicionamiento en buscadores.', features: ['Auditoría mensual', 'Link building', 'Contenido optimizado', 'Reportes mensuales', 'Google Analytics'], active: false, clients: 0, recurring: 'monthly' },
]

function ServiceForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    name: '', category: CATEGORIES[0], price: '', currency: 'USD',
    description: '', features: [''], active: true, recurring: null,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addFeature = () => set('features', [...(form.features || []), ''])
  const setFeature = (i, v) => set('features', form.features.map((f, idx) => idx === i ? v : f))
  const removeFeature = (i) => set('features', form.features.filter((_, idx) => idx !== i))

  const handleSave = () => {
    if (!form.name.trim() || !form.price) { toast.error('Nombre y precio son requeridos'); return }
    onSave({ ...form, price: parseFloat(form.price), id: form.id || `s${Date.now()}` })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="font-bold text-sm">{initial?.id ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Nombre *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Sitio Web Corporativo"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Categoría</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-foreground">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Recurrencia</label>
              <select value={form.recurring || ''} onChange={e => set('recurring', e.target.value || null)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-foreground">
                <option value="">Único</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Precio *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="1500"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Moneda</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-foreground">
                <option value="USD">USD</option>
                <option value="PEN">PEN</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Descripción</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-foreground resize-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Incluye (features)</label>
              <button onClick={addFeature} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            <div className="space-y-1.5">
              {(form.features || []).map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input value={f} onChange={e => setFeature(i, e.target.value)}
                    placeholder="Feature..."
                    className="flex-1 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-foreground" />
                  <button onClick={() => removeFeature(i)} className="text-muted-foreground hover:text-destructive p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => set('active', !form.active)}
              className={`w-9 h-5 rounded-full transition-colors relative ${form.active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-xs text-muted-foreground">Servicio activo</span>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-accent transition-colors">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2 text-sm bg-foreground text-background rounded-xl hover:bg-foreground/90 font-semibold transition-colors">Guardar</button>
        </div>
      </div>
    </div>
  )
}

export default function CatalogoPage() {
  const [services, setServices] = useState(SAMPLE_SERVICES)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')

  const categories = ['all', ...new Set(services.map(s => s.category))]

  const filtered = filter === 'all' ? services : services.filter(s => s.category === filter)

  const handleSave = (service) => {
    if (service.id && services.find(s => s.id === service.id)) {
      setServices(prev => prev.map(s => s.id === service.id ? service : s))
      toast.success('Servicio actualizado')
    } else {
      setServices(prev => [...prev, { ...service, clients: 0 }])
      toast.success('Servicio creado')
    }
    setEditing(null)
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setServices(prev => prev.filter(s => s.id !== id))
    toast.success('Servicio eliminado')
  }

  const totalRevenue = services.filter(s => s.active).reduce((sum, s) => sum + (s.price * (s.clients || 1)), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="CATÁLOGO" actions={
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:bg-foreground/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nuevo servicio
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Servicios activos', value: services.filter(s => s.active).length, icon: Tag },
            { label: 'Clientes activos', value: services.reduce((s, v) => s + (v.clients || 0), 0), icon: Users },
            { label: 'Revenue mensual', value: `$${services.filter(s => s.recurring === 'monthly').reduce((sum, s) => sum + s.price * (s.clients || 0), 0).toLocaleString()}`, icon: Check },
            { label: 'Revenue total', value: `$${totalRevenue.toLocaleString()}`, icon: ChevronRight },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-background border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-xl font-black">{value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors capitalize ${filter === cat ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(service => (
            <div key={service.id} className={`bg-background border rounded-2xl p-5 flex flex-col gap-3 transition-all ${service.active ? 'border-border' : 'border-dashed border-border opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-muted rounded-full">{service.category}</span>
                    {service.recurring && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize">{service.recurring}</span>
                    )}
                    {!service.active && <span className="text-[10px] font-bold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Inactivo</span>}
                  </div>
                  <h3 className="font-bold text-sm">{service.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(service); setShowForm(false) }}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(service.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Features */}
              {service.features?.length > 0 && (
                <div className="space-y-1">
                  {service.features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-green-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {service.features.length > 4 && (
                    <p className="text-[10px] text-muted-foreground">+{service.features.length - 4} más</p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                <div>
                  <p className="font-black text-base">${service.price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{service.currency}{service.recurring ? `/${service.recurring === 'monthly' ? 'mes' : service.recurring}` : ''}</span></p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{service.clients || 0} cliente{service.clients !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(showForm || editing) && (
        <ServiceForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
