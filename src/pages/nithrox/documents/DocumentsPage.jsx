import { useState, useRef } from 'react'
import { useStore } from '../../../stores/useStore'
import { toast } from 'sonner'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import {
  FolderOpen, Folder, Search, Upload, Trash2, Eye,
  Plus, ChevronRight, ChevronDown, Building2, Pencil, X
} from 'lucide-react'

// Subcarpetas estándar por cliente
const DEFAULT_SUBFOLDERS = [
  { id: 'branding',   name: 'Branding',    icon: '🎨', desc: 'Logos, colores, tipografías' },
  { id: 'contratos',  name: 'Contratos',   icon: '📝', desc: 'Contratos, NDAs, propuestas' },
  { id: 'facturas',   name: 'Facturas',    icon: '🧾', desc: 'Facturas Nithrox y SUNAT' },
  { id: 'briefs',     name: 'Briefs',      icon: '📋', desc: 'Formularios y briefings' },
  { id: 'diseno',     name: 'Diseño',      icon: '🖼️',  desc: 'Figma, mockups, exports' },
  { id: 'desarrollo', name: 'Desarrollo',  icon: '💻', desc: 'Código, docs técnicos' },
  { id: 'assets',     name: 'Assets',      icon: '📦', desc: 'Fotos, videos, recursos' },
  { id: 'otros',      name: 'Otros',       icon: '📁', desc: 'Documentos varios' },
]

const FILE_ICONS = {
  'image/png': '🖼️', 'image/jpeg': '🖼️', 'image/svg+xml': '🖼️', 'image/gif': '🖼️', 'image/webp': '🖼️',
  'application/pdf': '📄',
  'video/mp4': '🎬', 'video/quicktime': '🎬',
  'application/zip': '📦',
  'text/html': '🌐',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
}

