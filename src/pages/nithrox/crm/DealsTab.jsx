import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay, closestCorners, PointerSensor,
  useSensor, useSensors, useDroppable
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../../../stores/useStore'
import { DEAL_STAGES, getInitials } from '../../../lib/utils'
import { loadState, saveState } from '../../../lib/persist'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'

// ── Droppable column (accepts drops to empty columns) ─────────
function DroppableCol({ id, children, className }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? 'ring-2 ring-primary/30 ring-inset' : ''} transition-all rounded-b-lg`}>
      {children}
    </div>
  )
}

// ── Deal card (plain, used in DragOverlay) ────────────────────
function DealCard({ deal, contacts, onEdit, onDelete, onClick }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const contact = contacts.find(c => deal.contacts?.includes(c.id))

  return (
    <div
      onClick={onClick}
      className="bg-white border border-border/60 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all relative select-none"
    >
      <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(m => !m)}
          className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-7 w-36 bg-white border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <button onClick={() => { onEdit(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </>
        )}
      </div>

      <div className="pr-8">
        <p className="text-sm font-semibold leading-tight mb-0.5">{deal.name}</p>
        {contact && <p className="text-sm text-muted-foreground mb-3">{contact.name}</p>}
        <p className="text-2xl font-bold mb-2">${deal.amount?.toLocaleString() || '0'}</p>
        <div className="text-sm text-muted-foreground space-y-0.5">
          {deal.close_date && (
            <p>{new Date(deal.close_date + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          )}
          {deal.owner && <p>{deal.owner}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Sortable deal card ────────────────────────────────────────
function SortableDealCard({ deal, contacts, onEdit, onDelete, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? 'opacity-30' : ''}>
      <DealCard deal={deal} contacts={contacts} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />
    </div>
  )
}

// ── Main DealsTab ─────────────────────────────────────────────
export default function DealsTab({ showAddSection, onCloseAddSection }) {
  const { deals, companies, contacts, moveDeal, updateDeal, deleteDeal } = useStore()
  const navigate = useNavigate()

  // Persist stages (columns)
  const [stages, setStages] = useState(() => loadState('crm_deal_stages', DEAL_STAGES))
  useEffect(() => { saveState('crm_deal_stages', stages) }, [stages])

  const [activeId, setActiveId] = useState(null)
  const [editDeal, setEditDeal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [newStageLabel, setNewStageLabel] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const getDeals = (stageId) => deals.filter(d => d.stage === stageId)
  const getTotal = (stageId) => getDeals(stageId).reduce((s, d) => s + (d.amount || 0), 0)

  const handleDragStart = ({ active }) => setActiveId(active.id)
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    // Check if dropped on a column droppable
    const targetStage = stages.find(s => s.id === over.id)
    if (targetStage) { moveDeal(active.id, targetStage.id); return }
    // Dropped on another deal card
    const targetDeal = deals.find(d => d.id === over.id)
    if (targetDeal) moveDeal(active.id, targetDeal.stage)
  }

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  const openEdit = (deal) => { setEditDeal(deal); setEditForm({ ...deal, amount: deal.amount?.toString() || '' }) }
  const saveEdit = () => { updateDeal(editDeal.id, { ...editForm, amount: parseFloat(editForm.amount) || 0 }); setEditDeal(null) }

  const startRename = (stage) => { setRenamingId(stage.id); setRenameVal(stage.label) }
  const commitRename = () => {
    if (renameVal.trim()) setStages(p => p.map(s => s.id === renamingId ? { ...s, label: renameVal.trim() } : s))
    setRenamingId(null)
  }

  const addStage = () => {
    if (!newStageLabel.trim()) return
    const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#22c55e','#ef4444','#0ea5e9','#f97316']
    const color = colors[stages.length % colors.length]
    setStages(p => [...p, { id: `stage_${Date.now()}`, label: newStageLabel.trim(), color, pct: 50 }])
    setNewStageLabel('')
    onCloseAddSection()
  }

  const deleteStage = (id) => setStages(p => p.filter(s => s.id !== id))

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex h-full p-4 gap-4 min-w-max items-start">
            {stages.map(stage => {
              const stageDeals = getDeals(stage.id)
              const total = getTotal(stage.id)

              return (
                <div key={stage.id} className="flex flex-col w-[240px] shrink-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 group">
                    {renamingId === stage.id ? (
                      <input
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
                        className="flex-1 text-sm font-semibold border-b border-primary outline-none bg-transparent"
                        autoFocus
                      />
                    ) : (
                      <button
                        onDoubleClick={() => startRename(stage)}
                        className="flex items-center gap-2 text-left"
                        title="Doble click para renombrar"
                      >
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                          style={{ backgroundColor: stage.color }}
                        >
                          {stage.label}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{stageDeals.length}</span>
                      </button>
                    )}
                    {/* Delete stage (only non-default) */}
                    {!DEAL_STAGES.find(d => d.id === stage.id) && (
                      <button onClick={() => deleteStage(stage.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-auto text-xs">✕</button>
                    )}
                  </div>

                  {/* Cards area with droppable */}
                  <div className="bg-muted/40 rounded-xl border border-border/50 flex flex-col flex-1">
                    <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                      <DroppableCol id={stage.id} className="flex-1 p-2.5 space-y-2.5 min-h-[300px]">
                        {stageDeals.map(deal => (
                          <SortableDealCard
                            key={deal.id}
                            deal={deal}
                            contacts={contacts}
                            onClick={() => navigate(`/clients/deals/${deal.id}`)}
                            onEdit={() => openEdit(deal)}
                            onDelete={() => deleteDeal(deal.id)}
                          />
                        ))}
                      </DroppableCol>
                    </SortableContext>

                    {/* Column footer */}
                    <div className="px-3 py-2.5 border-t border-border/50 rounded-b-xl bg-background/60">
                      <span className="text-xs font-semibold">${total.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground"> | Total amount</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDeal && (
              <div className="w-[240px] rotate-2 shadow-2xl opacity-90">
                <DealCard deal={activeDeal} contacts={contacts} onEdit={() => {}} onDelete={() => {}} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add stage dialog */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onCloseAddSection}>
          <div className="bg-background border border-border rounded-xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">Nueva etapa / columna</h3>
            <input
              value={newStageLabel}
              onChange={e => setNewStageLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addStage(); if (e.key === 'Escape') onCloseAddSection() }}
              placeholder="Ej: Demo agendada, En revisión..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={onCloseAddSection} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">Cancelar</button>
              <button onClick={addStage} disabled={!newStageLabel.trim()} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit deal dialog */}
      <Dialog open={!!editDeal} onOpenChange={() => setEditDeal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar deal</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Nombre *</Label>
              <Input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monto</Label>
              <Input type="number" value={editForm.amount || ''} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Moneda</Label>
              <Select value={editForm.currency || 'USD'} onValueChange={v => setEditForm(p => ({ ...p, currency: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="PEN">PEN</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Etapa</Label>
              <Select value={editForm.stage || 'new'} onValueChange={v => setEditForm(p => ({ ...p, stage: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de cierre</Label>
              <Input type="date" value={editForm.close_date || ''} onChange={e => setEditForm(p => ({ ...p, close_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prioridad</Label>
              <Select value={editForm.priority || 'Medium'} onValueChange={v => setEditForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">Alta</SelectItem>
                  <SelectItem value="Medium">Media</SelectItem>
                  <SelectItem value="Low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditDeal(null)}>Cancelar</Button>
            <Button size="sm" onClick={saveEdit} disabled={!editForm.name}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
