import { useState, useRef } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  Plus, Globe, Eye, Pencil, Trash2, Copy, ExternalLink,
  X, Check, Image, Palette, Settings, Users, FolderKanban,
  Lock, Unlock, ToggleLeft, ArrowRight, Monitor
} from 'lucide-react'

const DEMO_PORTALS = [
  {
    id: 'pt1', company_id: 'co1', company: 'Fashion Co.', active: true,
    subdomain: 'fashionco', custom_domain: 'portal.fashionco.pe',
    created_at: '2026-04-01',
    branding: { primary: '#7c3aed', secondary: '#a78bfa', logo: null, company_name: 'Fashion Co.', welcome: '¡Bienvenida, María! Aquí puedes seguir el progreso de tu proyecto.' },
    login: { email: 'maria@fashionco.pe', password: '1234' },
    features: { messages: true, payments: true, documents: true, approvals: true, agenda: true },
    stats: { visits: 12, last_login: '2026-04-26' },
  },
  {
    id: 'pt2', company_id: 'co2', company: 'TechPe', active: true,
    subdomain: 'techpe', custom_domain: '',
    created_at: '2026-04-10',
    branding: { primary: '#2563eb', secondary: '#60a5fa', logo: null, company_name: 'TechPe', welcome: 'Bienvenido al portal de TechPe.' },
    login: { email: 'luis@techpe.com', password: '5678' },
    features: { messages: true, payments: true, documents: true, approvals: false, agenda: true },
    stats: { visits: 5, last_login: '2026-04-25' },
  },
]

