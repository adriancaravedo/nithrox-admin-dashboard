import { useState, useRef } from 'react'
import { useStore } from '../../../stores/useStore'
import { PROJECT_PHASES, formatCurrency } from '../../../lib/utils'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Checkbox } from '../../../components/ui/checkbox'
import { X, Plus, Trash2, Upload, ExternalLink, ChevronRight, FileText, Image as ImageIcon, Package, Check } from 'lucide-react'

// ── Sitemap builder (visual tree) ──────────────────────────────
function SitemapNode({ node, depth = 0, onUpdate, onDelete, onAddChild }) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(node.label)
  return (
    <div className={`${depth > 0 ? 'ml-6 mt-1.5' : 'mt-1.5'}`}>
      <div className="flex items-center gap-1.5 group">
        {depth > 0 && <div className="w-4 h-px bg-border shrink-0" />}
        {editing ? (
          <div className="flex items-center gap-1">
            <Input value={label} onChange={e => setLabel(e.target.value)} className="h-6 text-xs w-32" autoFocus onKeyDown={e => { if (e.key === 'Enter') { onUpdate({ ...node, label }); setEditing(false) } if (e.key === 'Escape') setEditing(false) }} />
            <button onClick={() => { onUpdate({ ...node, label }); setEditing(false) }} className="text-xs text-green-600">✓</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs px-2 py-1 bg-background border border-border rounded hover:border-primary transition-colors">
            {node.label}
          </button>
        )}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAddChild(node.id)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(node.id)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {node.children?.map(child => (
        <SitemapNode
          key={child.id}
          node={child}
          depth={depth + 1}
          onUpdate={updated => onUpdate({ ...node, children: node.children.map(c => c.id === updated.id ? updated : c) })}
          onDelete={id => onUpdate({ ...node, children: node.children.filter(c => c.id !== id) })}
          onAddChild={parentId => {
            const newNode = { id: `n${Date.now()}`, label: 'Nueva página', children: [] }
            if (parentId === child.id) onUpdate({ ...node, children: node.children.map(c => c.id === child.id ? { ...c, children: [...(c.children || []), newNode] } : c) })
            else onUpdate({ ...node, children: node.children.map(c => c.id === child.id ? { ...c, ...child } : c) })
          }}
        />
      ))}
    </div>
  )
}

