import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { formatRelative, getInitials } from '../../../lib/utils'
import { loadState } from '../../../lib/persist'
import CRMTable from '../../../components/shared/CRMTable'
import { Trash2, X, Mail, Phone, MessageSquare, ExternalLink, Pencil, Eye } from 'lucide-react'
import { Label } from '../../../components/ui/label'
import { Button } from '../../../components/ui/button'
import { TypedInput } from '../../../components/shared/ColFields'
import { COL_DEFS_KEY_CONTACTS } from '../../../lib/columnTypes'

export const CONTACTS_DEFAULT_COLS = [
  { id: 'name',          label: 'Nombre',   width: 220, fixed: true, type: 'text' },
  { id: 'health_score',  label: 'Health',   width: 80,  type: 'text' },
  { id: 'email',         label: 'Email',    width: 200, type: 'email' },
  { id: 'phone',         label: 'Teléfono', width: 150, type: 'phone' },
  { id: 'company',       label: 'Empresa',  width: 150, type: 'text' },
  { id: 'lead_status',   label: 'Estado',   width: 120, type: 'text' },
  { id: 'created_at',    label: 'Creado',   width: 130, type: 'text' },
]

const LEAD_STATUS_STYLES = {
  New:        'bg-blue-100 text-blue-700',
  Contacted:  'bg-purple-100 text-purple-700',
  Qualified:  'bg-cyan-100 text-cyan-700',
  Proposal:   'bg-yellow-100 text-yellow-700',
  Won:        'bg-green-100 text-green-700',
  Lost:       'bg-red-100 text-red-600',
}

function computeHealthScore(contact, { messages, projects, contracts, meetings }) {
  let score = 0

  // Conversation recency (0-30)
  const conv = messages.find(m => m.contact_id === contact.id)
  if (conv?.last_at) {
    const days = (Date.now() - new Date(conv.last_at)) / (1000 * 60 * 60 * 24)
    if (days < 7) score += 30
    else if (days < 30) score += 20
    else if (days < 90) score += 10
  }

  // Active project (0-25)
  if (projects.some(p => p.contact_id === contact.id || (contact.company_id && p.company_id === contact.company_id))) {
    score += 25
  }

  // Signed contract (0-25)
  if (contracts.some(c => c.contact_id === contact.id && c.status === 'signed')) {
    score += 25
  }

  // Upcoming confirmed meeting (0-20)
  if (meetings.some(m =>
    m.contact_id === contact.id &&
    m.status === 'confirmed' &&
    new Date(m.date) > new Date()
  )) {
    score += 20
  }

  return score
}