function PortalEditor({ portal, onUpdate, onClose }) {
  const logoRef = useRef()
  const { companies } = useStore()

  const FEATURES = [
    { key: 'messages', label: 'Mensajes', desc: 'El cliente puede chatear contigo' },
    { key: 'payments', label: 'Pagos', desc: 'Ver estado de pagos y métodos' },
    { key: 'documents', label: 'Documentos', desc: 'Ver sus archivos y facturas' },
    { key: 'approvals', label: 'Aprobaciones', desc: 'Aprobar fases del proyecto' },
    { key: 'agenda', label: 'Agenda', desc: 'Agendar reuniones directamente' },
    { key: 'proposals', label: 'Propuestas', desc: 'Ver y aceptar propuestas' },
  ]

  const portalUrl = portal.custom_domain
    ? `https://${portal.custom_domain}`
    : `https://${portal.subdomain}.nithrox.com`

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-tight">{portal.company} — Portal</h2>
            <p className="text-[10px] text-muted-foreground font-mono">{portalUrl}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={portalUrl} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-full hover:bg-accent uppercase tracking-wider">
              <ExternalLink className="w-3.5 h-3.5" /> Abrir portal
            </button>
          </a>
          <button onClick={() => { navigator.clipboard?.writeText(portalUrl); toast.success('Link copiado') }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-full hover:bg-accent uppercase tracking-wider">
            <Copy className="w-3.5 h-3.5" /> Copiar link
          </button>
          <button onClick={() => { onUpdate({ active: !portal.active }); toast.success(portal.active ? 'Portal desactivado' : 'Portal activado') }}
            className={`px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider ${portal.active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-muted text-muted-foreground border border-border hover:bg-accent'}`}>
            {portal.active ? '● Activo' : 'Activar'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — config */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Branding */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">BRANDING DEL PORTAL</h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Logo del cliente</label>
              <div className="flex items-center gap-3">
                {portal.branding?.logo ? (
                  <img src={portal.branding.logo} alt="logo" className="h-12 object-contain border border-border rounded-xl p-1" />
                ) : (
                  <div className="w-16 h-12 border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground">
                    <Image className="w-5 h-5" />
                  </div>
                )}
                <button onClick={() => logoRef.current?.click()}
                  className="text-xs font-bold border border-border rounded-xl px-3 py-2 hover:bg-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" /> {portal.branding?.logo ? 'Cambiar' : 'Subir logo'}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return
                  const reader = new FileReader()
                  reader.onload = ev => onUpdate({ branding: { ...portal.branding, logo: ev.target.result } })
                  reader.readAsDataURL(f)
                }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nombre que ve el cliente</label>
              <input value={portal.branding?.company_name || ''} onChange={e => onUpdate({ branding: { ...portal.branding, company_name: e.target.value } })}
                placeholder="Fashion Co." className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mensaje de bienvenida</label>
              <textarea value={portal.branding?.welcome || ''} onChange={e => onUpdate({ branding: { ...portal.branding, welcome: e.target.value } })}
                placeholder="¡Bienvenida! Aquí puedes seguir el avance de tu proyecto..."
                rows={2} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'primary', label: 'Color primario' },
                { key: 'secondary', label: 'Color secundario' },
              ].map(col => (
                <div key={col.key} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                  <input type="color" value={portal.branding?.[col.key] || '#18181b'}
                    onChange={e => onUpdate({ branding: { ...portal.branding, [col.key]: e.target.value } })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5 bg-transparent" />
                  <div>
                    <p className="text-[10px] font-bold">{col.label}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{portal.branding?.[col.key] || '#18181b'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Access */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ACCESO DEL CLIENTE</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email de acceso</label>
                <input value={portal.login?.email || ''} onChange={e => onUpdate({ login: { ...portal.login, email: e.target.value } })}
                  placeholder="cliente@empresa.pe" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contraseña</label>
                <input value={portal.login?.password || ''} onChange={e => onUpdate({ login: { ...portal.login, password: e.target.value } })}
                  type="password" placeholder="••••••••" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
              </div>
            </div>
          </section>

          {/* Domain */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">DOMINIO</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subdominio Nithrox</label>
              <div className="flex items-center gap-2 border border-border rounded-xl overflow-hidden">
                <input value={portal.subdomain || ''} onChange={e => onUpdate({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="fashionco" className="flex-1 px-3 py-2 text-sm bg-background outline-none" />
                <span className="text-xs text-muted-foreground px-3 bg-muted/30 py-2 border-l border-border shrink-0">.nithrox.com</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dominio personalizado (opcional)</label>
              <input value={portal.custom_domain || ''} onChange={e => onUpdate({ custom_domain: e.target.value })}
                placeholder="portal.fashionco.pe" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
              <p className="text-[10px] text-muted-foreground">Apunta un CNAME a portals.nithrox.com en tu DNS</p>
            </div>
          </section>

          {/* Features */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SECCIONES DISPONIBLES</h3>
            <div className="space-y-2">
              {FEATURES.map(f => (
                <label key={f.key} className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:border-foreground/20 transition-colors">
                  <div>
                    <p className="text-sm font-bold">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                  <div onClick={() => onUpdate({ features: { ...portal.features, [f.key]: !portal.features?.[f.key] } })}
                    className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ml-4 ${portal.features?.[f.key] ? 'bg-foreground' : 'bg-muted'}`}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: portal.features?.[f.key] ? '22px' : '2px' }} />
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT — preview */}
        <div className="w-80 border-l border-border shrink-0 flex flex-col">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">VISTA PREVIA</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Mini browser mockup */}
            <div className="border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted/30">
                {['bg-red-400','bg-yellow-400','bg-green-400'].map(c => <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}
                <div className="flex-1 mx-2 bg-background border border-border rounded px-2 py-0.5 text-[9px] text-muted-foreground font-mono truncate">
                  {portal.custom_domain || `${portal.subdomain || 'cliente'}.nithrox.com`}
                </div>
              </div>
              {/* Portal preview */}
              <div className="text-[10px]" style={{ fontFamily: "'Geist Mono', monospace" }}>
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: `linear-gradient(135deg, ${portal.branding?.primary || '#18181b'}, ${portal.branding?.secondary || '#3b82f6'})` }}>
                  {portal.branding?.logo
                    ? <img src={portal.branding.logo} alt="logo" className="h-5 object-contain" />
                    : <p className="text-white font-black tracking-widest text-[9px]">{portal.branding?.company_name || 'PORTAL'}</p>
                  }
                </div>
                {/* Welcome */}
                <div className="px-3 py-3 bg-white border-b border-zinc-100">
                  <p className="text-zinc-900 font-bold text-[9px]">Bienvenido</p>
                  <p className="text-zinc-400 text-[8px] mt-0.5 leading-tight">{portal.branding?.welcome?.slice(0, 60) || '...'}</p>
                </div>
                {/* Nav items */}
                <div className="bg-zinc-50 px-2 py-2 space-y-1">
                  {[
                    ['⚡', 'Dashboard'],
                    portal.features?.payments && ['💳', 'Pagos'],
                    portal.features?.documents && ['📄', 'Documentos'],
                    portal.features?.messages && ['💬', 'Mensajes'],
                    portal.features?.agenda && ['📅', 'Agenda'],
                  ].filter(Boolean).map(([icon, label]) => (
                    <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white border border-zinc-100">
                      <span className="text-[10px]">{icon}</span>
                      <span className="text-zinc-600 text-[9px] font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 space-y-2">
              <div className="bg-background border border-border rounded-xl p-3">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">ESTADÍSTICAS</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div><p className="text-[9px] text-muted-foreground">Visitas</p><p className="text-sm font-bold">{portal.stats?.visits || 0}</p></div>
                  <div><p className="text-[9px] text-muted-foreground">Último acceso</p><p className="text-[10px] font-bold">{portal.stats?.last_login || '—'}</p></div>
                </div>
              </div>

              {/* Credentials */}
              <div className="bg-background border border-border rounded-xl p-3 space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">CREDENCIALES DEL CLIENTE</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Email</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono">{portal.login?.email || '—'}</span>
                      <button onClick={() => { navigator.clipboard?.writeText(portal.login?.email || ''); toast.success('Email copiado') }}><Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Contraseña</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono">{portal.login?.password || '—'}</span>
                      <button onClick={() => { navigator.clipboard?.writeText(portal.login?.password || ''); toast.success('Contraseña copiada') }}><Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PortalsPage() {
  const { companies } = useStore()
  const [portals, setPortals] = useState(DEMO_PORTALS)
  const [editing, setEditing] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [nf, setNf] = useState({ company_id: '' })

  const updatePortal = (id, data) => setPortals(p => p.map(x => x.id === id ? { ...x, ...data } : x))

  const createPortal = () => {
    const co = companies.find(c => c.id === nf.company_id)
    if (!co) return
    const newPortal = {
      id: `pt${Date.now()}`, company_id: co.id, company: co.name, active: false,
      subdomain: co.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20),
      custom_domain: '', created_at: new Date().toLocaleDateString('es-PE'),
      branding: { primary: '#18181b', secondary: '#3b82f6', logo: null, company_name: co.name, welcome: `¡Bienvenido al portal de ${co.name}!` },
      login: { email: '', password: Math.random().toString(36).slice(-8) },
      features: { messages: true, payments: true, documents: true, approvals: true, agenda: true },
      stats: { visits: 0, last_login: null },
    }
    setPortals(p => [newPortal, ...p])
    setEditing(newPortal)
    setShowNew(false)
    toast.success('Portal creado')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="PORTALES DE CLIENTES" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nuevo portal
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'PORTALES ACTIVOS', v: portals.filter(p => p.active).length, c: 'text-green-600' },
            { l: 'TOTAL PORTALES', v: portals.length },
            { l: 'TOTAL VISITAS', v: portals.reduce((s, p) => s + (p.stats?.visits || 0), 0) },
          ].map(s => (
            <div key={s.l} className="bg-background border border-border rounded-xl p-4">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
              <p className={`text-2xl font-bold mt-1 ${s.c || ''}`}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Portal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portals.map(portal => {
            const url = portal.custom_domain ? `https://${portal.custom_domain}` : `https://${portal.subdomain}.nithrox.com`
            return (
              <div key={portal.id} className="bg-background border border-border rounded-2xl overflow-hidden hover:shadow-sm hover:border-foreground/20 transition-all">
                {/* Color header */}
                <div className="h-14 relative" style={{ background: `linear-gradient(135deg, ${portal.branding?.primary || '#18181b'}, ${portal.branding?.secondary || '#3b82f6'})` }}>
                  <div className="flex items-center justify-between px-4 h-full">
                    {portal.branding?.logo
                      ? <img src={portal.branding.logo} alt="logo" className="h-8 object-contain" />
                      : <p className="text-white font-black tracking-widest text-xs">{portal.branding?.company_name || portal.company}</p>
                    }
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${portal.active ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white'}`}>
                      {portal.active ? '● ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-sm font-bold">{portal.company}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{portal.subdomain}.nithrox.com</p>
                    {portal.custom_domain && <p className="text-[10px] text-primary font-mono">{portal.custom_domain}</p>}
                  </div>

                  {/* Feature badges */}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(portal.features || {}).filter(([, v]) => v).map(([k]) => (
                      <span key={k} className="text-[8px] bg-muted px-1.5 py-0.5 rounded font-bold uppercase">{k}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{portal.stats?.visits || 0} visitas</span>
                    <span>Acceso: {portal.stats?.last_login || 'Nunca'}</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setEditing(portal)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-xl text-[10px] font-bold hover:bg-accent uppercase tracking-wider">
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <button className="w-full flex items-center justify-center gap-1.5 py-2 border border-border rounded-xl text-[10px] font-bold hover:bg-accent uppercase tracking-wider">
                        <ExternalLink className="w-3 h-3" /> Abrir
                      </button>
                    </a>
                    <button onClick={() => { navigator.clipboard?.writeText(url); toast.success('Link copiado') }}
                      className="py-2 px-3 border border-border rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setPortals(p => p.filter(x => x.id !== portal.id))}
                      className="py-2 px-3 border border-border rounded-xl hover:bg-accent text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Create new */}
          <button onClick={() => setShowNew(true)}
            className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-accent/20 transition-all">
            <Plus className="w-8 h-8 text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nuevo portal</p>
          </button>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-5">Nuevo portal de cliente</h3>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cliente *</label>
              <select value={nf.company_id} onChange={e => setNf(p => ({ ...p, company_id: e.target.value }))}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:border-primary">
                <option value="">Seleccionar cliente...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
              <button onClick={createPortal} disabled={!nf.company_id} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider disabled:opacity-40">
                Crear portal →
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <PortalEditor portal={editing} onUpdate={(data) => { const updated = { ...editing, ...data }; setEditing(updated); updatePortal(editing.id, data) }} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
