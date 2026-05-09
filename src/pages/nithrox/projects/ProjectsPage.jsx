import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay, pointerWithin, PointerSensor,
  useSensor, useSensors, useDroppable
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../../../stores/useStore'
import { PROJECT_PHASES, formatCurrency } from '../../../lib/utils'
import Topbar from '../../../components/layout/Topbar'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { AddProjectDialog } from './AddProjectDialog'
import { toast } from 'sonner'

const PHASE_COLORS = {
  kickoff:     { pill: '#3b82f6', light: '#eff6ff', text: '#1d4ed8' },
  design:      { pill: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9' },
  development: { pill: '#f59e0b', light: '#fffbeb', text: '#d97706' },
  publication: { pill: '#10b981', light: '#ecfdf5', text: '#059669' },
}

const STATUS_BADGES = {
  approved: { label: 'APROBADO',       bg: '#10b981', text: '#fff' },
  pending:  { label: 'PAGO PENDIENTE', bg: '#f59e0b', text: '#fff' },
  waiting:  { label: 'EN REVISIÓN',    bg: '#3b82f6', text: '#fff' },
  locked:   { label: 'BLOQUEADO',      bg: '#94a3b8', text: '#fff' },
}

function getProjectStatus(project) {
  const pd = project.phases?.[project.phase]
  if (!pd) return 'locked'
  if (pd.approved_admin && pd.approved_client) return 'approved'
  if (!pd.paid) return 'pending'
  return 'waiting'
}

// ── Droppable column — works even when empty ────────────────
function DroppableColumn({ phaseId, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: phaseId })
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-3 space-y-2.5 min-h-[400px] rounded-b-xl transition-all duration-150 ${
        isOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : ''
      }`}
    >
      {children}
    </div>
  )
}

// ── Project card ────────────────────────────────────────────
function ProjectCard({ project, onClick, onDelete, isDragging }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const phaseDone = Object.values(project.phases || {}).filter(p => p.status === 'approved').length
  const pct = Math.round((phaseDone / 4) * 100)
  const status = getProjectStatus(project)
  const badge = STATUS_BADGES[status]
  const phaseColor = PHASE_COLORS[project.phase] || PHASE_COLORS.kickoff

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-zinc-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-zinc-300 transition-all relative select-none ${
        isDragging ? 'opacity-30 rotate-1 shadow-2xl' : ''
      }`}
    >
      {/* 3-dot menu */}
      <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
        <button onClick={() => setMenuOpen(m => !m)} className="text-zinc-400 hover:text-zinc-700 p-1 rounded hover:bg-zinc-100 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-7 w-40 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <button onClick={() => { navigate(`/projects/${project.id}`); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-zinc-50 transition-colors">
                <Pencil className="w-3.5 h-3.5 text-zinc-400" /> Abrir proyecto
              </button>
              <button onClick={() => { onDelete(); setMenuOpen(false); toast.success('Proyecto eliminado') }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </>
        )}
      </div>

      <div className="pr-8">
        <p className="text-sm font-bold tracking-tight leading-tight mb-0.5 text-zinc-900">{project.name}</p>
        <p className="text-xs text-zinc-400 mb-3">{project.company}</p>

        {/* Progress */}
        <div className="mb-3">
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: phaseColor.pill }} />
          </div>
        </div>

        <p className="text-xl font-bold tracking-tight mb-3 text-zinc-900">
          ${(project.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>

        <span className="inline-block text-[10px] font-bold px-3 py-1 rounded-full tracking-wider"
          style={{ backgroundColor: badge.bg, color: badge.text }}>
          {badge.label}
        </span>
      </div>
    </div>
  )
}

// ── Sortable wrapper ────────────────────────────────────────
function SortableCard({ project, onClick, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard project={project} onClick={onClick} onDelete={onDelete} isDragging={isDragging} />
    </div>
  )
}

const PHASE_LABELS = {
  kickoff:     { num: 'FASE 1', name: 'KICK-OFF' },
  design:      { num: 'FASE 2', name: 'DISEÑO' },
  development: { num: 'FASE 3', name: 'DESARROLLO' },
  publication: { num: 'FASE 4', name: 'PUBLICACIÓN' },
}

export default function ProjectsPage() {
  const { projects, moveProject, updateProject } = useStore()
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const active = projects.filter(p => !p._deleted)
  const getPhase = (id) => active.filter(p => p.phase === id)
  const getTotal = (id) => getPhase(id).reduce((s, p) => s + (p.value || 0), 0)

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return

    // over.id is always a phase id because DroppableColumn has id=phaseId
    // and SortableContext items are inside it
    const overPhase = PROJECT_PHASES.find(ph => ph.id === over.id)
    if (overPhase) {
      moveProject(active.id, overPhase.id)
      return
    }
    // Dropped on another card — move to that card's phase
    const overProject = active_projects_ref.find(p => p.id === over.id)
    if (overProject) moveProject(active.id, overProject.phase)
  }

  // Keep ref for drag end lookup
  const active_projects_ref = active

  const activeProject = activeId ? active.find(p => p.id === activeId) : null

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50">
      <Topbar
        title="PROYECTOS"
        actions={
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-zinc-900 text-white rounded-full hover:bg-zinc-700 uppercase tracking-wider transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nuevo
          </button>
        }
      />

      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full min-w-max">
            {PROJECT_PHASES.map((phase) => {
              const phaseProjects = getPhase(phase.id)
              const total = getTotal(phase.id)
              const labels = PHASE_LABELS[phase.id]
              const colors = PHASE_COLORS[phase.id]

              return (
                <div key={phase.id} className="flex flex-col w-[280px] shrink-0 border-r border-zinc-200">
                  {/* Column header */}
                  <div className="px-4 pt-5 pb-4 border-b border-zinc-200 bg-white">
                    <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: colors.text }}>{labels.num}</p>
                    <p className="text-xl font-bold tracking-tight text-zinc-900">{labels.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.light, color: colors.text }}>
                        {phaseProjects.length} proyecto{phaseProjects.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <SortableContext items={phaseProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <DroppableColumn phaseId={phase.id}>
                      {phaseProjects.map(project => (
                        <SortableCard
                          key={project.id}
                          project={project}
                          onClick={() => navigate(`/projects/${project.id}`)}
                          onDelete={() => updateProject(project.id, { _deleted: true })}
                        />
                      ))}
                      {phaseProjects.length === 0 && (
                        <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-zinc-200">
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Arrastra aquí</p>
                        </div>
                      )}
                    </DroppableColumn>
                  </SortableContext>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-zinc-200 bg-white">
                    <p className="text-base font-bold tracking-tight text-zinc-900">
                      ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">MONTO TOTAL</p>
                  </div>
                </div>
              )
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeProject && (
              <div className="w-[280px] rotate-2 shadow-2xl opacity-95">
                <ProjectCard project={activeProject} onClick={() => {}} onDelete={() => {}} isDragging={false} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <AddProjectDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