function getIcon(type) {
  return FILE_ICONS[type] || '📄'
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const { companies, documents, addDocument, deleteDocument, updateDocument } = useStore()
  const [expandedCompany, setExpandedCompany] = useState(null)
  const [selectedPath, setSelectedPath] = useState({ companyId: null, subfolderId: null })
  const [dragOver, setDragOver] = useState(false)
  const [search, setSearch] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const uploadRef = useRef()

  const currentCompanyId = selectedPath.companyId
  const currentSubfolderId = selectedPath.subfolderId
  const currentCompany = companies.find(c => c.id === currentCompanyId)

  // Doc count helpers
  const docsForCompany = (companyId) =>
    documents.filter(d => d.company_id === companyId).length

  const docsForSubfolder = (companyId, subfolderId) =>
    documents.filter(d => d.company_id === companyId && d.subfolder === subfolderId).length

  // Docs in selected folder
  const docsInFolder = documents.filter(d =>
    d.company_id === currentCompanyId &&
    d.subfolder === currentSubfolderId
  )

  const filteredDocs = docsInFolder.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  // Upload handler
  const handleUpload = (files) => {
    if (!currentCompanyId || !currentSubfolderId) {
      toast.error('Selecciona una carpeta de cliente primero')
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
          uploaded_by: 'Adrian Caravedo',
        })
      }
      reader.readAsDataURL(file)
    })
    toast.success(`${files.length} archivo${files.length > 1 ? 's' : ''} subido${files.length > 1 ? 's' : ''}`)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files)
  }

  // Toggle company expansion in sidebar
  const toggleCompany = (companyId) => {
    setExpandedCompany(prev => prev === companyId ? null : companyId)
  }

  // Select subfolder
  const selectSubfolder = (companyId, subfolderId) => {
    setSelectedPath({ companyId, subfolderId })
    setSearch('')
  }

  // Stats
  const totalFiles = documents.length
  const totalClients = companies.filter(c => docsForCompany(c.id) > 0).length
  const totalMB = (documents.reduce((s, d) => s + (d.size_bytes || 0), 0) / (1024 * 1024)).toFixed(1)

  const startRename = (doc) => { setRenaming(doc.id); setRenameVal(doc.name) }
  const commitRename = (doc) => {
    if (renameVal.trim() && renameVal !== doc.name) {
      updateDocument?.(doc.id, { name: renameVal.trim() })
      toast.success('Archivo renombrado')
    }
    setRenaming(null)
  }

  const totalSize = documents.reduce((s, d) => s + (d.size_bytes || 0), 0)
  const usedMB = (totalSize / (1024 * 1024)).toFixed(1)
  const limitMB = 1024
  const usedPct = Math.min(100, (totalSize / (limitMB * 1024 * 1024)) * 100).toFixed(1)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Documentos"
        actions={
          currentSubfolderId ? (
            <Button size="sm" onClick={() => uploadRef.current?.click()} className="text-xs rounded-full px-4">
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir archivo
            </Button>
          ) : null
        }
      />

    <div
      className="flex-1 overflow-hidden p-4"
      onDragOver={e => { e.preventDefault(); if (currentSubfolderId) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
    <div className="h-full rounded-xl border border-border bg-background overflow-hidden flex flex-col shadow-sm">
      {/* Drop zone overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-bold text-primary uppercase tracking-widest">Suelta para subir</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ──────────────────────────────────────── */}
        <div className="w-[320px] shrink-0 border-r border-border flex flex-col overflow-hidden">

          {/* Stats bar */}
          <div className="grid grid-cols-3 border-b border-border shrink-0">
            {[
              { l: 'Total archivos', v: totalFiles },
              { l: 'Clientes', v: totalClients },
              { l: 'MB usados', v: totalMB },
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
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empresa..."
              className="w-full pl-9 pr-3 py-2.5 text-xs outline-none bg-background placeholder:text-muted-foreground"
            />
          </div>

          {/* Company tree */}
          <div className="flex-1 overflow-y-auto">
            {companies
              .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
              .map(company => {
                const isExpanded = expandedCompany === company.id
                const count = docsForCompany(company.id)
                return (
                  <div key={company.id}>
                    {/* Company row */}
                    <button
                      onClick={() => toggleCompany(company.id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent/40 transition-colors text-left border-b border-border/40"
                    >
                      <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-xs font-semibold uppercase tracking-tight truncate">{company.name}</span>
                      {count > 0 && (
                        <span className="text-[9px] font-bold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 shrink-0">
                          {count}
                        </span>
                      )}
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      }
                    </button>

                    {/* Subfolders */}
                    {isExpanded && DEFAULT_SUBFOLDERS.map(sf => {
                      const sfCount = docsForSubfolder(company.id, sf.id)
                      const isActive = selectedPath.companyId === company.id && selectedPath.subfolderId === sf.id
                      return (
                        <button
                          key={sf.id}
                          onClick={() => selectSubfolder(company.id, sf.id)}
                          className={`w-full flex items-center gap-2 pl-8 pr-3 py-2 transition-colors text-left border-b border-border/20
                            ${isActive
                              ? 'bg-accent/70 border-l-2 border-l-foreground'
                              : 'hover:bg-accent/30'
                            }`}
                        >
                          <Folder className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span className="flex-1 text-xs truncate">{sf.name}</span>
                          {sfCount > 0 && (
                            <span className="text-[9px] font-bold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 shrink-0">
                              {sfCount}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentSubfolderId ? (
            <>
              {/* Breadcrumb strip */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground px-5 py-3 border-b border-border shrink-0">
                <span className="font-semibold text-foreground truncate">{currentCompany?.name}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{DEFAULT_SUBFOLDERS.find(s => s.id === currentSubfolderId)?.name}</span>
              </div>
              <input ref={uploadRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />

              {/* File grid / empty state */}
              <div className="flex-1 overflow-y-auto">
                {filteredDocs.length === 0 ? (
                  <div
                    onClick={() => uploadRef.current?.click()}
                    className="m-5 border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all"
                  >
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Arrastra archivos aquí</p>
                    <p className="text-xs text-muted-foreground mt-1">o haz click para subir</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 p-5">
                    {filteredDocs.map(doc => (
                      <div
                        key={doc.id}
                        className="group bg-background border border-border rounded-xl overflow-hidden hover:shadow-sm hover:border-foreground/20 transition-all"
                      >
                        {/* Preview */}
                        <div className="aspect-square bg-muted/30 flex items-center justify-center text-4xl relative">
                          {doc.type?.startsWith('image/') && doc.url ? (
                            <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{getIcon(doc.type)}</span>
                          )}
                          {/* Actions overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                <Eye className="w-4 h-4 text-white" />
                              </a>
                            )}
                            <button onClick={() => startRename(doc)}
                              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                              <Pencil className="w-4 h-4 text-white" />
                            </button>
                            <button onClick={() => { deleteDocument(doc.id); toast.success('Archivo eliminado') }}
                              className="p-2 bg-white/20 rounded-full hover:bg-red-500/80 transition-colors">
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                        <div className="p-2.5">
                          {renaming === doc.id ? (
                            <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                              onBlur={() => commitRename(doc)}
                              onKeyDown={e => { if (e.key === 'Enter') commitRename(doc); if (e.key === 'Escape') setRenaming(null) }}
                              className="w-full text-xs border border-primary rounded px-1 outline-none" />
                          ) : (
                            <p className="text-xs font-medium truncate" title={doc.name}>{doc.name}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(doc.size_bytes)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Nothing selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
              <FolderOpen className="w-12 h-12 opacity-30" />
              <p className="text-sm font-semibold uppercase tracking-widest">Selecciona una carpeta</p>
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
