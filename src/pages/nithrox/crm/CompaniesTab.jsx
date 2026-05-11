import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { formatRelative, getInitials } from '../../../lib/utils'
import { loadState } from '../../../lib/persist'
import CRMTable from '../../../components/shared/CRMTable'
import { Trash2, X, Phone, MessageSquare, ExternalLink, Pencil, Eye, Building2 } from 'lucide-react'
import { Label } from '../../../components/ui/label'
import { Button } from '../../../components/ui/button'
import { TypedInput } from '../../../components/shared/ColFields'
import { COL_DEFS_KEY_COMPANIES } from '../../../lib/columnTypes'

export const COMPANIES_DEFAULT_COLS = [
  { id: 'name',          label: 'Empresa',         width: 220, fixed: true, type: 'text' },
  { id: 'health_score',  label: 'Health',           width: 80,  type: 'text' },
  { id: 'owner',         label: 'Owner',             width: 150, type: 'text' },
  { id: 'phone',         label: 'Teléfono',          width: 150, type: 'phone' },
  { id: 'industry',      label: 'Industria',         width: 130, type: 'text' },
  { id: 'city',          label: 'Ciudad',            width: 110, type: 'text' },
  { id: 'last_activity', label: 'Última actividad',  width: 150, type: 'text' },
  { id: 'created_at',    label: 'Creado',            width: 130, type: 'text' },
]

function computeCompanyHealthScore(company, contacts, { messages, projects, contracts, meetings }) {
  // All contacts that belong to this company
  const companyContactIds = contacts.filter(c => c.company_id === company.id).map(c => c.id)
  let score = 0

  // Conversation recency (0-30) — any contact of this company
  const conv = messages.find(m => m.company_id === company.id || companyContactIds.includes(m.contact_id))
  if (conv?.last_at) {
    const days = (Date.now() - new Date(conv.last_at)) / (1000 * 60 * 60 * 24)
    if (days < 7) score += 30
    else if (days < 30) score += 20
    else if (days < 90) score += 10
  }

  // Active project (0-25)
  if (projects.some(p => p.company_id === company.id || companyContactIds.includes(p.contact_id))) {
    score += 25
  }

  // Signed contract (0-25)
  if (contracts.some(c => companyContactIds.includes(c.contact_id) && c.status === 'signed')) {
    score += 25
  }

  // Upcoming confirmed meeting (0-20)
  if (meetings.some(m =>
    companyContactIds.includes(m.contact_id) &&
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

function EditPanel({ company, customCols, onSave, onClose }) {
  const [form, setForm] = useState({ ...company })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setCustom = (k, v) => setForm(p => ({ ...p, custom: { ...p.custom, [k]: v } }))

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[380px] z-50 bg-background border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted shrink-0">
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold">{company.name}</p>
              <p className="text-xs text-muted-foreground">Editar empresa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {[
            { k: 'name',     l: 'Nombre',    type: 'text' },
            { k: 'domain',   l: 'Dominio',   type: 'url' },
            { k: 'phone',    l: 'Teléfono',  type: 'phone' },
            { k: 'industry', l: 'Industria', type: 'text' },
            { k: 'city',     l: 'Ciudad',    type: 'text' },
            { k: 'country',  l: 'País',      type: 'text' },
            { k: 'ruc',      l: 'RUC',       type: 'text' },
          ].map(f => (
            <div key={f.k} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{f.l}</Label>
              <TypedInput col={{ id: f.k, type: f.type, label: f.l }}
                value={form[f.k] || ''}
                onChange={v => set(f.k, v)} />
            </div>
          ))}

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

export default function CompaniesTab({ showAddSection, onCloseAddSection }) {
  const { companies, contacts, messages, projects, contracts, meetings, updateCompany, deleteCompany } = useStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [editCompany, setEditCompany] = useState(null)
  const [customCols, setCustomCols] = useState(() =>
    loadState(COL_DEFS_KEY_COMPANIES, []).filter(c => c.id?.startsWith('col_'))
  )

  const storeData = useMemo(() => ({ messages, projects, contracts, meetings }), [messages, projects, contracts, meetings])

  const openEdit = (id) => {
    const c = companies.find(x => x.id === id)
    if (c) setEditCompany(c)
  }
  const saveEdit = (form) => { updateCompany(editCompany.id, form); setEditCompany(null) }
  const handleDelete = (ids) => { ids.forEach(id => deleteCompany(id)); setSelected(s => s.filter(x => !ids.includes(x))) }

  const renderCell = (rowId, colId) => {
    const company = companies.find(c => c.id === rowId)
    if (!company) return null

    switch (colId) {
      case 'name': return (
        <div className="flex items-center gap-2 group/row w-full">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ backgroundColor: company.avatar_color }}>
            {getInitials(company.name)}
          </div>
          <button onClick={() => navigate(`/clients/companies/${company.id}`)}
            className="text-sm font-semibold truncate flex-1 text-left hover:underline">
            {company.name}
          </button>
          <div className="hidden group-hover/row:flex items-center gap-0.5 shrink-0">
            <button title="Ver empresa" onClick={() => navigate(`/clients/companies/${company.id}`)}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Eye className="w-3 h-3" />
            </button>
            <button title="Editar" onClick={() => openEdit(company.id)}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Pencil className="w-3 h-3" />
            </button>
            {company.phone && (
              <a href={`tel:${company.phone}`} title="Llamar"
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <Phone className="w-3 h-3" />
              </a>
            )}
            <button title="Abrir chat" onClick={() => navigate(`/messages`)}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <MessageSquare className="w-3 h-3" />
            </button>
            {company.domain && (
              <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" title="Sitio web"
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )

      case 'health_score': {
        const score = computeCompanyHealthScore(company, contacts, storeData)
        return <HealthBadge score={score} />
      }

      case 'last_activity':
      case 'created_at': return <span className="text-xs text-muted-foreground">{formatRelative(company[colId])}</span>

      default: {
        if (colId.startsWith('col_')) {
          const savedCols = loadState(COL_DEFS_KEY_COMPANIES, [])
          const colDef = savedCols.find(c => c.id === colId)
          const val = company.custom?.[colId]
          if (!val && val !== false && val !== 'false') return <span className="text-xs text-muted-foreground">—</span>
          if (colDef?.type === 'checkbox') return <span className={`text-xs font-medium ${val === 'true' ? 'text-green-600' : 'text-muted-foreground'}`}>{val === 'true' ? '✓ Sí' : '✗ No'}</span>
          if (colDef?.type === 'rating') { const n = Number(val) || 0; return <span className="text-amber-400 text-sm">{'★'.repeat(n)}</span> }
          if (colDef?.type === 'currency') return <span className="text-xs">${Number(val).toLocaleString()}</span>
          return <span className="text-xs text-muted-foreground truncate block max-w-full">{String(val)}</span>
        }
        return <span className="text-xs text-muted-foreground truncate">{company[colId] || '—'}</span>
      }
    }
  }

  const bulkBar = selected.length > 0 ? (
    <div className="flex items-center gap-3 px-4 py-2 bg-foreground text-background text-sm shrink-0">
      <span className="font-medium text-xs">{selected.length} seleccionada{selected.length > 1 ? 's' : ''}</span>
      <div className="flex gap-1.5 ml-2">
        {selected.length === 1 && (
          <>
            <button onClick={() => navigate(`/clients/companies/${selected[0]}`)}
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

      {editCompany && (
        <EditPanel
          company={editCompany}
          customCols={customCols}
          onSave={saveEdit}
          onClose={() => setEditCompany(null)}
        />
      )}
    </>
  )
}
