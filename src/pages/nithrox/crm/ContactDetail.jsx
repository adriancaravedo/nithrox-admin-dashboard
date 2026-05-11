import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { formatRelative, formatDate, getInitials, CONTACT_FIELD_DEFS } from '../../../lib/utils'
import { loadState } from '../../../lib/persist'
import { COL_DEFS_KEY_CONTACTS } from '../../../lib/columnTypes'
import { CONTACTS_DEFAULT_COLS } from './ContactsTab'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Checkbox } from '../../../components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { InlineField, TypedInput, PhoneInput } from '../../../components/shared/ColFields'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Mail, Phone, ListTodo, Calendar, Plus, Trash2, Pin,
  GripVertical, Check, X, ExternalLink, FileText, Building2,
  MessageSquare, FolderKanban
} from 'lucide-react'

// ── Task item ────────────────────────────────────────────────
function TaskItem({ task, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:border-foreground/20 bg-background transition-all group ${isDragging ? 'opacity-40 shadow-lg' : ''}`}>
      <div {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground shrink-0 touch-none">
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <Checkbox checked={task.done} onCheckedChange={() => onToggle(task.id)} />
      <span className={`flex-1 text-sm ${task.done ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
      {task.due && <span className="text-[10px] text-muted-foreground">{task.due}</span>}
      <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Note item ────────────────────────────────────────────────
function NoteItem({ note, onPin, onDelete }) {
  return (
    <div className={`p-3 rounded-lg border transition-all group ${note.pinned ? 'border-foreground/20 bg-accent/30' : 'border-border bg-background'}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {note.pinned && <Pin className="w-3 h-3 text-foreground fill-foreground" />}
          <span className="text-[10px] text-muted-foreground">{formatRelative(note.at)}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onPin(note.id)} className="text-muted-foreground hover:text-foreground p-0.5">
            <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-foreground' : ''}`} />
          </button>
          <button onClick={() => onDelete(note.id)} className="text-muted-foreground hover:text-destructive p-0.5">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm">{note.content}</p>
    </div>
  )
}

const CONTRACT_STATUS = {
  signed:  { label: 'Firmado',   color: 'bg-green-100 text-green-700' },
  sent:    { label: 'Enviado',   color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  draft:   { label: 'Borrador',  color: 'bg-gray-100 text-gray-600' },
}

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contacts, companies, deals, contracts: storeContracts, projects, messages: conversations, updateContact, addCompany, addDeal } = useStore()

  const contact = contacts.find(c => c.id === id)
  if (!contact) return (
    <div className="flex flex-col h-full">
      <Topbar title="Contacto no encontrado" />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Contacto no encontrado</div>
    </div>
  )

  const company = companies.find(c => c.id === contact.company_id)
  const contactDeals = deals.filter(d => d.contact_ids?.includes(id) || d.company_id === contact.company_id)
  const contactContracts = (storeContracts || []).filter(c => c.contact_id === id)
  const contactProjects = (projects || []).filter(p => p.contact_id === id || p.company_id === contact.company_id)
  const contactConversation = (conversations || []).find(m => m.contact_id === id)

  // Load active columns from CRM table config (same source as the table view)
  const activeCols = loadState(COL_DEFS_KEY_CONTACTS, CONTACTS_DEFAULT_COLS)

  // All standard contact fields always shown in the detail (same as the form)
  const detailFields = CONTACT_FIELD_DEFS

  // Custom columns (col_xxx) — added by user in the CRM table config, synced here
  const customCols = activeCols.filter(c => c.id?.startsWith('col_'))

  // Tasks
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  // Notes
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // Add company/deal dialogs
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [addCompanyForm, setAddCompanyForm] = useState({ existing_id: '', new_name: '' })
  const [addDealForm, setAddDealForm] = useState({ existing_id: '', name: '', amount: '', currency: 'USD', stage: 'new' })

  // Meeting
  const [showMeeting, setShowMeeting] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '' })

  const [activeTab, setActiveTab] = useState('activities')

  // Tasks DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const handleTaskDrag = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setTasks(prev => arrayMove(prev, prev.findIndex(t => t.id === active.id), prev.findIndex(t => t.id === over.id)))
  }

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(p => [...p, { id: `t${Date.now()}`, title: newTask.trim(), done: false, due: '' }])
    setNewTask(''); setAddingTask(false)
  }

  const addNote = () => {
    if (!newNote.trim()) return
    setNotes(p => [{ id: `n${Date.now()}`, content: newNote.trim(), at: new Date().toISOString(), pinned: false }, ...p])
    setNewNote(''); setAddingNote(false)
  }

  const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))


  const handleAddCompanySubmit = async () => {
    if (addCompanyForm.existing_id) {
      await updateContact(id, { company_id: addCompanyForm.existing_id })
    } else if (addCompanyForm.new_name.trim()) {
      const newCo = { name: addCompanyForm.new_name.trim() }
      await addCompany(newCo)
    }
    setShowAddCompany(false)
    setAddCompanyForm({ existing_id: '', new_name: '' })
  }

  const handleAddDealSubmit = async () => {
    if (addDealForm.name.trim()) {
      await addDeal({
        name: addDealForm.name,
        amount: parseFloat(addDealForm.amount) || 0,
        currency: addDealForm.currency,
        stage: addDealForm.stage,
        owner: 'Adrian Caravedo',
        contact_ids: [id],
        company_id: contact.company_id || null,
      })
    }
    setShowAddDeal(false)
    setAddDealForm({ existing_id: '', name: '', amount: '', currency: 'USD', stage: 'new' })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={`Clientes | ${contact.name}`}
        actions={<Button size="sm" variant="outline" onClick={() => navigate(-1)} className="text-xs">← Volver</Button>}
      />

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

        {/* LEFT — contact info */}
        <div className="w-full md:w-[240px] border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0">
          <div className="p-5">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3" style={{ backgroundColor: contact.avatar_color }}>
                {getInitials(contact.name)}
              </div>
              <h2 className="font-semibold text-sm leading-tight">{contact.name}</h2>
              {contact.role && company && <p className="text-xs text-muted-foreground mt-0.5">{contact.role} at {company.name}</p>}
              {contact.email && <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline mt-0.5">{contact.email}</a>}
            </div>

            {/* Quick actions */}
            <div className="flex justify-center gap-1 mb-5">
              {contact.email && (
                <a href={`mailto:${contact.email}`} title="Enviar email"
                  className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors">
                  <Mail className="w-4 h-4" /><span>Email</span>
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} title="Llamar"
                  className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors">
                  <Phone className="w-4 h-4" /><span>Llamar</span>
                </a>
              )}
              <button onClick={() => { setAddingTask(true); setActiveTab('activities') }}
                className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors">
                <ListTodo className="w-4 h-4" /><span>Task</span>
              </button>
              <button onClick={() => setShowMeeting(true)}
                className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors">
                <Calendar className="w-4 h-4" /><span>Reunión</span>
              </button>
              <button onClick={() => navigate(`/messages?contactId=${id}`)}
                className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>{contactConversation ? 'Chat' : 'Nuevo chat'}</span>
              </button>
            </div>

            {/* Key information — driven by shared field defs + custom cols */}
            <div>
              <h3 className="text-xs font-semibold mb-3">Key information</h3>
              <div className="space-y-3">
                {detailFields.map(field => (
                  <div key={field.id}>
                    <p className="text-[10px] text-muted-foreground mb-0.5">{field.label}</p>
                    <InlineField
                      col={field}
                      value={contact[field.id] || ''}
                      onSave={v => updateContact(id, { [field.id]: v })}
                    />
                  </div>
                ))}

                {/* Custom columns — synced from CRM table config */}
                {customCols.map(col => (
                  <div key={col.id}>
                    <p className="text-[10px] text-muted-foreground mb-0.5">{col.label}</p>
                    <InlineField
                      col={col}
                      value={contact.custom?.[col.id] || ''}
                      onSave={v => updateContact(id, { custom: { ...contact.custom, [col.id]: v } })}
                    />
                  </div>
                ))}

                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Fecha de creación</p>
                  <p className="text-sm text-muted-foreground">{formatRelative(contact.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — Activities / Notas */}
        <div className="flex-1 overflow-hidden flex flex-col border-r border-border">
          <div className="flex border-b border-border shrink-0">
            {['activities', 'notas'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                {tab === 'activities' ? 'Activities' : 'Notas'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {activeTab === 'activities' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Tareas</h3>
                    <button onClick={() => setAddingTask(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Nueva tarea
                    </button>
                  </div>
                  {addingTask && (
                    <div className="flex gap-2 mb-3">
                      <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Descripción..."
                        className="flex-1 h-8 text-sm" autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAddingTask(false) }} />
                      <button onClick={addTask} className="text-green-600 px-1"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setAddingTask(false)} className="text-muted-foreground px-1"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDrag}>
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {tasks.map(task => (
                          <TaskItem key={task.id} task={task}
                            onToggle={(tid) => setTasks(p => p.map(t => t.id === tid ? { ...t, done: !t.done } : t))}
                            onDelete={(tid) => setTasks(p => p.filter(t => t.id !== tid))} />
                        ))}
                        {tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sin tareas. ¡Agrega la primera!</p>}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Reuniones y actividad</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background hover:border-border transition-colors">
                      <span className="text-base shrink-0">📋</span>
                      <div><p className="text-sm">Contacto creado</p><p className="text-xs text-muted-foreground mt-0.5">{formatDate(contact.created_at)}</p></div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notas' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Notas</h3>
                  <button onClick={() => setAddingNote(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Nueva nota
                  </button>
                </div>
                {addingNote && (
                  <div className="mb-3 space-y-2">
                    <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Escribe una nota..." rows={3} className="text-sm" autoFocus />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setAddingNote(false)} className="h-7 text-xs">Cancelar</Button>
                      <Button size="sm" onClick={addNote} className="h-7 text-xs" disabled={!newNote.trim()}>Guardar</Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {sortedNotes.map(note => (
                    <NoteItem key={note.id} note={note}
                      onPin={(nid) => setNotes(p => p.map(n => n.id === nid ? { ...n, pinned: !n.pinned } : n))}
                      onDelete={(nid) => setNotes(p => p.filter(n => n.id !== nid))} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — related records */}
        <div className="w-full md:w-[240px] overflow-y-auto shrink-0">
          <div className="p-4 space-y-5">

            {/* Companies */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold">Companies ({company ? 1 : 0})</h3>
                <button onClick={() => setShowAddCompany(true)} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {company ? (
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: company.avatar_color }}>
                      {getInitials(company.name)}
                    </div>
                    <span className="text-sm font-medium">{company.name}</span>
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded ml-auto">Primary</span>
                  </div>
                  {company.domain && <p className="text-xs text-muted-foreground">{company.domain}</p>}
                  {company.phone && <p className="text-xs text-muted-foreground">{company.phone}</p>}
                  <button onClick={() => navigate(`/clients/companies/${company.id}`)}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    Ver empresa <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setShowAddCompany(true)}>
                  <Building2 className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Sin empresa asociada</p>
                </div>
              )}
            </div>

            {/* Deals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold">Deals ({contactDeals.length})</h3>
                <button onClick={() => setShowAddDeal(true)} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {contactDeals.length > 0 ? (
                <div className="space-y-2">
                  {contactDeals.map(deal => (
                    <div key={deal.id} className="border border-border rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">{deal.name}</p>
                      <p className="text-xs text-muted-foreground">Amount: ${deal.amount?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Cierre: {deal.close_date}</p>
                      <button onClick={() => navigate(`/clients/deals/${deal.id}`)}
                        className="text-xs text-primary hover:underline mt-1.5 flex items-center gap-1">
                        Ver Deal <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setShowAddDeal(true)}>
                  <p className="text-xs text-muted-foreground">Sin deals. Click para agregar.</p>
                </div>
              )}
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold">Proyectos ({contactProjects.length})</h3>
                <button onClick={() => navigate('/projects')} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {contactProjects.length > 0 ? (
                <div className="space-y-2">
                  {contactProjects.map(p => (
                    <div key={p.id} className="border border-border rounded-lg p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={() => navigate(`/projects/${p.id}`)}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-xs font-medium leading-tight flex-1">{p.name}</p>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 shrink-0 capitalize">{p.phase}</span>
                      </div>
                      <button className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-1">
                        <FolderKanban className="w-3 h-3" /> Ver proyecto
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate('/projects')}>
                  <p className="text-xs text-muted-foreground">Sin proyectos. Click para crear.</p>
                </div>
              )}
            </div>

            {/* Contracts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold">Contratos ({contactContracts.length})</h3>
                <button onClick={() => navigate('/contracts')} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {contactContracts.map(ct => {
                  const st = CONTRACT_STATUS[ct.status]
                  return (
                    <div key={ct.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-xs font-medium leading-tight flex-1">{ct.name}</p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${st?.color}`}>{st?.label}</span>
                      </div>
                      <button onClick={() => navigate('/contracts')} className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-1">
                        <FileText className="w-3 h-3" /> Ver contrato
                      </button>
                    </div>
                  )
                })}
                {contactContracts.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate('/contracts')}>
                    <p className="text-xs text-muted-foreground">Sin contratos. Click para crear.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting dialog */}
      <Dialog open={showMeeting} onOpenChange={setShowMeeting}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Agendar reunión con {contact.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label className="text-xs">Título</Label>
              <Input value={meetingForm.title} onChange={e => setMeetingForm(p => ({ ...p, title: e.target.value }))} placeholder="Kick off..." className="h-8 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Fecha</Label>
                <Input type="date" value={meetingForm.date} onChange={e => setMeetingForm(p => ({ ...p, date: e.target.value }))} className="h-8 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Hora</Label>
                <Input type="time" value={meetingForm.time} onChange={e => setMeetingForm(p => ({ ...p, time: e.target.value }))} className="h-8 text-sm" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowMeeting(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => { setShowMeeting(false) }} disabled={!meetingForm.title || !meetingForm.date}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add company dialog */}
      <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Asociar empresa</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa existente</Label>
              <select value={addCompanyForm.existing_id} onChange={e => setAddCompanyForm(p => ({ ...p, existing_id: e.target.value, new_name: '' }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background">
                <option value="">Seleccionar empresa...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">o</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Crear nueva empresa</Label>
              <Input value={addCompanyForm.new_name} onChange={e => setAddCompanyForm(p => ({ ...p, new_name: e.target.value, existing_id: '' }))}
                placeholder="Nombre de la empresa..." className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddCompany(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAddCompanySubmit} disabled={!addCompanyForm.existing_id && !addCompanyForm.new_name.trim()}>
              Asociar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add deal dialog */}
      <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Agregar deal</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre del deal *</Label>
              <Input value={addDealForm.name} onChange={e => setAddDealForm(p => ({ ...p, name: e.target.value }))} placeholder="Tienda Online..." className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Monto</Label>
                <Input type="number" value={addDealForm.amount} onChange={e => setAddDealForm(p => ({ ...p, amount: e.target.value }))} className="h-8 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Moneda</Label>
                <select value={addDealForm.currency} onChange={e => setAddDealForm(p => ({ ...p, currency: e.target.value }))}
                  className="w-full border border-border rounded-lg px-2 h-8 text-sm bg-background">
                  <option value="USD">USD</option><option value="PEN">PEN</option>
                </select>
              </div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs">Etapa</Label>
                <select value={addDealForm.stage} onChange={e => setAddDealForm(p => ({ ...p, stage: e.target.value }))}
                  className="w-full border border-border rounded-lg px-2 h-8 text-sm bg-background">
                  <option value="new">Nuevo</option>
                  <option value="qualified">Calificado</option>
                  <option value="proposal">Propuesta</option>
                  <option value="won">Ganado</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddDeal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAddDealSubmit} disabled={!addDealForm.name.trim()}>Crear deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
