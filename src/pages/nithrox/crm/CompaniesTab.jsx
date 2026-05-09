import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { formatRelative, getInitials } from '../../../lib/utils'
import { loadState } from '../../../lib/persist'
import CRMTable from '../../../components/shared/CRMTable'
import { Eye, Pencil, Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { TypedInput } from '../../../components/shared/ColFields'
import { COL_DEFS_KEY_COMPANIES } from '../../../lib/columnTypes'

export const COMPANIES_DEFAULT_COLS = [
  { id: 'name',          label: 'Empresa',          width: 220, fixed: true, type: 'text' },
  { id: 'owner',         label: 'Owner',             width: 160, type: 'text' },
  { id: 'phone',         label: 'Teléfono',          width: 180, type: 'phone' },
  { id: 'industry',      label: 'Industria',         width: 130, type: 'text' },
  { id: 'city',          label: 'Ciudad',            width: 110, type: 'text' },
  { id: 'country',       label: 'País',              width: 100, type: 'text' },
  { id: 'last_activity', label: 'Última actividad',  width: 150, type: 'text' },
  { id: 'created_at',    label: 'Creado',            width: 130, type: 'text' },
]

export default function CompaniesTab({ showAddSection, onCloseAddSection }) {
  const { companies, updateCompany, deleteCompany } = useStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [editCompany, setEditCompany] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [customCols, setCustomCols] = useState(() =>
    loadState(COL_DEFS_KEY_COMPANIES, []).filter(c => c.id?.startsWith('col_'))
  )

  const openEdit = (id) => { const c = companies.find(x => x.id === id); setEditCompany(c); setEditForm({ ...c }) }
  const saveEdit = () => { updateCompany(editCompany.id, editForm); setEditCompany(null) }
  const handleDelete = (ids) => { ids.forEach(id => deleteCompany(id)); setSelected(s => s.filter(x => !ids.includes(x))) }

  const renderCell = (rowId, colId) => {
    const company = companies.find(c => c.id === rowId)
    if (!company) return null
    switch (colId) {
      case 'name': return (
        <button onClick={() => navigate(`/clients/companies/${company.id}`)}
          className="flex items-center gap-2 hover:underline text-left w-full">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: company.avatar_color }}>
            {getInitials(company.name)}
          </div>
          <span className="text-sm font-medium text-primary truncate">{company.name}</span>
        </button>
      )
      case 'last_activity':
      case 'created_at': return <span className="text-xs text-muted-foreground">{formatRelative(company[colId])}</span>
      default:
        if (colId.startsWith('col_')) return <span className="text-xs text-muted-foreground truncate">{company.custom?.[colId] || '—'}</span>
        return <span className="text-xs text-muted-foreground truncate">{company[colId] || '—'}</span>
    }
  }

  const bulkBar = selected.length > 0 ? (
    <div className="flex items-center gap-3 px-4 py-2 bg-foreground text-background text-sm shrink-0">
      <span className="font-medium text-xs">{selected.length} seleccionada{selected.length > 1 ? 's' : ''}</span>
      <div className="flex gap-1.5 ml-2">
        {selected.length === 1 && (
          <>
            <button onClick={() => navigate(`/clients/companies/${selected[0]}`)} className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">
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
        storageKey={COL_DEFS_KEY_COMPANIES}
        defaultCols={COMPANIES_DEFAULT_COLS}
        rows={companies}
        renderCell={renderCell}
        selected={selected}
        onSelect={(id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])}
        onSelectAll={() => setSelected(s => s.length === companies.length ? [] : companies.map(c => c.id))}
        addSectionOpen={showAddSection}
        onAddSectionClose={onCloseAddSection}
        bulkBar={bulkBar}
        onColsChange={(cols) => setCustomCols(cols.filter(c => c.id?.startsWith('col_')))}
      />

      <Dialog open={!!editCompany} onOpenChange={() => setEditCompany(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar empresa</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-96 overflow-y-auto">
            {[
              { k: 'name', l: 'Nombre', span: true, type: 'text' },
              { k: 'domain', l: 'Dominio', type: 'url' },
              { k: 'phone', l: 'Teléfono', type: 'phone' },
              { k: 'industry', l: 'Industria', type: 'text' },
              { k: 'city', l: 'Ciudad', type: 'text' },
              { k: 'country', l: 'País', type: 'text' },
              { k: 'ruc', l: 'RUC', type: 'text' },
            ].map(f => (
              <div key={f.k} className={`space-y-1.5 ${f.span ? 'col-span-2' : ''}`}>
                <Label className="text-xs">{f.l}</Label>
                <TypedInput col={{ id: f.k, type: f.type, label: f.l }}
                  value={editForm[f.k] || ''}
                  onChange={v => setEditForm(p => ({ ...p, [f.k]: v }))} />
              </div>
            ))}
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
            <Button variant="outline" size="sm" onClick={() => setEditCompany(null)}>Cancelar</Button>
            <Button size="sm" onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
