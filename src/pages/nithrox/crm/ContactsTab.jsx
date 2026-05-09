import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { formatRelative, getInitials } from '../../../lib/utils'
import { loadState } from '../../../lib/persist'
import CRMTable from '../../../components/shared/CRMTable'
import { Eye, Pencil, Trash2, X, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { TypedInput } from '../../../components/shared/ColFields'
import { COL_DEFS_KEY_CONTACTS } from '../../../lib/columnTypes'

export const CONTACTS_DEFAULT_COLS = [
  { id: 'name',               label: 'Nombre',         width: 220, fixed: true, type: 'text' },
  { id: 'email',              label: 'Email',           width: 200, type: 'email' },
  { id: 'phone',              label: 'Teléfono',        width: 180, type: 'phone' },
  { id: 'company',            label: 'Empresa',         width: 150, type: 'text' },
  { id: 'lead_status',        label: 'Lead Status',     width: 130, type: 'text' },
  { id: 'preferred_channels', label: 'Canal',           width: 120, type: 'text' },
  { id: 'created_at',         label: 'Creado',          width: 130, type: 'text' },
]

export default function ContactsTab({ showAddSection, onCloseAddSection }) {
  const { contacts, companies, updateContact, deleteContact } = useStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [editContact, setEditContact] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [customCols, setCustomCols] = useState(() => {
    const saved = loadState(COL_DEFS_KEY_CONTACTS, [])
    return saved.filter(c => c.id?.startsWith('col_'))
  })

  const handleColsChange = (cols) => {
    const custom = cols.filter(c => c.id?.startsWith('col_'))
    setCustomCols(custom)
  }

  const openEdit = (id) => {
    const c = contacts.find(x => x.id === id)
    setEditContact(c); setEditForm({ ...c })
  }

  const saveEdit = () => {
    updateContact(editContact.id, editForm)
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
        <button onClick={() => navigate(`/clients/contacts/${contact.id}`)}
          className="flex items-center gap-2 hover:underline text-left w-full">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: contact.avatar_color }}>
            {getInitials(contact.name)}
          </div>
          <span className="text-sm font-medium text-primary truncate">{contact.name}</span>
        </button>
      )
      case 'email': return contact.email
        ? <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex items-center gap-1 text-xs">{contact.email}<ExternalLink className="w-3 h-3 shrink-0" /></a>
        : <span className="text-muted-foreground text-xs">—</span>
      case 'phone': return contact.phone
        ? <a href={`tel:${contact.phone}`} className="text-primary hover:underline text-xs">{contact.phone}</a>
        : <span className="text-muted-foreground text-xs">—</span>
      case 'company': return company
        ? <button onClick={() => navigate(`/clients/companies/${company.id}`)} className="text-primary hover:underline text-xs truncate">{company.name}</button>
        : <span className="text-muted-foreground text-xs">—</span>
      case 'created_at': return <span className="text-xs text-muted-foreground">{formatRelative(contact.created_at)}</span>
      default:
        // custom column
        return <span className="text-xs text-muted-foreground truncate">{contact.custom?.[colId] || '—'}</span>
    }
  }

  const bulkBar = selected.length > 0 ? (
    <div className="flex items-center gap-3 px-4 py-2 bg-foreground text-background text-sm shrink-0">
      <span className="font-medium text-xs">{selected.length} seleccionado{selected.length > 1 ? 's' : ''}</span>
      <div className="flex gap-1.5 ml-2">
        {selected.length === 1 && (
          <>
            <button onClick={() => navigate(`/clients/contacts/${selected[0]}`)} className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">
              <Eye className="w-3.5 h-3.5" /> Ver
            </button>
            <button onClick={() => openEdit(selected[0])} className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          </>
        )}
        <button onClick={() => handleDelete(selected)} className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/80 hover:bg-red-500 text-xs">
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
      <button onClick={() => setSelected([])} className="ml-auto p-1 rounded hover:bg-white/10"><X className="w-4 h-4" /></button>
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

      {/* Edit dialog */}
      <Dialog open={!!editContact} onOpenChange={() => setEditContact(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar contacto</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-96 overflow-y-auto">
            {[
              { k: 'name', l: 'Nombre', span: true, type: 'text' },
              { k: 'email', l: 'Email', type: 'email' },
              { k: 'phone', l: 'Teléfono', type: 'phone' },
              { k: 'role', l: 'Cargo', type: 'text' },
              { k: 'lead_status', l: 'Lead Status', type: 'text' },
              { k: 'preferred_channels', l: 'Canal', type: 'text' },
            ].map(f => (
              <div key={f.k} className={`space-y-1.5 ${f.span ? 'col-span-2' : ''}`}>
                <Label className="text-xs">{f.l}</Label>
                <TypedInput col={{ id: f.k, type: f.type, label: f.l }}
                  value={editForm[f.k] || ''}
                  onChange={v => setEditForm(p => ({ ...p, [f.k]: v }))} />
              </div>
            ))}
            {/* Custom cols */}
            {customCols.map(col => (
              <div key={col.id} className="space-y-1.5">
                <Label className="text-xs">{col.label}</Label>
                <TypedInput col={col}
                  value={editForm.custom?.[col.id] || ''}
                  onChange={v => setEditForm(p => ({ ...p, custom: { ...p.custom, [col.id]: v } }))} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditContact(null)}>Cancelar</Button>
            <Button size="sm" onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
