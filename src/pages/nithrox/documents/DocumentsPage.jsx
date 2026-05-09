import { useState, useRef } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  FolderOpen, Folder, FileText, Image, Package, Film,
  ChevronRight, Upload, Trash2, Download, Eye,
  Search, Grid, List, Plus, ArrowLeft, ExternalLink,
  File, FilePlus, FolderPlus
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

// ── Breadcrumb ───────────────────────────────────────────────
function Breadcrumb({ crumbs, onNavigate }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((c, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3" />}
          <button onClick={() => onNavigate(i)}
            className={`hover:text-foreground transition-colors ${i === crumbs.length - 1 ? 'text-foreground font-bold' : ''}`}>
            {c}
          </button>
        </div>
      ))}
    </div>
  )
}

export default function DocumentsPage() {
  const { companies, documents, addDocument, deleteDocument } = useStore()
  const [view, setView] = useState('grid') // grid | list
  const [search, setSearch] = useState('')
  const [path, setPath] = useState([]) // ['company_id'] | ['company_id', 'subfolder_id']
  const [dragOver, setDragOver] = useState(false)
  const uploadRef = useRef()

  // Current context
  const currentCompanyId = path[0] || null
  const currentSubfolderId = path[1] || null
  const currentCompany = companies.find(c => c.id === currentCompanyId)

  // Get docs for current folder
  const docsInFolder = documents.filter(d =>
    d.company_id === currentCompanyId &&
    d.subfolder === currentSubfolderId
  )

  const filteredDocs = docsInFolder.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  // Navigate
  const navigate = (level) => {
    if (level === 0) setPath([])
    else if (level === 1) setPath([currentCompanyId])
  }

  const openCompany = (companyId) => setPath([companyId])
  const openSubfolder = (subfolderId) => setPath([currentCompanyId, subfolderId])
  const goBack = () => {
    if (path.length === 2) setPath([currentCompanyId])
    else if (path.length === 1) setPath([])
  }

  // Doc count per company
  const docsForCompany = (companyId) =>
    documents.filter(d => d.company_id === companyId).length

  // Doc count per subfolder
  const docsForSubfolder = (companyId, subfolderId) =>
    documents.filter(d => d.company_id === companyId && d.subfolder === subfolderId).length

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

  // Breadcrumb labels
  const crumbs = ['Documentos']
  if (currentCompany) crumbs.push(currentCompany.name)
  if (currentSubfolderId) {
    const sf = DEFAULT_SUBFOLDERS.find(s => s.id === currentSubfolderId)
    if (sf) crumbs.push(sf.name)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden"
      onDragOver={e => { e.preventDefault(); if (currentSubfolderId) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <Topbar
        title="DOCUMENTOS"
        actions={
          <div className="flex items-center gap-2">
            {currentSubfolderId && (
              <button onClick={() => uploadRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
                <Upload className="w-3.5 h-3.5" /> Subir archivo
              </button>
            )}
            <input ref={uploadRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button onClick={() => setView('grid')} className={`p-1.5 ${view === 'grid' ? 'bg-accent' : 'hover:bg-accent'} transition-colors`}>
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 ${view === 'list' ? 'bg-accent' : 'hover:bg-accent'} transition-colors`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-background shrink-0">
        {path.length > 0 && (
          <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <Breadcrumb crumbs={crumbs} onNavigate={(i) => {
          if (i === 0) setPath([])
          else if (i === 1) setPath([currentCompanyId])
        }} />
        {currentSubfolderId && (
          <div className="ml-auto relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar archivos..."
              className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg outline-none focus:border-primary bg-background" />
          </div>
        )}
      </div>

      {/* Drop zone indicator */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-bold text-primary uppercase tracking-widest">Suelta para subir</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5">

        {/* ── ROOT: Client folders ─────────────────────────── */}
        {path.length === 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { l: 'TOTAL ARCHIVOS', v: documents.length },
                { l: 'CLIENTES', v: companies.filter(c => docsForCompany(c.id) > 0).length },
                { l: 'ESPACIO USADO', v: `${(documents.reduce((s, d) => s + (d.size_bytes || 0), 0) / (1024 * 1024)).toFixed(1)} MB` },
              ].map(s => (
                <div key={s.l} className="bg-background border border-border rounded-xl p-4">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{s.v}</p>
                </div>
              ))}
            </div>

            {/* Client folders */}
            <div className="mb-3">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">CARPETAS DE CLIENTES</p>
            </div>

            {view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {companies.map(company => (
                  <button key={company.id} onClick={() => openCompany(company.id)}
                    className="flex flex-col items-center gap-2 p-5 bg-background border border-border rounded-xl hover:border-foreground/30 hover:shadow-sm transition-all group text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform" style={{ backgroundColor: company.avatar_color + '20' }}>
                      🏢
                    </div>
                    <p className="text-xs font-bold uppercase tracking-tight truncate w-full">{company.name}</p>
                    <p className="text-[10px] text-muted-foreground">{docsForCompany(company.id)} archivos</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-background border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CLIENTE</th>
                      <th className="text-left px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ARCHIVOS</th>
                      <th className="text-left px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">INDUSTRIA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {companies.map(c => (
                      <tr key={c.id} onClick={() => openCompany(c.id)}
                        className="hover:bg-accent/30 cursor-pointer transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Folder className="w-5 h-5 text-yellow-500" />
                            <span className="text-xs font-bold uppercase">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{docsForCompany(c.id)}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{c.industry || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── LEVEL 1: Subfolders ──────────────────────────── */}
        {path.length === 1 && currentCompany && (
          <>
            {/* Company header */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-background border border-border rounded-xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: currentCompany.avatar_color + '20' }}>
                🏢
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cliente</p>
                <p className="text-lg font-bold uppercase tracking-tight">{currentCompany.name}</p>
                <p className="text-xs text-muted-foreground">{docsForCompany(currentCompanyId)} archivos · {currentCompany.industry || 'Sin industria'}</p>
              </div>
            </div>

            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">CARPETAS</p>

            {view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {DEFAULT_SUBFOLDERS.map(sf => {
                  const count = docsForSubfolder(currentCompanyId, sf.id)
                  return (
                    <button key={sf.id} onClick={() => openSubfolder(sf.id)}
                      className="flex flex-col items-center gap-2 p-5 bg-background border border-border rounded-xl hover:border-foreground/30 hover:shadow-sm transition-all group text-center">
                      <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                        {sf.icon}
                      </div>
                      <p className="text-xs font-bold uppercase tracking-tight">{sf.name}</p>
                      <p className="text-[10px] text-muted-foreground">{sf.desc}</p>
                      {count > 0 && <p className="text-[10px] font-bold text-foreground">{count} archivos</p>}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="bg-background border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CARPETA</th>
                      <th className="text-left px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">DESCRIPCIÓN</th>
                      <th className="text-left px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ARCHIVOS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {DEFAULT_SUBFOLDERS.map(sf => (
                      <tr key={sf.id} onClick={() => openSubfolder(sf.id)}
                        className="hover:bg-accent/30 cursor-pointer transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{sf.icon}</span>
                            <span className="text-xs font-bold uppercase">{sf.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{sf.desc}</td>
                        <td className="px-5 py-3 text-xs font-bold">{docsForSubfolder(currentCompanyId, sf.id)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── LEVEL 2: Files ───────────────────────────────── */}
        {path.length === 2 && currentSubfolderId && (
          <>
            {/* Upload zone CTA */}
            {filteredDocs.length === 0 && !search && (
              <div onClick={() => uploadRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all mb-4">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Arrastra archivos o haz click para subir</p>
                <p className="text-xs text-muted-foreground mt-1">Soporta cualquier tipo de archivo</p>
              </div>
            )}

            {filteredDocs.length > 0 && (
              view === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredDocs.map(doc => (
                    <div key={doc.id} className="group bg-background border border-border rounded-xl overflow-hidden hover:shadow-sm hover:border-foreground/20 transition-all">
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
                          <button onClick={() => { deleteDocument(doc.id); toast.success('Archivo eliminado') }}
                            className="p-2 bg-white/20 rounded-full hover:bg-red-500/80 transition-colors">
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(doc.size_bytes)}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add more */}
                  <button onClick={() => uploadRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-accent/20 transition-all">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Subir</p>
                  </button>
                </div>
              ) : (
                <div className="bg-background border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        {['NOMBRE', 'TIPO', 'TAMAÑO', 'SUBIDO POR', 'FECHA', ''].map(h => (
                          <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredDocs.map(doc => (
                        <tr key={doc.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{getIcon(doc.type)}</span>
                              <p className="text-xs font-medium truncate max-w-48">{doc.name}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-[10px] text-muted-foreground font-mono">{doc.type?.split('/')[1]?.toUpperCase() || '—'}</td>
                          <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums">{formatSize(doc.size_bytes)}</td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{doc.uploaded_by || 'Nithrox'}</td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-PE') : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1">
                              {doc.url && (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                  className="w-7 h-7 border border-border rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button onClick={() => { deleteDocument(doc.id); toast.success('Archivo eliminado') }}
                                className="w-7 h-7 border border-border rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Upload row */}
                  <div className="flex items-center gap-3 px-5 py-3 border-t border-border">
                    <button onClick={() => uploadRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Subir archivo
                    </button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
