import { useState, useEffect, useRef, useMemo } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox } from '../ui/checkbox'
import { GripHorizontal, X, Pencil, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { loadState, saveState } from '../../lib/persist'
import { ColDefEditor } from './ColFields'

// ── Column header (draggable + resizable + sortable) ──────────
function ColHeader({ col, onResize, onRename, onDelete, onEdit, sortCol, sortDir, onSort }) {
  const [renaming, setRenaming] = useState(false)
  const [label, setLabel] = useState(col.label)
  const [showMenu, setShowMenu] = useState(false)
  const startX = useRef(0), startW = useRef(0)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id })
  const isActive = sortCol === col.id

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

  const SortIcon = isActive
    ? (sortDir === 'asc' ? ChevronUp : ChevronDown)
    : ChevronsUpDown

  return (
    <th ref={setNodeRef} style={style}
      className="text-left px-3 py-2.5 text-[11px] font-semibold text-muted-foreground bg-[#f8f8f9] border-b border-r border-border whitespace-nowrap group">

      <div className="flex items-center gap-1 min-w-0">
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
          <button
            onClick={() => onSort(col.id)}
            className="flex items-center gap-1 flex-1 min-w-0 text-left hover:text-foreground transition-colors"
          >
            <span className="truncate">{col.label}</span>
            <SortIcon className={`w-3 h-3 shrink-0 transition-opacity ${isActive ? 'opacity-100 text-foreground' : 'opacity-0 group-hover:opacity-50'}`} />
          </button>
        )}

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

// ── Row ──────────────────────────────────────────────────────
function Row({ cols, rowId, renderCell, selected, onSelect }) {
  return (
    <tr className="group border-b border-border/50 hover:bg-[#f8f9fa] transition-colors">
      <td className="px-3 py-2.5 w-10">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </td>
      {cols.map((col) => (
        <td key={col.id}
          style={{ width: col.width, minWidth: col.width, maxWidth: col.width, overflow: 'hidden' }}
          className="px-3 py-2.5 border-r border-border/20">
          <div className="min-w-0">{renderCell(col.id)}</div>
        </td>
      ))}
    </tr>
  )
}

// ── Main CRMTable ─────────────────────────────────────────────
export default function CRMTable({
  storageKey,
  defaultCols,
  rows,
  renderCell,
  selected,
  onSelect,
  onSelectAll,
  addSectionOpen,
  onAddSectionClose,
  bulkBar,
  onColsChange,
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const [cols, setCols] = useState(() => loadState(storageKey, defaultCols))
  const [editingCol, setEditingCol] = useState(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [sort, setSort] = useState({ col: null, dir: 'asc' })
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  useEffect(() => {
    saveState(storageKey, cols)
    onColsChange?.(cols)
  }, [cols])

  useEffect(() => { if (addSectionOpen) setShowAddSection(true) }, [addSectionOpen])

  useEffect(() => { setPage(1) }, [rows.length])

  const handleColSave = (colDef) => {
    if (editingCol) {
      setCols(p => p.map(c => c.id === editingCol.id ? { ...c, ...colDef } : c))
      setEditingCol(null)
    } else {
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

  const handleResize = (id, w) => setCols(p => p.map(c => c.id === id ? { ...c, width: w } : c))
  const handleRename = (id, label) => setCols(p => p.map(c => c.id === id ? { ...c, label } : c))
  const handleDelete = (id) => setCols(p => p.filter(c => c.id !== id))

  const handleSort = (colId) => {
    setSort(prev => prev.col === colId
      ? { col: colId, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { col: colId, dir: 'asc' }
    )
    setPage(1)
  }

  const sortedRows = useMemo(() => {
    if (!sort.col) return rows
    return [...rows].sort((a, b) => {
      const av = a[sort.col] ?? a.custom?.[sort.col] ?? ''
      const bv = b[sort.col] ?? b.custom?.[sort.col] ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage
  const pageRows = sortedRows.slice(start, start + perPage)
  const allSelected = selected.length === sortedRows.length && sortedRows.length > 0

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {bulkBar}

      <div className="flex-1 overflow-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColDrag}>
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="w-10 px-3 py-2.5 bg-[#f8f8f9] border-b border-r border-border">
                  <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
                </th>
                <SortableContext items={cols.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                  {cols.map(col => (
                    <ColHeader key={col.id} col={col}
                      onResize={handleResize}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onEdit={(c) => setEditingCol(c)}
                      sortCol={sort.col}
                      sortDir={sort.dir}
                      onSort={handleSort}
                    />
                  ))}
                </SortableContext>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(row => (
                <Row key={row.id} rowId={row.id} cols={cols}
                  renderCell={(colId) => renderCell(row.id, colId)}
                  selected={selected.includes(row.id)}
                  onSelect={() => onSelect(row.id)}
                />
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 1} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    No hay registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Pagination footer */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filas por página</span>
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
            className="text-xs border border-border rounded-md px-2 py-1 bg-background outline-none focus:border-foreground"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{sortedRows.length === 0 ? '0' : `${start + 1}–${Math.min(start + perPage, sortedRows.length)}`} de {sortedRows.length}</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 rounded text-foreground font-medium">{safePage}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ColDefEditor
        open={showAddSection || !!editingCol}
        initial={editingCol || null}
        onClose={closeEditor}
        onSave={handleColSave}
      />
    </div>
  )
}

export function loadCols(storageKey, defaultCols) {
  return loadState(`${storageKey}_cols`, defaultCols)
}
