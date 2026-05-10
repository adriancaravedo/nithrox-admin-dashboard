import { useState } from 'react'
import { useStore } from '../../../stores/useStore'
import { LEAD_STATUSES, DEAL_STAGES, INDUSTRIES, LIFECYCLE_STAGES } from '../../../lib/utils'
import { loadState } from '../../../lib/persist'
import { TypedInput, PhoneInput } from '../../../components/shared/ColFields'
import { validateField } from '../../../lib/columnTypes'
import { COL_DEFS_KEY_CONTACTS, COL_DEFS_KEY_COMPANIES } from '../../../lib/columnTypes'
import { CONTACTS_DEFAULT_COLS } from './ContactsTab'
import { COMPANIES_DEFAULT_COLS } from './CompaniesTab'
import { X, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ── Reusable Modal ────────────────────────────────────────────
function Modal({ open, onClose, title, children, onSubmit, submitLabel, submitDisabled, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} disabled={loading} className="text-muted-foreground hover:text-foreground w-7 h-7 flex items-center justify-center rounded-full hover:bg-accent transition-colors disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 pb-4 space-y-4 overflow-y-auto flex-1">{children}</div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-40">Cancelar</button>
          <button onClick={onSubmit} disabled={submitDisabled || loading}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

// ── Combobox (search existing OR type to create new) ──────────
function Combobox({ value, onChange, onNewValue, options, placeholder, newLabel }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative">
      <input
        value={open ? search : selected?.label || ''}
        onChange={e => { setSearch(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => { setOpen(true); setSearch('') }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-44 overflow-y-auto">
          {filtered.map(o => (
            <button key={o.value} type="button" onMouseDown={() => { onChange(o.value); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">
              {o.label}
            </button>
          ))}
          {search.trim() && !filtered.find(o => o.label.toLowerCase() === search.toLowerCase()) && (
            <button type="button" onMouseDown={() => { onNewValue(search.trim()); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-primary font-medium border-t border-border hover:bg-accent transition-colors">
              <Plus className="w-3.5 h-3.5 inline mr-1" />{newLabel} "{search.trim()}"
            </button>
          )}
          {filtered.length === 0 && !search.trim() && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Add Contact ───────────────────────────────────────────────
export function AddContactDialog({ open, onClose }) {
  const { addContact, companies } = useStore()
  const [f, setF] = useState({
    name: '', email: '', phone: '', role: '',
    company_id: '', new_company_name: '',
    lead_status: 'New', preferred_channels: '', topics: '', notes: '',
    custom: {}
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const customCols = loadState(COL_DEFS_KEY_CONTACTS, []).filter(c => c.id?.startsWith('col_'))

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const setCustom = (colId, v) => setF(p => ({ ...p, custom: { ...p.custom, [colId]: v } }))

  const validate = () => {
    const errs = {}
    if (!f.name.trim()) errs.name = 'Requerido'
    const emailErr = validateField('email', f.email)
    if (f.email && emailErr) errs.email = emailErr
    customCols.forEach(col => {
      const err = validateField(col.type, f.custom?.[col.id])
      if (err) errs[col.id] = err
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const result = await addContact(f)
      if (!result) throw new Error('No se pudo crear el contacto')
      toast.success(`Contacto "${f.name}" creado`)
      setF({ name: '', email: '', phone: '', role: '', company_id: '', new_company_name: '', lead_status: 'New', preferred_channels: '', topics: '', notes: '', custom: {} })
      setErrors({})
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Error al crear contacto')
    } finally {
      setLoading(false)
    }
  }

  const companyOptions = companies.map(c => ({ value: c.id, label: c.name }))

  return (
    <Modal open={open} onClose={onClose} title="Nuevo contacto"
      onSubmit={handleSubmit} submitLabel="Crear contacto" submitDisabled={!f.name.trim()} loading={loading}>

      <Field label="Nombre completo" required>
        <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="María Quispe"
          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none bg-background ${errors.name ? 'border-red-400' : 'border-border focus:border-primary'}`} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <input type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="maria@empresa.pe"
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none bg-background ${errors.email ? 'border-red-400' : 'border-border focus:border-primary'}`} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </Field>

        <Field label="Teléfono">
          <PhoneInput value={f.phone} onChange={v => set('phone', v)} />
        </Field>

        <Field label="Cargo / Rol">
          <input value={f.role} onChange={e => set('role', e.target.value)} placeholder="CEO, Gerente..."
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>

        <Field label="Empresa">
          <Combobox
            value={f.company_id}
            onChange={v => { set('company_id', v); set('new_company_name', '') }}
            onNewValue={v => { set('new_company_name', v); set('company_id', '') }}
            options={companyOptions}
            placeholder="Buscar o crear empresa..."
            newLabel="Crear empresa"
          />
          {f.new_company_name && (
            <p className="text-xs text-primary mt-1">✓ Se creará: <strong>{f.new_company_name}</strong></p>
          )}
        </Field>

        <Field label="Lead Status">
          <select value={f.lead_status} onChange={e => set('lead_status', e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Canal preferido">
          <input value={f.preferred_channels} onChange={e => set('preferred_channels', e.target.value)} placeholder="Email, WhatsApp..."
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>

        <Field label="Temas">
          <input value={f.topics} onChange={e => set('topics', e.target.value)} placeholder="Diseño web, E-commerce..."
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>
      </div>

      {/* Custom columns */}
      {customCols.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campos personalizados</p>
          <div className="grid grid-cols-2 gap-3">
            {customCols.map(col => (
              <div key={col.id} className="space-y-1.5">
                <label className="text-sm font-medium">{col.label}</label>
                <TypedInput col={col} value={f.custom?.[col.id] || ''} onChange={v => setCustom(col.id, v)} />
                {errors[col.id] && <p className="text-xs text-red-500">{errors[col.id]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Field label="Notas">
        <textarea value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas sobre este contacto..."
          rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background resize-none" />
      </Field>
    </Modal>
  )
}

// ── Add Company ───────────────────────────────────────────────
export function AddCompanyDialog({ open, onClose }) {
  const { addCompany, contacts } = useStore()
  const [f, setF] = useState({
    name: '', domain: '', industry: '', city: '', country: 'Perú',
    ruc: '', phone: '', owner: '', lifecycle: 'Lead', lead_status: 'New',
    contact_id: '', new_contact_name: '', custom: {}
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const customCols = loadState(COL_DEFS_KEY_COMPANIES, []).filter(c => c.id?.startsWith('col_'))

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const setCustom = (colId, v) => setF(p => ({ ...p, custom: { ...p.custom, [colId]: v } }))

  const validate = () => {
    const errs = {}
    if (!f.name.trim()) errs.name = 'Requerido'
    customCols.forEach(col => {
      const err = validateField(col.type, f.custom?.[col.id])
      if (err) errs[col.id] = err
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const result = await addCompany(f)
      if (!result) throw new Error('No se pudo crear la empresa')
      toast.success(`Empresa "${f.name}" creada`)
      setF({ name: '', domain: '', industry: '', city: '', country: 'Perú', ruc: '', phone: '', owner: '', lifecycle: 'Lead', lead_status: 'New', contact_id: '', new_contact_name: '', custom: {} })
      setErrors({})
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Error al crear empresa')
    } finally {
      setLoading(false)
    }
  }

  const contactOptions = contacts.map(c => ({ value: c.id, label: c.name }))

  return (
    <Modal open={open} onClose={onClose} title="Nueva empresa"
      onSubmit={handleSubmit} submitLabel="Crear empresa" submitDisabled={!f.name.trim()} loading={loading}>

      <Field label="Nombre de la empresa" required>
        <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Fashion Co."
          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none bg-background ${errors.name ? 'border-red-400' : 'border-border focus:border-primary'}`} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dominio / Web">
          <input value={f.domain} onChange={e => set('domain', e.target.value)} placeholder="fashionco.pe"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>
        <Field label="RUC">
          <input value={f.ruc} onChange={e => set('ruc', e.target.value)} placeholder="20123456789"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>
        <Field label="Industria">
          <select value={f.industry} onChange={e => set('industry', e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
            <option value="">Seleccionar...</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
        <Field label="Teléfono">
          <PhoneInput value={f.phone} onChange={v => set('phone', v)} />
        </Field>
        <Field label="Ciudad">
          <input value={f.city} onChange={e => set('city', e.target.value)} placeholder="Lima"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>
        <Field label="País">
          <input value={f.country} onChange={e => set('country', e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>
        <Field label="Owner">
          <input value={f.owner} onChange={e => set('owner', e.target.value)} placeholder="Nombre del responsable..."
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>
        <Field label="Lifecycle">
          <select value={f.lifecycle} onChange={e => set('lifecycle', e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
            {LIFECYCLE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Lead Status">
          <select value={f.lead_status} onChange={e => set('lead_status', e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Contacto principal">
        <Combobox
          value={f.contact_id}
          onChange={v => { set('contact_id', v); set('new_contact_name', '') }}
          onNewValue={v => { set('new_contact_name', v); set('contact_id', '') }}
          options={contactOptions}
          placeholder="Buscar o crear contacto..."
          newLabel="Crear contacto"
        />
        {f.new_contact_name && (
          <p className="text-xs text-primary mt-1">✓ Se creará: <strong>{f.new_contact_name}</strong></p>
        )}
      </Field>

      {customCols.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campos personalizados</p>
          <div className="grid grid-cols-2 gap-3">
            {customCols.map(col => (
              <div key={col.id} className="space-y-1.5">
                <label className="text-sm font-medium">{col.label}</label>
                <TypedInput col={col} value={f.custom?.[col.id] || ''} onChange={v => setCustom(col.id, v)} />
                {errors[col.id] && <p className="text-xs text-red-500">{errors[col.id]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Add Deal ──────────────────────────────────────────────────
export function AddDealDialog({ open, onClose }) {
  const { addDeal, companies, contacts } = useStore()
  const [f, setF] = useState({
    name: '', amount: '', currency: 'USD', stage: 'new',
    close_date: '', company_id: '', type: 'New Business', priority: 'Medium'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!f.name) return
    setLoading(true)
    try {
      const result = await addDeal({ ...f, amount: parseFloat(f.amount) || 0, owner: 'Adrian Caravedo' })
      if (!result) throw new Error('No se pudo crear el deal')
      toast.success(`Deal "${f.name}" creado`)
      setF({ name: '', amount: '', currency: 'USD', stage: 'new', close_date: '', company_id: '', type: 'New Business', priority: 'Medium' })
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Error al crear deal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo deal"
      onSubmit={handleSubmit} submitLabel="Crear deal" submitDisabled={!f.name.trim()} loading={loading}>

      <Field label="Nombre del deal" required>
        <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Tienda Online Fashion Co."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto">
          <input type="number" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} placeholder="0"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>
        <Field label="Moneda">
          <select value={f.currency} onChange={e => setF(p => ({ ...p, currency: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
            <option value="USD">USD ($)</option>
            <option value="PEN">PEN (S/)</option>
          </select>
        </Field>
        <Field label="Etapa">
          <select value={f.stage} onChange={e => setF(p => ({ ...p, stage: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
            {DEAL_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Fecha de cierre">
          <input type="date" value={f.close_date} onChange={e => setF(p => ({ ...p, close_date: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </Field>
        <Field label="Empresa">
          <select value={f.company_id} onChange={e => setF(p => ({ ...p, company_id: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
            <option value="">Seleccionar...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Prioridad">
          <select value={f.priority} onChange={e => setF(p => ({ ...p, priority: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
            <option value="High">Alta</option>
            <option value="Medium">Media</option>
            <option value="Low">Baja</option>
          </select>
        </Field>
      </div>
    </Modal>
  )
}