function HealthBadge({ score }) {
  const color = score >= 75 ? 'bg-green-100 text-green-700'
    : score >= 50 ? 'bg-yellow-100 text-yellow-700'
    : score >= 25 ? 'bg-orange-100 text-orange-700'
    : 'bg-red-100 text-red-500'
  return (
    <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums ${color}`}>
      {score}
    </span>
  )
}

function EditPanel({ contact, companies, customCols, onSave, onClose }) {
  const [form, setForm] = useState({ ...contact })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setCustom = (k, v) => setForm(p => ({ ...p, custom: { ...p.custom, [k]: v } }))

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[380px] z-50 bg-background border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: contact.avatar_color }}>
              {getInitials(contact.name)}
            </div>
            <div>
              <p className="text-sm font-bold">{contact.name}</p>
              <p className="text-xs text-muted-foreground">Editar contacto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {[
            { k: 'name',     l: 'Nombre',     type: 'text' },
            { k: 'email',    l: 'Email',       type: 'email' },
            { k: 'phone',    l: 'Teléfono',    type: 'phone' },
            { k: 'role',     l: 'Cargo',       type: 'text' },
            { k: 'lead_status', l: 'Lead Status', type: 'text' },
            { k: 'preferred_channels', l: 'Canal preferido', type: 'text' },
          ].map(f => (
            <div key={f.k} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{f.l}</Label>
              <TypedInput col={{ id: f.k, type: f.type, label: f.l }}
                value={form[f.k] || ''}
                onChange={v => set(f.k, v)} />
            </div>
          ))}

          {/* Company selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Empresa</Label>
            <select
              value={form.company_id || ''}
              onChange={e => set('company_id', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-foreground">
              <option value="">Sin empresa</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {customCols.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Campos personalizados</p>
              <div className="space-y-3">
                {customCols.map(col => (
                  <div key={col.id} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{col.label}</Label>
                    <TypedInput col={col}
                      value={form.custom?.[col.id] || ''}
                      onChange={v => setCustom(col.id, v)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button size="sm" className="flex-1" onClick={() => onSave(form)}>Guardar cambios</Button>
        </div>
      </div>
    </>
  )
}

export default function ContactsTab({ showAddSection, onCloseAddSection }) {
  const { contacts, companies, messages, projects, contracts, meetings, updateContact, deleteContact } = useStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [editContact, setEditContact] = useState(null)
  const [customCols, setCustomCols] = useState(() =>
    loadState(COL_DEFS_KEY_CONTACTS, []).filter(c => c.id?.startsWith('col_'))
  )

  const storeData = useMemo(() => ({ messages, projects, contracts, meetings }), [messages, projects, contracts, meetings])

  const handleColsChange = (cols) => {
    setCustomCols(cols.filter(c => c.id?.startsWith('col_')))
  }

  const openEdit = (id) => {
    const c = contacts.find(x => x.id === id)
    if (c) setEditContact(c)
  }

  const saveEdit = (form) => {
    updateContact(editContact.id, form)
    setEditContact(null)
  }

  const handleDelete = (ids) => {
    ids.forEach(id => deleteContact(id))
    setSelected(s => s.filter(x => !ids.includes(x)))
  }

  const renderCell = (rowId, colId) => {
    const contact = contacts.find(c => c.id === rowId)
    if (!contact) return null
    const company = companies.find(c => c.id === contact.company_id)

    switch (colId) {
      case 'name': return (
        <div className="flex items-center gap-2 group/row w-full">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ backgroundColor: contact.avatar_color }}>
            {getInitials(contact.name)}
          </div>
          <button onClick={() => navigate(`/clients/contacts/${contact.id}`)}
            className="text-sm font-semibold truncate flex-1 text-left hover:underline">
            {contact.name}
          </button>
          {/* Hover quick actions */}
          <div className="hidden group-hover/row:flex items-center gap-0.5 shrink-0">
            <button title="Ver perfil" onClick={() => navigate(`/clients/contacts/${contact.id}`)}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Eye className="w-3 h-3" />
            </button>
            <button title="Editar" onClick={() => openEdit(contact.id)}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Pencil className="w-3 h-3" />
            </button>
            {contact.email && (
              <a href={`mailto:${contact.email}`} title="Email"
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <Mail className="w-3 h-3" />
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} title="Llamar"
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <Phone className="w-3 h-3" />
              </a>
            )}
            <button title="Abrir chat" onClick={() => navigate(`/messages?contactId=${contact.id}`)}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <MessageSquare className="w-3 h-3" />
            </button>
          </div>
        </div>
      )

      case 'health_score': {
        const score = computeHealthScore(contact, storeData)
        return <HealthBadge score={score} />
      }

      case 'email': return contact.email
        ? <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex items-center gap-1 text-xs">
            <span className="truncate">{contact.email}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        : <span className="text-muted-foreground text-xs">—</span>

      case 'phone': return contact.phone
        ? <a href={`tel:${contact.phone}`} className="text-primary hover:underline text-xs">{contact.phone}</a>
        : <span className="text-muted-foreground text-xs">—</span>

      case 'company': return company
        ? <button onClick={() => navigate(`/clients/companies/${company.id}`)}
            className="text-primary hover:underline text-xs truncate max-w-full block">
            {company.name}
          </button>
        : <span className="text-muted-foreground text-xs">—</span>

      case 'lead_status': {
        const status = contact.lead_status || 'New'
        const cls = LEAD_STATUS_STYLES[status] || 'bg-muted text-muted-foreground'
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>
      }

      case 'created_at': return <span className="text-xs text-muted-foreground">{formatRelative(contact.created_at)}</span>

      default: {
        const savedCols = loadState(COL_DEFS_KEY_CONTACTS, [])
        const colDef = savedCols.find(c => c.id === colId)
        const val = contact.custom?.[colId]
        if (!val && val !== false && val !== 'false') return <span className="text-xs text-muted-foreground">—</span>
        if (colDef?.type === 'checkbox') return <span className={`text-xs font-medium ${val === 'true' ? 'text-green-600' : 'text-muted-foreground'}`}>{val === 'true' ? '✓ Sí' : '✗ No'}</span>
        if (colDef?.type === 'rating') { const n = Number(val) || 0; return <span className="text-amber-400 text-sm">{'★'.repeat(n)}</span> }
        if (colDef?.type === 'currency') return <span className="text-xs">${Number(val).toLocaleString()}</span>
        return <span className="text-xs text-muted-foreground truncate block max-w-full">{String(val)}</span>
      }
    }
  }

  const bulkBar = selected.length > 0 ? (
    <div className="flex items-center gap-3 px-4 py-2 bg-foreground text-background text-sm shrink-0">
      <span className="font-medium text-xs">{selected.length} seleccionado{selected.length > 1 ? 's' : ''}</span>
      <div className="flex gap-1.5 ml-2">
        {selected.length === 1 && (
          <>
            <button onClick={() => navigate(`/clients/contacts/${selected[0]}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">
              <Eye className="w-3.5 h-3.5" /> Ver
            </button>
            <button onClick={() => openEdit(selected[0])}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          </>
        )}
        <button onClick={() => handleDelete(selected)}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/80 hover:bg-red-500 text-xs">
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
      <button onClick={() => setSelected([])} className="ml-auto p-1 rounded hover:bg-white/10">
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : null

  return (
    <>
      <CRMTable
        storageKey={COL_DEFS_KEY_CONTACTS}
        defaultCols={CONTACTS_DEFAULT_COLS}
        rows={contacts}
        renderCell={renderCell}
        selected={selected}
        onSelect={(id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])}
        onSelectAll={() => setSelected(s => s.length === contacts.length ? [] : contacts.map(c => c.id))}
        addSectionOpen={showAddSection}
        onAddSectionClose={onCloseAddSection}
        bulkBar={bulkBar}
        onColsChange={handleColsChange}
      />

      {editContact && (
        <EditPanel
          contact={editContact}
          companies={companies}
          customCols={customCols}
          onSave={saveEdit}
          onClose={() => setEditContact(null)}
        />
      )}
    </>
  )
}