function SitemapBuilder({ sitemap, onChange }) {
  const addRoot = () => {
    onChange([...sitemap, { id: `n${Date.now()}`, label: 'Nueva página', children: [] }])
  }
  const updateNode = (updated) => {
    onChange(sitemap.map(n => n.id === updated.id ? updated : n))
  }
  const deleteNode = (id) => {
    onChange(sitemap.filter(n => n.id !== id))
  }
  const addChild = (parentId) => {
    const newNode = { id: `n${Date.now()}`, label: 'Nueva página', children: [] }
    onChange(sitemap.map(n => n.id === parentId ? { ...n, children: [...(n.children || []), newNode] } : n))
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/20 min-h-[120px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">Mapa visual del sitio</p>
        <Button size="sm" variant="outline" onClick={addRoot} className="h-7 text-xs gap-1">
          <Plus className="w-3 h-3" /> Agregar página
        </Button>
      </div>
      {sitemap.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          Haz click en "Agregar página" para comenzar a construir el mapa del sitio
        </div>
      ) : (
        <div>
          {sitemap.map(node => (
            <SitemapNode
              key={node.id}
              node={node}
              onUpdate={updateNode}
              onDelete={deleteNode}
              onAddChild={addChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── File upload area ────────────────────────────────────────────
function FileUploadArea({ files = [], onChange, label = 'Subir archivos', accept = '*' }) {
  const inputRef = useRef()
  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      url: URL.createObjectURL(f),
      type: f.type,
    }))
    onChange([...files, ...newFiles])
  }

  const getIcon = (file) => {
    if (file.type?.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (file.type === 'application/pdf') return <FileText className="w-4 h-4" />
    return <Package className="w-4 h-4" />
  }

  return (
    <div>
      <div
        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors hover:bg-accent/30"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles({ target: { files: e.dataTransfer.files } }) }}
      >
        <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Arrastra archivos o haz click</p>
        <input ref={inputRef} type="file" multiple className="hidden" accept={accept} onChange={handleFiles} />
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-background border border-border rounded-md">
              <span className="text-muted-foreground shrink-0">{getIcon(file)}</span>
              <span className="text-xs flex-1 truncate">{file.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{file.size}</span>
              <div className="flex gap-1 shrink-0">
                {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></a>}
                <button onClick={() => onChange(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Color picker row ────────────────────────────────────────────
function ColorPicker({ colors = [], onChange }) {
  const [adding, setAdding] = useState(false)
  const [newColor, setNewColor] = useState('#000000')
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {colors.map((color, i) => (
          <div key={i} className="flex items-center gap-1.5 border border-border rounded-md px-2 py-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs font-mono">{color}</span>
            <button onClick={() => onChange(colors.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive ml-0.5"><X className="w-3 h-3" /></button>
          </div>
        ))}
        {adding ? (
          <div className="flex items-center gap-1.5">
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <Button size="sm" className="h-7 text-xs" onClick={() => { onChange([...colors, newColor]); setAdding(false); setNewColor('#000000') }}>+ Agregar</Button>
            <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground">✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-md px-2 py-1 hover:border-primary transition-colors">
            <Plus className="w-3 h-3" /> Color
          </button>
        )}
      </div>
    </div>
  )
}

// ── Phase content panels ─────────────────────────────────────────
function KickoffPanel({ project, phaseData, onUpdate }) {
  const branding = phaseData.branding || { logo: [], colors: [], fonts: [] }
  const sitemap = phaseData.sitemap || []
  const accesses = phaseData.accesses || {}

  const updateBranding = (key, val) => onUpdate({ branding: { ...branding, [key]: val } })
  const updateAccesses = (key, val) => onUpdate({ accesses: { ...accesses, [key]: val } })

  return (
    <div className="space-y-5">
      {/* Branding */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🎨 Branding</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5 block">Logo</Label>
            <FileUploadArea
              files={branding.logo}
              onChange={v => updateBranding('logo', v)}
              label="Subir logo (SVG, PNG, AI)"
              accept="image/*,.svg,.ai,.eps"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Paleta de colores</Label>
            <ColorPicker colors={branding.colors} onChange={v => updateBranding('colors', v)} />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Tipografías</Label>
            <div className="flex flex-wrap gap-1.5">
              {(branding.fonts || []).map((font, i) => (
                <div key={i} className="flex items-center gap-1 border border-border rounded-md px-2 py-1 text-xs">
                  {font}
                  <button onClick={() => updateBranding('fonts', branding.fonts.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive ml-1"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <input
                placeholder="+ Agregar tipografía"
                className="text-xs border-0 outline-none bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 w-32"
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { updateBranding('fonts', [...(branding.fonts || []), e.target.value.trim()]); e.target.value = '' } }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Brief */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📋 Brief del proyecto</h3>
        <Textarea
          value={phaseData.brief || ''}
          onChange={e => onUpdate({ brief: e.target.value })}
          placeholder="Describe el proyecto: objetivos, audiencia, funcionalidades clave, referencias de diseño..."
          rows={4}
          className="text-sm"
        />
      </section>

      {/* Sitemap */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🗺️ Mapa del sitio</h3>
        <SitemapBuilder sitemap={sitemap} onChange={v => onUpdate({ sitemap: v })} />
      </section>

      {/* Accesses */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🔐 Accesos del servidor</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'cpanel', label: 'cPanel URL' },
            { key: 'ftp', label: 'FTP' },
            { key: 'db', label: 'Base de datos' },
          ].map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs">{field.label}</Label>
              <Input value={accesses[field.key] || ''} onChange={e => updateAccesses(field.key, e.target.value)} placeholder={field.key === 'cpanel' ? 'https://servidor:2083' : field.key === 'ftp' ? 'ftp://...' : 'mysql://...'} className="text-xs h-8" />
            </div>
          ))}
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Notas adicionales</Label>
            <Textarea value={accesses.notes || ''} onChange={e => updateAccesses('notes', e.target.value)} placeholder="Credenciales, instrucciones especiales..." rows={2} className="text-sm" />
          </div>
        </div>
      </section>
    </div>
  )
}

function DesignPanel({ phaseData, onUpdate }) {
  const versions = phaseData.versions || { mobile: true, tablet: false, desktop: true }
  const files = phaseData.files || []
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🔗 Link de Figma</h3>
        <div className="flex gap-2">
          <Input
            value={phaseData.figma_url || ''}
            onChange={e => onUpdate({ figma_url: e.target.value })}
            placeholder="https://figma.com/file/..."
            className="text-sm"
          />
          {phaseData.figma_url && (
            <a href={phaseData.figma_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><ExternalLink className="w-4 h-4" /></Button>
            </a>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📱 Versiones a diseñar</h3>
        <div className="flex gap-3">
          {[
            { key: 'mobile', label: '📱 Mobile (375px)' },
            { key: 'tablet', label: '💻 Tablet (768px)' },
            { key: 'desktop', label: '🖥️ Desktop (1440px)' },
          ].map(v => (
            <label key={v.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${versions[v.key] ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <Checkbox checked={versions[v.key]} onCheckedChange={val => onUpdate({ versions: { ...versions, [v.key]: val } })} />
              <span className="text-xs font-medium">{v.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📁 Archivos de diseño</h3>
        <FileUploadArea files={files} onChange={v => onUpdate({ files: v })} label="Subir archivos de diseño (.fig, .sketch, PDF)" accept=".fig,.sketch,.pdf,image/*" />
      </section>
    </div>
  )
}

function DevelopmentPanel({ phaseData, onUpdate }) {
  const files = phaseData.files || []
  const checklist = [
    { key: 'html_css', label: 'Maquetado HTML/CSS completo' },
    { key: 'cms', label: 'Integración CMS/Framework' },
    { key: 'forms', label: 'Formularios funcionales' },
    { key: 'mobile', label: 'Responsive mobile optimizado' },
    { key: 'seo', label: 'SEO básico (meta tags, sitemap.xml)' },
    { key: 'performance', label: 'Optimización de performance' },
  ]
  const checks = phaseData.checklist_dev || {}
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🌐 URL de Staging</h3>
        <div className="flex gap-2">
          <Input value={phaseData.staging_url || ''} onChange={e => onUpdate({ staging_url: e.target.value })} placeholder="https://staging.nithrox.com/proyecto" className="text-sm" />
          {phaseData.staging_url && (
            <a href={phaseData.staging_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><ExternalLink className="w-4 h-4" /></Button>
            </a>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">✅ Checklist de desarrollo</h3>
        <div className="space-y-2">
          {checklist.map(item => (
            <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={!!checks[item.key]}
                onCheckedChange={val => onUpdate({ checklist_dev: { ...checks, [item.key]: val } })}
              />
              <span className={`text-sm transition-colors ${checks[item.key] ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📝 Notas de desarrollo</h3>
        <Textarea value={phaseData.notes || ''} onChange={e => onUpdate({ notes: e.target.value })} placeholder="Notas técnicas, decisiones de arquitectura, issues conocidos..." rows={3} className="text-sm" />
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📁 Archivos</h3>
        <FileUploadArea files={files} onChange={v => onUpdate({ files: v })} label="Subir archivos del desarrollo" />
      </section>
    </div>
  )
}

function PublicationPanel({ phaseData, onUpdate }) {
  const checklist = phaseData.checklist || {}
  const CHECKS = [
    { key: 'final_review', label: 'Revisión final completada' },
    { key: 'corrections', label: 'Correcciones del cliente aplicadas' },
    { key: 'deploy', label: 'Deploy en servidor de producción' },
    { key: 'dns', label: 'DNS apuntado al servidor' },
    { key: 'ssl', label: 'SSL activo y verificado' },
    { key: 'speed', label: 'Test de velocidad pasado (>70 Lighthouse)' },
    { key: 'backup', label: 'Backup inicial creado' },
    { key: 'training', label: 'Capacitación al cliente completada' },
  ]
  const allDone = CHECKS.every(c => checklist[c.key])

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🌐 Dominio de producción</h3>
        <div className="flex gap-2">
          <Input value={phaseData.domain || ''} onChange={e => onUpdate({ domain: e.target.value })} placeholder="www.tudominio.pe" className="text-sm" />
          {phaseData.domain && (
            <a href={`https://${phaseData.domain}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><ExternalLink className="w-4 h-4" /></Button>
            </a>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">✅ Checklist de publicación</h3>
        <div className="space-y-2">
          {CHECKS.map(item => (
            <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={!!checklist[item.key]} onCheckedChange={val => onUpdate({ checklist: { ...checklist, [item.key]: val } })} />
              <span className={`text-sm ${checklist[item.key] ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
            </label>
          ))}
        </div>
        {allDone && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700 font-medium">¡Todo listo! El sitio puede publicarse.</p>
          </div>
        )}
      </section>

      <section>
        <Button className="w-full" disabled={!allDone} variant={allDone ? 'default' : 'outline'}>
          {allDone ? '⚡ Publicar en servidor' : 'Completa el checklist para publicar'}
        </Button>
      </section>
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────
export default function ProjectModal({ project, initialPhase, onClose }) {
  const { updateProjectPhase } = useStore()
  const [activePhase, setActivePhase] = useState(initialPhase || project.phase)

  const phaseData = project.phases[activePhase] || {}
  const totalPaid = PROJECT_PHASES.reduce((s, ph) => s + (project.phases[ph.id]?.paid_amount || 0), 0)
  const totalPct = project.value ? Math.round((totalPaid / project.value) * 100) : 0

  const handleUpdate = (data) => {
    updateProjectPhase(project.id, activePhase, data)
  }

  const handleApproveAdmin = () => {
    updateProjectPhase(project.id, activePhase, { approved_admin: true })
  }

  const handleMarkPaid = () => {
    const phase = PROJECT_PHASES.find(p => p.id === activePhase)
    const amount = project.value ? Math.round(project.value * (phase?.pct || 10) / 100) : 0
    updateProjectPhase(project.id, activePhase, {
      paid: true,
      paid_amount: amount,
      paid_date: new Date().toISOString().split('T')[0],
    })
  }

  const canAdvance = phaseData.paid && phaseData.approved_admin && phaseData.approved_client
  const phaseIndex = PROJECT_PHASES.findIndex(p => p.id === activePhase)
  const nextPhase = PROJECT_PHASES[phaseIndex + 1]

  const handleAdvance = () => {
    if (!nextPhase) return
    updateProjectPhase(project.id, activePhase, { status: 'approved' })
    updateProjectPhase(project.id, nextPhase.id, { status: 'in_progress' })
    useStore.getState().updateProject(project.id, { phase: nextPhase.id })
    setActivePhase(nextPhase.id)
  }

  const PHASE_STATUS_COLOR = {
    approved: 'bg-green-100 text-green-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    locked: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-background rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-base">{project.name}</h2>
            <p className="text-xs text-muted-foreground">{project.company} · {project.contact} · {project.framework}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Phase selector */}
          <div className="w-[200px] border-r border-border p-3 shrink-0 flex flex-col gap-2 overflow-y-auto">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-1">Fases del proyecto</p>

            {PROJECT_PHASES.map((phase, i) => {
              const pd = project.phases[phase.id]
              const isActive = activePhase === phase.id
              const statusIcon = pd?.status === 'approved' ? '✅' : pd?.status === 'in_progress' ? '🟡' : '🔒'
              const phaseAmount = project.value ? Math.round(project.value * phase.pct / 100) : 0

              return (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(phase.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${isActive ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/30 bg-background'}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold">{phase.icon} {phase.label}</span>
                    <span className="text-sm">{statusIcon}</span>
                  </div>
                  <div className={`text-[10px] ${isActive ? 'text-background/70' : 'text-muted-foreground'}`}>
                    {phase.pct}% · ${phaseAmount.toLocaleString()}
                  </div>
                  {(pd?.paid_amount || 0) > 0 && (
                    <div className={`text-[10px] mt-0.5 ${isActive ? 'text-green-300' : 'text-green-600'}`}>
                      Pagado ${pd.paid_amount.toLocaleString()}
                    </div>
                  )}
                </button>
              )
            })}

            {/* Total cobrado */}
            <div className="mt-auto pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1">COBRADO TOTAL</p>
              <p className="text-base font-bold">${totalPaid.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">de ${project.value?.toLocaleString()} · {totalPct}%</p>
              <div className="mt-1.5 bg-muted rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${totalPct}%` }} />
              </div>
            </div>
          </div>

          {/* RIGHT — Phase detail */}
          <div className="flex-1 overflow-y-auto">
            {/* Phase header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{PROJECT_PHASES.find(p => p.id === activePhase)?.icon} {PROJECT_PHASES.find(p => p.id === activePhase)?.label}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PHASE_STATUS_COLOR[phaseData.status] || PHASE_STATUS_COLOR.locked}`}>
                    {phaseData.status === 'approved' ? '✅ Aprobada' : phaseData.status === 'in_progress' ? '🟡 En progreso' : '🔒 Bloqueada'}
                  </span>
                </div>
              </div>
            </div>

            {phaseData.status === 'locked' ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                <div className="text-4xl mb-3">🔒</div>
                <p className="font-semibold mb-1">Fase bloqueada</p>
                <p className="text-sm text-muted-foreground">Aprueba y cobra la fase anterior para desbloquear.</p>
              </div>
            ) : (
              <div className="p-5 space-y-6">
                {/* Payment + Approvals */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Payment */}
                  <div className={`rounded-lg border p-4 ${phaseData.paid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">💳 Pago de fase</p>
                    <p className="text-lg font-bold">${project.value ? Math.round(project.value * (PROJECT_PHASES.find(p => p.id === activePhase)?.pct || 10) / 100).toLocaleString() : '—'}</p>
                    <p className="text-xs text-muted-foreground mb-3">{PROJECT_PHASES.find(p => p.id === activePhase)?.pct}% del proyecto</p>
                    {phaseData.paid ? (
                      <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
                        <Check className="w-3.5 h-3.5" /> Pagado el {phaseData.paid_date}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-xs text-yellow-700 font-medium">⏳ Pago pendiente del cliente</p>
                        <Button size="sm" className="h-7 text-xs w-full bg-green-600 hover:bg-green-700" onClick={handleMarkPaid}>
                          ✅ Marcar como pagado
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs w-full">
                          📄 Enviar factura
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Approvals */}
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">✅ Aprobaciones</p>
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${phaseData.approved_admin ? 'bg-green-50 border border-green-200' : 'bg-muted border border-border'}`}>
                        <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0">AC</div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">Nithrox</p>
                          {phaseData.approved_admin ? (
                            <p className="text-[10px] text-green-600">✅ Aprobado</p>
                          ) : (
                            <Button size="sm" className="h-6 text-[10px] mt-0.5" onClick={handleApproveAdmin}>Aprobar</Button>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${phaseData.approved_client ? 'bg-green-50 border border-green-200' : 'bg-muted border border-border'}`}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: '#7c3aed' }}>C</div>
                        <div>
                          <p className="text-xs font-medium">{project.company}</p>
                          {phaseData.approved_client ? (
                            <p className="text-[10px] text-green-600">✅ Aprobó</p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">⏳ Pendiente</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advance button */}
                {canAdvance && nextPhase && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-800 text-sm">🎉 Fase lista para avanzar</p>
                      <p className="text-xs text-green-700 mt-0.5">Pago confirmado · Ambas partes aprobaron</p>
                    </div>
                    <Button onClick={handleAdvance} className="bg-green-600 hover:bg-green-700 text-white">
                      Avanzar a {nextPhase.label} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}

                {!phaseData.paid && phaseData.status === 'in_progress' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700">⛔ No se puede avanzar sin confirmar el pago</p>
                    <p className="text-[10px] text-red-600 mt-0.5">El cliente debe pagar esta fase antes de que ambos puedan aprobar.</p>
                  </div>
                )}

                {/* Phase-specific content */}
                <div className="border-t border-border pt-5">
                  {activePhase === 'kickoff' && <KickoffPanel project={project} phaseData={phaseData} onUpdate={handleUpdate} />}
                  {activePhase === 'design' && <DesignPanel phaseData={phaseData} onUpdate={handleUpdate} />}
                  {activePhase === 'development' && <DevelopmentPanel phaseData={phaseData} onUpdate={handleUpdate} />}
                  {activePhase === 'publication' && <PublicationPanel phaseData={phaseData} onUpdate={handleUpdate} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
