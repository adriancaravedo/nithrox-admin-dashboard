/**
 * CRMTable v2
 * - Typed columns (text, email, phone, date, select, number, url)
 * - Columns: resize, reorder (DnD), rename, delete, edit type
 * - Rows: reorder (DnD), checkbox bulk select
 * - All config persisted to localStorage (per-user)
 */
import { useState, useRef, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox } from '../ui/checkbox'
import { GripVertical, GripHorizontal, X, Pencil } from 'lucide-react'
import { loadState, saveState } from '../../lib/persist'
import { ColDefEditor } from './ColFields'
import { COL_TYPES } from '../../lib/columnTypes'

// ── Column header (draggable + resizable + editable) ──────────
function ColHeader({ col, onResize, onRename, onDelete, onEdit }) {
  const [renaming, setRenaming] = useState(false)
  const [label, setLabel] = useState(col.label)
  const [showMenu, setShowMenu] = useState(false)
  const startX = useRef(0), startW = useRef(0)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id })
  const typeInfo = COL_TYPES.find(t => t.id === col.type)

  const style = {
    width: col.width, minWidth: col.width, maxWidth: col.width,
    transform: CSS.Transform.toString(transform), transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative', userSelect: 'none',
  }

  const onMouseDown = (e) => {
    e.stopPropagation()
    startX.current = e.clientX; startW.current = col.width
    const onMove = (ev) => onResize(col.id, Math.max(80, startW.current + ev.clientX - startX.current))
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const commitRename = () => { onRename(col.id, label); setRenaming(false) }

  return (
    <th ref={setNodeRef} style={style}
      className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground bg-background border-b border-border whitespace-nowrap group">

      <div className="flex items-center gap-1 min-w-0">
        {/* Column drag handle */}
        {!col.fixed && (
          <div {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0 touch-none">
            <GripHorizontal className="w-3 h-3 text-muted-foreground" />
          </div>
        )}

        {renaming ? (
          <input value={label} onChange={e => setLabel(e.target.value)} autoFocus
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setLabel(col.label); setRenaming(false) } }}
            className="flex-1 text-xs outline-none bg-transparent border-b border-primary min-w-0" />
        ) : (
          <span
            onDoubleClick={() => !col.fixed && setRenaming(true)}
            className="flex-1 truncate cursor-default"
            title={col.label}
          >
            {col.label}
          </span>
        )}

        {/* Actions menu for non-fixed columns */}
        {!col.fixed && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5 rounded"
            >
              <Pencil className="w-3 h-3" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-5 z-50 bg-popover border border-border rounded-xl shadow-xl w-40 py-1 overflow-hidden">
                  <button onClick={() => { setRenaming(true); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors">
                    <Pencil className="w-3 h-3" /> Renombrar
                  </button>
                  <button onClick={() => { onEdit(col); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors">
                    ⚙️ Editar tipo
                  </button>
                  <button onClick={() => { onDelete(col.id); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent text-destructive transition-colors">
                    <X className="w-3 h-3" /> Eliminar columna
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div onMouseDown={onMouseDown}
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30 transition-colors" />
    </th>
  )
}

// ── Sortable row ─────────────────────────────────────────────
function SortableRow({ id, cols, renderCell, selected, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <tr ref={setNodeRef} style={style} {...attributes}
      className={`border-b border-border/50 transition-colors ${isDragging ? 'opacity-40 bg-accent' : 'hover:bg-accent/30'}`}>
      <td className="px-3 py-2 w-10 shrink-0">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </td>
      {cols.map((col, i) => (
        <td key={col.id} style={{ width: col.width, minWidth: col.width, maxWidth: col.width, overflow: 'hidden' }} className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            {i === 0 && (
              <div {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground shrink-0 touch-none">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="flex-1 min-w-0">{renderCell(col.id)}</div>
          </div>
        </td>
      ))}
    </tr>
  )
}

// ── Main CRMTable ────────────────────────────────────────────
export default function CRMTable({
  storageKey,
  defaultCols,
  rows,
  onRowReorder,
  renderCell,
  selected,
  onSelect,
  onSelectAll,
  addSectionOpen,
  onAddSectionClose,
  bulkBar,
  onColsChange,   // called when cols change so parent can react
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const [cols, setCols] = useState(() => loadState(`${storageKey}_cols`, defaultCols))
  const [rowOrder, setRowOrder] = useState(() => {
    const saved = loadState(`${storageKey}_rows`, null)
    const ids = rows.map(r => r.id)
    if (saved) {
      const kept = saved.filter(id => ids.includes(id))
      const added = ids.filter(id => !saved.includes(id))
      return [...kept, ...added]
    }
    return ids
  })

  const [editingCol, setEditingCol] = useState(null) // col being edited
  const [showAddSection, setShowAddSection] = useState(false)

  // Sync rowOrder when rows change
  useEffect(() => {
    setRowOrder(prev => {
      const ids = rows.map(r => r.id)
      const kept = prev.filter(id => ids.includes(id))
      const added = ids.filter(id => !prev.includes(id))
      const merged = [...kept, ...added]
      saveState(`${storageKey}_rows`, merged)
      return merged
    })
  }, [rows])

  // Persist cols
  useEffect(() => {
    saveState(`${storageKey}_cols`, cols)
    onColsChange?.(cols)
  }, [cols])

  // Proxy the addSectionOpen to our local state
  useEffect(() => { if (addSectionOpen) setShowAddSection(true) }, [addSectionOpen])

  const handleColSave = (colDef) => {
    if (editingCol) {
      // Editing existing
      setCols(p => p.map(c => c.id === editingCol.id ? { ...c, ...colDef } : c))
      setEditingCol(null)
    } else {
      // Adding new
      const id = `col_${Date.now()}`
      setCols(p => [...p, { id, ...colDef }])
    }
    setShowAddSection(false)
    onAddSectionClose?.()
  }

  const closeEditor = () => {
    setEditingCol(null)
    setShowAddSection(false)
    onAddSectionClose?.()
  }

  const handleColDrag = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const movable = cols.filter(c => !c.fixed)
    const fixed = cols.filter(c => c.fixed)
    const oldIdx = movable.findIndex(c => c.id === active.id)
    const newIdx = movable.findIndex(c => c.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    setCols([...fixed, ...arrayMove(movable, oldIdx, newIdx)])
  }

  const handleRowDrag = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const newOrder = arrayMove(rowOrder, rowOrder.indexOf(active.id), rowOrder.indexOf(over.id))
    setRowOrder(newOrder)
    saveState(`${storageKey}_rows`, newOrder)
    onRowReorder?.(newOrder)
  }

  const handleResize = (id, w) => setCols(p => p.map(c => c.id === id ? { ...c, width: w } : c))
  const handleRename = (id, label) => setCols(p => p.map(c => c.id === id ? { ...c, label } : c))
  const handleDelete = (id) => setCols(p => p.filter(c => c.id !== id))

  const orderedRows = rowOrder.map(id => rows.find(r => r.id === id)).filter(Boolean)
  const allSelected = selected.length === orderedRows.length && orderedRows.length > 0

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {bulkBar}

      <div className="flex-1 overflow-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColDrag}>
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="w-10 px-3 py-2.5 bg-background border-b border-border">
                  <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
                </th>
                <SortableContext items={cols.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                  {cols.map(col => (
                    <ColHeader key={col.id} col={col}
                      onResize={handleResize}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onEdit={(c) => setEditingCol(c)}
                    />
                  ))}
                </SortableContext>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRowDrag}>
              <SortableContext items={rowOrder} strategy={verticalListSortingStrategy}>
                <tbody>
                  {orderedRows.map(row => (
                    <SortableRow key={row.id} id={row.id} cols={cols}
                      renderCell={(colId) => renderCell(row.id, colId)}
                      selected={selected.includes(row.id)}
                      onSelect={() => onSelect(row.id)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </DndContext>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border text-xs text-muted-foreground shrink-0">
        <button className="hover:text-foreground px-1">‹ Prev</button>
        <span className="bg-primary text-primary-foreground px-2.5 py-0.5 rounded text-xs">1</span>
        <button className="hover:text-foreground px-1">Next ›</button>
        <span className="ml-2">{orderedRows.length} registros</span>
      </div>

      {/* Column editor — add new OR edit existing */}
      <ColDefEditor
        open={showAddSection || !!editingCol}
        initial={editingCol || null}
        onClose={closeEditor}
        onSave={handleColSave}
      />
    </div>
  )
}

// Export cols reader so tabs can expose cols to parent
export function loadCols(storageKey, defaultCols) {
  return loadState(`${storageKey}_cols`, defaultCols)
}
