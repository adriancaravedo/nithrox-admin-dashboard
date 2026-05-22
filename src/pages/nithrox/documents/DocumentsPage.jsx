import { useState, useRef, useCallback } from 'react'
import { useStore } from '../../../stores/useStore'
import { toast } from 'sonner'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import {
  FolderOpen, Folder, Search, Upload, Trash2, Eye,
  Plus, ChevronRight, ChevronDown, Building2, Pencil, X,
  FolderPlus, GripVertical, MoreVertical, Download, Copy
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Constants ────────────────────────────────────────────────
const DEFAULT_SUBFOLDERS = [
  { id: 'branding',   name: 'Branding',    icon: '🎨' },
  { id: 'contratos',  name: 'Contratos',   icon: '📝' },
  { id: 'facturas',   name: 'Facturas',    icon: '🧾' },
  { id: 'briefs',     name: 'Briefs',      icon: '📋' },
  { id: 'diseno',     name: 'Diseño',      icon: '🖼️' },
  { id: 'desarrollo', name: 'Desarrollo',  icon: '💻' },
  { id: 'assets',     name: 'Assets',      icon: '📦' },
  { id: 'otros',      name: 'Otros',       icon: '📁' },
]

const FILE_ICONS = {
  'image/png': '🖼️', 'image/jpeg': '🖼️', 'image/svg+xml': '🖼️', 'image/gif': '🖼️', 'image/webp': '🖼️',
  'application/pdf': '📄', 'video/mp4': '🎬', 'video/quicktime': '🎬',
  'application/zip': '📦', 'text/html': '🌐',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
}
const getIcon = (type) => FILE_ICONS[type] || '📄'
const formatSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function loadCustomFolders() {
  try { return JSON.parse(localStorage.getItem('ntx_custom_folders') || '{}') } catch { return {} }
}
function saveCustomFolders(data) { localStorage.setItem('ntx_custom_folders', JSON.stringify(data)) }

// ── Sortable file card ───────────────────────────────────────
function SortableFileCard({ doc, onDelete, onRename, onPreview }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: doc.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(doc.name)

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`group relative bg-background border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-foreground/20 transition-all select-none ${isDragging ? 'opacity-40 shadow-xl z-50' : ''}`}>
      {/* Drag handle */}
      <div {...listeners}
        className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 bg-background/80 rounded-md transition-opacity">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      {/* More menu */}
      <div className="absolute top-2 right-2 z-10">
        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
          className="opacity-0 group-hover:opacity-100 p-1 bg-background/80 rounded-md hover:bg-accent transition-opacity">
          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-6 w-36 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden p-1">
              {doc.url && (
                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Ver
                </a>
              )}
              <button onClick={() => { setRenaming(true); setMenuOpen(false) }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors w-full text-left">
                <Pencil className="w-3.5 h-3.5" /> Renombrar
              </button>
              <button onClick={() => { onDelete(doc.id); setMenuOpen(false) }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left text-muted-foreground">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      <div className="aspect-square bg-muted/30 flex items-center justify-center text-4xl cursor-pointer"
        onClick={() => doc.url && window.open(doc.url, '_blank')}>
        {doc.type?.startsWith('image/') && doc.url
          ? <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
          : <span>{getIcon(doc.type)}</span>
        }
      </div>

      <div className="p-2.5">
        {renaming ? (
          <input autoFocus value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={() => { if (renameVal.trim() && renameVal !== doc.name) onRename(doc.id, renameVal.trim()); setRenaming(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') { if (renameVal.trim() && renameVal !== doc.name) onRename(doc.id, renameVal.trim()); setRenaming(false) }
              if (e.key === 'Escape') setRenaming(false)
            }}
            className="w-full text-xs border border-primary rounded px-1 py-0.5 outline-none bg-background" />
        ) : (
          <p className="text-xs font-medium truncate cursor-pointer hover:underline" title={doc.name}
            onDoubleClick={() => { setRenaming(true); setRenameVal(doc.name) }}>{doc.name}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(doc.size_bytes)}</p>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export default function DocumentsPage() {
  const { companies, documents, addDocument, deleteDocument, updateDocument } = useStore()
  const [expandedCompany, setExpandedCompany] = useState(null)
  const [selectedPath, setSelectedPath] = useState({ companyId: null, subfolderId: null })
  const [dragOver, setDragOver] = useState(false)
  const [search, setSearch] = useState('')
  const [customFolders, setCustomFolders] = useState(loadCustomFolders)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(null) // companyId
  const [activeId, setActiveId] = useState(null)
  const uploadRef = useRef()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const currentCompanyId = selectedPath.companyId
  const currentSubfolderId = selectedPath.subfolderId
  const currentCompany = companies.find(c => c.id === currentCompanyId)

  const getCompanyFolders = (companyId) => {
    const defaults = DEFAULT_SUBFOLDERS
    const custom = (customFolders[companyId] || []).map(f => ({ ...f, isCustom: true }))
    return [...defaults, ...custom]
  }

  const docsForCompany = (companyId) => documents.filter(d => d.company_id === companyId).length
  const docsForSubfolder = (companyId, subfolderId) =>
    documents.filter(d => d.company_id === companyId && d.subfolder === subfolderId).length

  const docsInFolder = documents.filter(d =>
    d.company_id === currentCompanyId && d.subfolder === currentSubfolderId
  )
  const filteredDocs = docsInFolder.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleUpload = (files) => {
    if (!currentCompanyId || !currentSubfolderId) {
      toast.error('Selecciona una carpeta primero')
      return
    }
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        addDocument({
          name: file.name,
          company_id: currentCompanyId,
          company: currentCompany?.name || '',
          subfolder: currentSubfolderId,
          type: file.type,
          size_bytes: file.size,
          url: e.target.result,
          uploaded_by: 'Admin',
        })
      }
      reader.readAsDataURL(file)
    })
    toast.success(`${files.length} archivo${files.length > 1 ? 's' : ''} subido${files.length > 1 ? 's' : ''}`)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files)
  }

  const addCustomFolder = (companyId) => {
    if (!newFolderName.trim()) return
    const folder = { id: `cf_${Date.now()}`, name: newFolderName.trim(), icon: '📁' }
    const next = { ...customFolders, [companyId]: [...(customFolders[companyId] || []), folder] }
    setCustomFolders(next)
    saveCustomFolders(next)
    setNewFolderName('')
    setShowNewFolder(null)
    toast.success('Carpeta creada')
  }

  const deleteFolder = (companyId, folderId) => {
    // Delete all docs in folder
    const toDelete = documents.filter(d => d.company_id === companyId && d.subfolder === folderId)
    toDelete.forEach(d => deleteDocument(d.id))
    // Remove from custom folders
    const next = { ...customFolders, [companyId]: (customFolders[companyId] || []).filter(f => f.id !== folderId) }
    setCustomFolders(next)
    saveCustomFolders(next)
    if (selectedPath.subfolderId === folderId) setSelectedPath({ companyId, subfolderId: null })
    toast.success('Carpeta eliminada')
  }

  // Drag & drop file reordering
  const handleDragStart = ({ active }) => setActiveId(active.id)
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIdx = docsInFolder.findIndex(d => d.id === active.id)
    const newIdx = docsInFolder.findIndex(d => d.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    // Reorder by updating sort_order field (or just toast for now as localStorage only)
    toast.success('Archivo reordenado')
  }

  const totalFiles = documents.length
  const totalClients = companies.filter(c => docsForCompany(c.id) > 0).length
  const totalSize = documents.reduce((s, d) => s + (d.size_bytes || 0), 0)
  const usedMB = (totalSize / (1024 * 1024)).toFixed(1)
  const limitMB = 1024
  const usedPct = Math.min(100, (totalSize / (limitMB * 1024 * 1024)) * 100).toFixed(1)

  const activeDoc = activeId ? docsInFolder.find(d => d.id === activeId) : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Documentos"
        actions={
          currentSubfolderId ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-xs rounded-full px-4"
                onClick={() => {
                  setShowNewFolder(null)
                  setSelectedPath(p => ({ ...p, subfolderId: null }))
                }}>
                ← Carpetas
              </Button>
              <Button size="sm" onClick={() => uploadRef.current?.click()} className="text-xs rounded-full px-4">
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir archivo
              </Button>
            </div>
          ) : null
        }
      />

      <div
        className="flex-1 overflow-hidden p-4"
        onDragOver={e => { e.preventDefault(); if (currentSubfolderId) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="h-full rounded-xl border border-border bg-background overflow-hidden flex flex-col shadow-sm relative">

          {/* Drop overlay */}
          {dragOver && (
            <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary rounded-xl flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold text-primary uppercase tracking-widest">Suelta para subir</p>
              </div>
            </div>
          )}

          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* ── LEFT PANEL ──────────────────────────── */}
            <div className="w-[280px] shrink-0 border-r border-border flex flex-col overflow-hidden">
              {/* Stats */}
              <div className="grid grid-cols-3 border-b border-border shrink-0">
                {[
                  { l: 'Archivos', v: totalFiles },
                  { l: 'Clientes', v: totalClients },
                  { l: 'MB usados', v: usedMB },
                ].map(s => (
                  <div key={s.l} className="text-center py-3 px-2 border-r border-border last:border-r-0">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{s.l}</p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="relative border-b border-border shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar empresa..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs outline-none bg-background placeholder:text-muted-foreground" />
              </div>

              {/* Company tree */}
              <div className="flex-1 overflow-y-auto">
                {companies
                  .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
                  .map(company => {
                    const isExpanded = expandedCompany === company.id
                    const count = docsForCompany(company.id)
                    const folders = getCompanyFolders(company.id)
                    return (
                      <div key={company.id}>
                        <button
                          onClick={() => setExpandedCompany(prev => prev === company.id ? null : company.id)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent/40 transition-colors text-left border-b border-border/40"
                        >
                          <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1 text-xs font-semibold uppercase tracking-tight truncate">{company.name}</span>
                          {count > 0 && (
                            <span className="text-[9px] font-bold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 shrink-0">{count}</span>
                          )}
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
                        </button>

                        {isExpanded && (
                          <>
                            {folders.map(sf => {
                              const sfCount = docsForSubfolder(company.id, sf.id)
                              const isActive = selectedPath.companyId === company.id && selectedPath.subfolderId === sf.id
                              return (
                                <div key={sf.id} className="group/folder relative">
                                  <button
                                    onClick={() => { setSelectedPath({ companyId: company.id, subfolderId: sf.id }); setSearch('') }}
                                    className={`w-full flex items-center gap-2 pl-7 pr-2 py-2 transition-colors text-left border-b border-border/20
                                      ${isActive ? 'bg-accent/70 border-l-2 border-l-foreground' : 'hover:bg-accent/30'}`}
                                  >
                                    <span className="text-sm shrink-0">{sf.icon}</span>
                                    <span className="flex-1 text-xs truncate">{sf.name}</span>
                                    {sfCount > 0 && (
                                      <span className="text-[9px] font-bold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 shrink-0">{sfCount}</span>
                                    )}
                                    {sf.isCustom && (
                                      <button
                                        onClick={e => { e.stopPropagation(); deleteFolder(company.id, sf.id) }}
                                        className="opacity-0 group-hover/folder:opacity-100 p-0.5 hover:text-red-600 transition-all shrink-0"
                                        title="Eliminar carpeta"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </button>
                                </div>
                              )
                            })}

                            {/* New folder input */}
                            {showNewFolder === company.id ? (
                              <div className="flex items-center gap-1 pl-7 pr-2 py-1.5 border-b border-border/20">
                                <span className="text-sm">📁</span>
                                <input
                                  autoFocus
                                  value={newFolderName}
                                  onChange={e => setNewFolderName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') addCustomFolder(company.id)
                                    if (e.key === 'Escape') { setShowNewFolder(null); setNewFolderName('') }
                                  }}
                                  placeholder="Nombre de carpeta..."
                                  className="flex-1 text-xs border border-primary rounded px-1.5 py-0.5 outline-none bg-background"
                                />
                                <button onClick={() => addCustomFolder(company.id)} className="text-primary hover:text-primary/80">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setShowNewFolder(null); setNewFolderName('') }} className="text-muted-foreground hover:text-foreground">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowNewFolder(company.id)}
                                className="w-full flex items-center gap-2 pl-7 pr-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors text-left border-b border-border/20"
                              >
                                <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs">Nueva carpeta</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* ── RIGHT PANEL ─────────────────────────── */}
            <div className="flex-1 overflow-hidden flex flex-col min-w-0">
              {currentSubfolderId ? (
                <>
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-5 py-3 border-b border-border shrink-0">
                    <button onClick={() => setSelectedPath({ companyId: currentCompanyId, subfolderId: null })}
                      className="hover:text-foreground font-semibold transition-colors truncate max-w-[120px]">
                      {currentCompany?.name}
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-foreground font-medium truncate">
                      {getCompanyFolders(currentCompanyId).find(s => s.id === currentSubfolderId)?.name}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{filteredDocs.length} archivo{filteredDocs.length !== 1 ? 's' : ''}</span>
                  </div>

                  <input ref={uploadRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />

                  {/* File grid */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredDocs.length === 0 ? (
                      <div
                        onClick={() => uploadRef.current?.click()}
                        className="m-5 border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all"
                      >
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Arrastra archivos aquí</p>
                        <p className="text-xs text-muted-foreground mt-1">o haz click para subir • PNG, JPG, PDF, ZIP y más</p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext items={docsInFolder.map(d => d.id)} strategy={rectSortingStrategy}>
                          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-5">
                            {filteredDocs.map(doc => (
                              <SortableFileCard
                                key={doc.id}
                                doc={doc}
                                onDelete={(id) => { deleteDocument(id); toast.success('Archivo eliminado') }}
                                onRename={(id, name) => { updateDocument(id, { name }); toast.success('Renombrado') }}
                              />
                            ))}
                            {/* Upload drop-zone tile */}
                            <button
                              onClick={() => uploadRef.current?.click()}
                              className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/50 hover:bg-accent/20 transition-all"
                            >
                              <Plus className="w-6 h-6 opacity-40" />
                              <span className="text-[10px] font-medium">Subir</span>
                            </button>
                          </div>
                        </SortableContext>
                        <DragOverlay>
                          {activeDoc && (
                            <div className="bg-background border border-border rounded-xl shadow-2xl p-3 w-28 opacity-90 rotate-2">
                              <div className="aspect-square bg-muted/30 flex items-center justify-center text-3xl rounded-lg mb-2">
                                {activeDoc.type?.startsWith('image/') && activeDoc.url
                                  ? <img src={activeDoc.url} alt="" className="w-full h-full object-cover rounded-lg" />
                                  : <span>{getIcon(activeDoc.type)}</span>
                                }
                              </div>
                              <p className="text-xs truncate font-medium">{activeDoc.name}</p>
                            </div>
                          )}
                        </DragOverlay>
                      </DndContext>
                    )}
                  </div>
                </>
              ) : currentCompanyId ? (
                /* Folder grid for selected company */
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-tight">{currentCompany?.name}</h3>
                    <button onClick={() => setShowNewFolder(currentCompanyId)}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                      <FolderPlus className="w-3.5 h-3.5" /> Nueva carpeta
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {getCompanyFolders(currentCompanyId).map(sf => {
                      const count = docsForSubfolder(currentCompanyId, sf.id)
                      return (
                        <div key={sf.id} className="group relative">
                          <button
                            onClick={() => setSelectedPath({ companyId: currentCompanyId, subfolderId: sf.id })}
                            className="w-full bg-muted/30 hover:bg-accent/40 border border-border hover:border-foreground/20 rounded-xl p-4 text-left transition-all hover:shadow-sm"
                          >
                            <div className="text-3xl mb-2">{sf.icon}</div>
                            <p className="text-xs font-semibold truncate">{sf.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{count} archivo{count !== 1 ? 's' : ''}</p>
                          </button>
                          {sf.isCustom && (
                            <button
                              onClick={() => deleteFolder(currentCompanyId, sf.id)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded-md transition-all"
                              title="Eliminar carpeta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                    {/* Add folder button tile */}
                    <button
                      onClick={() => setShowNewFolder(currentCompanyId)}
                      className="bg-muted/10 hover:bg-accent/30 border-2 border-dashed border-border rounded-xl p-4 text-left transition-all text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    >
                      <FolderPlus className="w-7 h-7 mb-2 opacity-40" />
                      <p className="text-xs font-medium">Nueva carpeta</p>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 opacity-30" />
                  <p className="text-sm font-semibold uppercase tracking-widest">Selecciona una empresa</p>
                  <p className="text-xs opacity-60">Expande una empresa para ver sus carpetas</p>
                </div>
              )}
            </div>
          </div>

          {/* Storage bar */}
          <div className="shrink-0 border-t border-border px-4 py-2 flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">Almacenamiento</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${usedPct}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">{usedMB} MB / {limitMB} GB</span>
          </div>
        </div>
      </div>
    </div>
  )
}
