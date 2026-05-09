import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  ExternalLink, Globe, Shield, HardDrive, Terminal,
  RefreshCw, Plus, Trash2, Server, Wifi, ChevronRight,
  Building2, FolderKanban, Copy, Eye, EyeOff, Mail,
  AlertTriangle, CheckCircle2, FileText, Lock, Database,
  FolderOpen, Settings, BarChart2, Zap, Clock, ArrowRight,
  Pencil, X, Check
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────
function CopyField({ label, value, secret = false }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg">
        <code className="flex-1 text-xs font-mono truncate">{secret && !show ? '•'.repeat(16) : (value || '—')}</code>
        {secret && value && (
          <button onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground shrink-0">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
        {value && (
          <button onClick={() => { navigator.clipboard?.writeText(value); toast.success('Copiado') }}
            className="text-muted-foreground hover:text-foreground shrink-0">
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function ResourceBar({ label, value, color }) {
  const c = value > 80 ? 'bg-red-500' : value > 50 ? 'bg-yellow-500' : color || 'bg-green-500'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${c}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

// ── File Manager ─────────────────────────────────────────────
const DEMO_FILES = [
  { name: 'public_html', type: 'dir', size: '—', modified: '2026-04-20', perms: 'drwxr-xr-x' },
  { name: 'wp-content', type: 'dir', size: '—', modified: '2026-04-18', perms: 'drwxr-xr-x' },
  { name: 'logs', type: 'dir', size: '—', modified: '2026-04-27', perms: 'drwxr-xr-x' },
  { name: 'wp-config.php', type: 'file', size: '3.2 KB', modified: '2026-03-01', perms: '-rw-r--r--' },
  { name: '.htaccess', type: 'file', size: '1.1 KB', modified: '2026-04-10', perms: '-rw-r--r--' },
  { name: 'index.php', type: 'file', size: '0.4 KB', modified: '2026-03-01', perms: '-rw-r--r--' },
  { name: 'sitemap.xml', type: 'file', size: '12.3 KB', modified: '2026-04-22', perms: '-rw-r--r--' },
  { name: 'robots.txt', type: 'file', size: '0.2 KB', modified: '2026-03-01', perms: '-rw-r--r--' },
]

function FileManagerTab({ server }) {
  const [path, setPath] = useState('/home/u123456/public_html')
  const [selected, setSelected] = useState([])
  const uploadRef = useRef()

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => uploadRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Subir archivo
        </button>
        <input ref={uploadRef} type="file" multiple className="hidden" onChange={() => toast.success('Archivo subido')} />
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">
          <FolderOpen className="w-3.5 h-3.5" /> Nueva carpeta
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" /> Nuevo archivo
        </button>
        {selected.length > 0 && (
          <button onClick={() => { setSelected([]); toast.success('Eliminado') }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 uppercase tracking-wider">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar ({selected.length})
          </button>
        )}
        {server.cpanel_url && (
          <a href={server.cpanel_url} target="_blank" rel="noopener noreferrer" className="ml-auto">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">
              <ExternalLink className="w-3.5 h-3.5" /> Abrir en cPanel
            </button>
          </a>
        )}
      </div>

      {/* Path */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg">
        <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
        <code className="text-xs font-mono text-muted-foreground flex-1">{path}</code>
      </div>

      {/* File list */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="w-8 px-3 py-2"><input type="checkbox" onChange={e => setSelected(e.target.checked ? DEMO_FILES.map(f => f.name) : [])} /></th>
              {['NOMBRE', 'TIPO', 'TAMAÑO', 'MODIFICADO', 'PERMISOS', ''].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {DEMO_FILES.map(f => (
              <tr key={f.name} className="hover:bg-accent/30 transition-colors">
                <td className="px-3 py-2.5"><input type="checkbox" checked={selected.includes(f.name)} onChange={e => setSelected(p => e.target.checked ? [...p, f.name] : p.filter(x => x !== f.name))} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span>{f.type === 'dir' ? '📁' : '📄'}</span>
                    <span className="font-medium font-mono">{f.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{f.type === 'dir' ? 'Carpeta' : 'Archivo'}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{f.size}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{f.modified}</td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground text-[10px]">{f.perms}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Editar"><Pencil className="w-3 h-3" /></button>
                    <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Permisos"><Lock className="w-3 h-3" /></button>
                    <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors" title="Eliminar"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Databases tab ─────────────────────────────────────────────
const DEMO_DBS = [
  { name: 'u123456_nithrox_prod', user: 'u123456_admin', size: '48.2 MB', tables: 67, status: 'online' },
  { name: 'u123456_wp_fashionco', user: 'u123456_wp1', size: '12.8 MB', tables: 23, status: 'online' },
  { name: 'u123456_wp_techpe', user: 'u123456_wp2', size: '8.1 MB', tables: 23, status: 'online' },
]

function DatabasesTab({ server }) {
  const [showNew, setShowNew] = useState(false)
  const [ndb, setNdb] = useState({ name: '', user: '', password: '' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-3 flex-1 mr-4">
          {[
            { l: 'Bases de datos', v: DEMO_DBS.length },
            { l: 'Espacio total', v: '69.1 MB' },
            { l: 'Estado', v: 'Online' },
          ].map(s => (
            <div key={s.l} className="bg-background border border-border rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
              <p className="text-lg font-bold mt-0.5">{s.v}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 uppercase tracking-wider shrink-0">
          <Plus className="w-3.5 h-3.5" /> Nueva DB
        </button>
      </div>

      {showNew && (
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest">Nueva base de datos</p>
          <div className="grid grid-cols-3 gap-3">
            {[{ k:'name',l:'Nombre DB',pl:'mi_base_datos'},{k:'user',l:'Usuario',pl:'mi_usuario'},{k:'password',l:'Contraseña',pl:'••••••••'}].map(f=>(
              <div key={f.k} className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{f.l}</label>
                <input type={f.k==='password'?'password':'text'} value={ndb[f.k]} onChange={e=>setNdb(p=>({...p,[f.k]:e.target.value}))} placeholder={f.pl}
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-background outline-none focus:border-primary"/>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setShowNew(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent">Cancelar</button>
            <button onClick={()=>{toast.success('Base de datos creada');setShowNew(false)}} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-wider">Crear</button>
          </div>
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-muted/20">
            {['BASE DE DATOS','USUARIO','TAMAÑO','TABLAS','ESTADO',''].map(h=><th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {DEMO_DBS.map(db=>(
              <tr key={db.name} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Database className="w-3.5 h-3.5 text-muted-foreground"/><code className="font-mono text-xs">{db.name}</code></div></td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{db.user}</td>
                <td className="px-4 py-3 text-muted-foreground">{db.size}</td>
                <td className="px-4 py-3 font-bold">{db.tables}</td>
                <td className="px-4 py-3"><span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">{db.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={()=>toast.info('phpMyAdmin — abre en tu cPanel')} className="p-1.5 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground text-[10px] font-bold px-2.5">phpMyAdmin</button>
                    <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── DNS Records tab ───────────────────────────────────────────
const DEMO_DNS = [
  { type: 'A',     name: '@',          value: '45.67.89.100',         ttl: '14400', editable: true },
  { type: 'A',     name: 'www',        value: '45.67.89.100',         ttl: '14400', editable: true },
  { type: 'CNAME', name: 'mail',       value: 'mail.dominio.pe',      ttl: '14400', editable: true },
  { type: 'MX',    name: '@',          value: '10 mail.dominio.pe',   ttl: '14400', editable: true },
  { type: 'TXT',   name: '@',          value: 'v=spf1 +a +mx ~all',  ttl: '3600',  editable: true },
  { type: 'TXT',   name: '_dmarc',     value: 'v=DMARC1; p=none',    ttl: '3600',  editable: false },
  { type: 'NS',    name: '@',          value: 'ns1.servidor.pe',      ttl: '86400', editable: false },
  { type: 'NS',    name: '@',          value: 'ns2.servidor.pe',      ttl: '86400', editable: false },
]

const DNS_COLORS = { A:'#3b82f6', CNAME:'#8b5cf6', MX:'#f59e0b', TXT:'#10b981', NS:'#64748b', AAAA:'#ec4899' }

function DNSTab() {
  const [records, setRecords] = useState(DEMO_DNS)
  const [showNew, setShowNew] = useState(false)
  const [nr, setNr] = useState({ type:'A', name:'', value:'', ttl:'14400' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold">Registros DNS</p>
          <p className="text-[10px] text-muted-foreground">Los cambios pueden tardar hasta 48h en propagarse</p>
        </div>
        <button onClick={()=>setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5"/> Agregar registro
        </button>
      </div>

      {showNew && (
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest">Nuevo registro DNS</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</label>
              <select value={nr.type} onChange={e=>setNr(p=>({...p,type:e.target.value}))} className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none focus:border-primary">
                {['A','AAAA','CNAME','MX','TXT','NS','SRV'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nombre</label>
              <input value={nr.name} onChange={e=>setNr(p=>({...p,name:e.target.value}))} placeholder="@ o subdominio" className="w-full border border-border rounded-lg px-2 py-1.5 text-xs font-mono bg-background outline-none focus:border-primary"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valor</label>
              <input value={nr.value} onChange={e=>setNr(p=>({...p,value:e.target.value}))} placeholder="IP o destino" className="w-full border border-border rounded-lg px-2 py-1.5 text-xs font-mono bg-background outline-none focus:border-primary"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">TTL</label>
              <select value={nr.ttl} onChange={e=>setNr(p=>({...p,ttl:e.target.value}))} className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none focus:border-primary">
                {[['3600','1h'],['14400','4h'],['86400','24h']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setShowNew(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent">Cancelar</button>
            <button onClick={()=>{if(nr.name&&nr.value){setRecords(p=>[...p,{...nr,editable:true}]);setShowNew(false);toast.success('Registro DNS agregado')}}} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-bold">Guardar</button>
          </div>
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-muted/20">
            {['TIPO','NOMBRE','VALOR','TTL',''].map(h=><th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {records.map((r,i)=>(
              <tr key={i} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-2.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded text-white" style={{backgroundColor:DNS_COLORS[r.type]||'#64748b'}}>{r.type}</span>
                </td>
                <td className="px-4 py-2.5 font-mono">{r.name}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground max-w-xs truncate">{r.value}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.ttl}s</td>
                <td className="px-4 py-2.5">
                  {r.editable && <button onClick={()=>{setRecords(p=>p.filter((_,j)=>j!==i));toast.success('Registro eliminado')}} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── SSL tab ───────────────────────────────────────────────────
function SSLTab({ server }) {
  const domains = ['nithrox.com','www.nithrox.com','fashionco.pe','www.fashionco.pe','app.techpe.com']
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          {l:'Certificados activos',v:domains.filter((_,i)=>i<3).length,c:'text-green-600'},
          {l:'Próximos a vencer',v:1,c:'text-amber-600'},
          {l:'Vencidos',v:0,c:'text-zinc-400'},
        ].map(s=>(
          <div key={s.l} className="bg-background border border-border rounded-xl p-4 text-center">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
            <p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {domains.map((d,i)=>{
          const ok = i < 3; const warn = i === 2
          return (
            <div key={d} className={`flex items-center gap-4 px-4 py-3.5 border rounded-xl transition-colors ${warn?'border-amber-200 bg-amber-50 dark:bg-amber-950/20':ok?'border-green-200 bg-green-50 dark:bg-green-950/20':'border-border bg-background'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ok?warn?'bg-amber-100':'bg-green-100':'bg-muted'}`}>
                <Shield className={`w-4 h-4 ${ok?warn?'text-amber-600':'text-green-600':'text-muted-foreground'}`}/>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold font-mono">{d}</p>
                <p className="text-[10px] text-muted-foreground">Let's Encrypt · {ok?warn?'Vence en 8 días':'Válido hasta Abr 2027':'Sin certificado'}</p>
              </div>
              {ok && !warn && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">✓ HTTPS ACTIVO</span>}
              {warn && <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold animate-pulse">⚠ POR VENCER</span>}
              {!ok && <button className="text-xs font-bold text-primary hover:underline">Instalar SSL</button>}
              {ok && <button onClick={()=>toast.success('SSL renovado correctamente')} className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1 hover:bg-accent">Renovar</button>}
            </div>
          )
        })}
      </div>

      <div className="bg-background border border-border rounded-xl p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest">Instalar nuevo certificado SSL</p>
        <div className="space-y-2">
          <input placeholder="dominio.com" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background font-mono"/>
          <button onClick={()=>toast.success('Certificado SSL instalado correctamente')} className="w-full py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-green-700">
            Instalar Let's Encrypt gratuito
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Email accounts tab ────────────────────────────────────────
const DEMO_EMAILS = [
  { email: 'admin@nithrox.com', quota_used: 240, quota_total: 1024, messages: 1847 },
  { email: 'hola@nithrox.com', quota_used: 80, quota_total: 512, messages: 523 },
  { email: 'facturas@nithrox.com', quota_used: 320, quota_total: 1024, messages: 2341 },
]

function EmailTab() {
  const [showNew, setShowNew] = useState(false)
  const [ne, setNe] = useState({ email:'', password:'', quota:'512' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold">{DEMO_EMAILS.length} cuentas de correo</p>
          <p className="text-[10px] text-muted-foreground">Correos asociados a tu dominio</p>
        </div>
        <button onClick={()=>setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5"/> Nueva cuenta
        </button>
      </div>

      {showNew && (
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[{k:'email',l:'Email',pl:'soporte@dominio.pe'},{k:'password',l:'Contraseña',pl:'••••••••'},{k:'quota',l:'Cuota (MB)',pl:'512'}].map(f=>(
              <div key={f.k} className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{f.l}</label>
                <input type={f.k==='password'?'password':'text'} value={ne[f.k]} onChange={e=>setNe(p=>({...p,[f.k]:e.target.value}))} placeholder={f.pl}
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none focus:border-primary font-mono"/>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setShowNew(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent">Cancelar</button>
            <button onClick={()=>{toast.success('Cuenta creada');setShowNew(false)}} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-bold">Crear</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {DEMO_EMAILS.map(em=>{
          const pct = Math.round((em.quota_used/em.quota_total)*100)
          return (
            <div key={em.email} className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono">{em.email}</p>
                    <p className="text-[10px] text-muted-foreground">{em.messages.toLocaleString()} mensajes</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={()=>toast.info('Abre Webmail en una nueva pestaña')} className="px-2.5 py-1 text-[10px] font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">Webmail</button>
                  <button className="px-2.5 py-1 text-[10px] font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">Config IMAP</button>
                  <button className="p-1.5 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Almacenamiento</span>
                  <span>{em.quota_used} MB / {em.quota_total} MB ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct>80?'bg-red-500':pct>60?'bg-yellow-500':'bg-primary'}`} style={{width:`${pct}%`}}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Error Logs tab ────────────────────────────────────────────
const DEMO_LOGS = [
  { ts:'2026-04-27 13:45:21', level:'ERROR', msg:'PHP Fatal error: Allowed memory size exhausted', file:'/public_html/wp-content/plugins/woocommerce/includes/class-wc.php:847' },
  { ts:'2026-04-27 11:22:08', level:'WARN', msg:'WordPress database error: Table does not exist', file:'/public_html/wp-includes/class-wpdb.php:2234' },
  { ts:'2026-04-27 09:15:44', level:'ERROR', msg:'cURL error 28: Connection timed out', file:'/public_html/wp-cron.php:52' },
  { ts:'2026-04-26 22:01:33', level:'WARN', msg:'Deprecated: Function wp_make_content_images_responsive', file:'/public_html/wp-includes/media.php:1198' },
  { ts:'2026-04-26 18:45:12', level:'INFO', msg:'Plugin activated: WooCommerce 8.5.2', file:'/public_html/wp-admin/plugins.php:200' },
  { ts:'2026-04-26 14:22:05', level:'ERROR', msg:'404 Not Found: /wp-admin/admin-ajax.php', file:'nginx/access.log' },
]

function LogsTab() {
  const [filter, setFilter] = useState('ALL')
  const filtered = filter==='ALL' ? DEMO_LOGS : DEMO_LOGS.filter(l=>l.level===filter)
  const LEVEL_COLORS = { ERROR:'text-red-600 bg-red-50', WARN:'text-amber-600 bg-amber-50', INFO:'text-blue-600 bg-blue-50' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['ALL','ERROR','WARN','INFO'].map(l=>(
            <button key={l} onClick={()=>setFilter(l)}
              className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border transition-colors ${filter===l?'bg-foreground text-background border-foreground':'border-border text-muted-foreground hover:text-foreground'}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={()=>toast.info('Descargando error.log...')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5"/> Descargar log
        </button>
      </div>

      <div className="bg-zinc-950 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ERROR LOG — /logs/error.log</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            <span className="text-[10px] text-zinc-500">En vivo</span>
          </div>
        </div>
        <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
          {filtered.map((log,i)=>(
            <div key={i} className="px-4 py-3 hover:bg-zinc-900 transition-colors">
              <div className="flex items-start gap-3">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${LEVEL_COLORS[log.level]}`}>{log.level}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 font-mono leading-relaxed">{log.msg}</p>
                  <p className="text-[10px] text-zinc-600 font-mono mt-0.5 truncate">{log.file}</p>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono shrink-0">{log.ts.split(' ')[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {l:'Errores hoy',v:DEMO_LOGS.filter(l=>l.level==='ERROR').length,c:'text-red-600'},
          {l:'Warnings hoy',v:DEMO_LOGS.filter(l=>l.level==='WARN').length,c:'text-amber-600'},
          {l:'Uptime',v:'99.8%',c:'text-green-600'},
        ].map(s=>(
          <div key={s.l} className="bg-background border border-border rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Access / Credentials tab ─────────────────────────────────
function AccessTab({ server, onUpdate }) {
  const [editField, setEditField] = useState(null)
  const [editVal, setEditVal] = useState('')
  const startEdit = (f) => { setEditField(f); setEditVal(server[f]||'') }
  const saveEdit = () => { onUpdate({[editField]:editVal}); setEditField(null); toast.success('Guardado') }

  const EditableRow = ({field,label,placeholder,secret=false}) => (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      {editField===field ? (
        <div className="flex gap-2">
          <input value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus type={secret?'password':'text'} placeholder={placeholder}
            onKeyDown={e=>{if(e.key==='Enter')saveEdit();if(e.key==='Escape')setEditField(null)}}
            className="flex-1 border border-primary rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none bg-background"/>
          <button onClick={saveEdit} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-lg font-bold">✓</button>
          <button onClick={()=>setEditField(null)} className="px-2 py-1 text-xs border border-border rounded-lg hover:bg-accent">✕</button>
        </div>
      ) : (
        <button onClick={()=>startEdit(field)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg hover:border-foreground/30 text-left group transition-colors">
          <code className="flex-1 text-xs font-mono truncate">{secret&&server[field]?'•'.repeat(16):server[field]||<span className="text-muted-foreground">{placeholder}</span>}</code>
          {server[field]&&<button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(server[field]);toast.success('Copiado')}} className="text-muted-foreground opacity-0 group-hover:opacity-100"><Copy className="w-3 h-3"/></button>}
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-5 max-w-lg">
      <div className="bg-background border border-border rounded-xl p-5 space-y-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">SSH / TERMINAL</p>
        <EditableRow field="ssh_host" label="Host" placeholder="ip o dominio"/>
        <EditableRow field="ssh_user" label="Usuario" placeholder="root"/>
        <EditableRow field="ssh_port" label="Puerto" placeholder="22"/>
        <EditableRow field="ssh_key" label="Password / Key" placeholder="••••••••" secret/>
        <button onClick={()=>toast.info('Web SSH terminal — próximamente')} className="w-full py-2.5 border border-border rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent flex items-center justify-center gap-2">
          <Terminal className="w-3.5 h-3.5"/> Abrir terminal web
        </button>
      </div>
      <div className="bg-background border border-border rounded-xl p-5 space-y-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">FTP / SFTP</p>
        <EditableRow field="ftp_host" label="Host FTP" placeholder="ftp.dominio.pe"/>
        <EditableRow field="ftp_user" label="Usuario" placeholder="ftpuser"/>
        <EditableRow field="ftp_pass" label="Password" placeholder="••••••••" secret/>
      </div>
      <div className="bg-background border border-border rounded-xl p-5 space-y-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">BASE DE DATOS PRINCIPAL</p>
        <EditableRow field="db_host" label="Host" placeholder="localhost"/>
        <EditableRow field="db_name" label="Nombre DB" placeholder="u123456_db"/>
        <EditableRow field="db_user" label="Usuario" placeholder="u123456_user"/>
        <EditableRow field="db_pass" label="Password" placeholder="••••••••" secret/>
      </div>
    </div>
  )
}

// ── Main ServerDetail ────────────────────────────────────────
export default function ServerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { servers, updateServer, companies, projects } = useStore()
  const [activeTab, setActiveTab] = useState('overview')

  const server = servers.find(s => s.id === id)
  if (!server) return (
    <div className="flex flex-col h-full">
      <Topbar title="SERVIDOR" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-3 text-sm">Servidor no encontrado</p>
          <button onClick={() => navigate('/servers')} className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent uppercase font-bold">← Servidores</button>
        </div>
      </div>
    </div>
  )

  const linkedCompanies = companies.filter(c => (server.clients || []).includes(c.id))
  const linkedProjects = projects.filter(p => p.server_id === server.id && !p._deleted)

  const TABS = [
    { id: 'overview',  label: 'OVERVIEW',          icon: BarChart2 },
    { id: 'files',     label: 'FILE MANAGER',       icon: FolderOpen },
    { id: 'databases', label: 'BASES DE DATOS',     icon: Database },
    { id: 'dns',       label: 'DNS',                icon: Globe },
    { id: 'ssl',       label: 'SSL',                icon: Shield },
    { id: 'email',     label: 'EMAIL',              icon: Mail },
    { id: 'logs',      label: 'LOGS',               icon: FileText },
    { id: 'access',    label: 'ACCESOS',            icon: Lock },
    { id: 'clients',   label: `CLIENTES (${linkedCompanies.length})`, icon: Building2 },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={server.name.toUpperCase()}
        actions={
          <div className="flex items-center gap-2">
            {server.cpanel_url && (
              <a href={server.cpanel_url} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-full hover:bg-accent uppercase tracking-wider">
                  <ExternalLink className="w-3.5 h-3.5"/> cPanel
                </button>
              </a>
            )}
            <button onClick={() => { updateServer(server.id, { cpu: Math.floor(Math.random()*40+10), ram: Math.floor(Math.random()*40+20), disk: Math.floor(Math.random()*20+15) }); toast.success('Métricas actualizadas') }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-full hover:bg-accent uppercase tracking-wider">
              <RefreshCw className="w-3.5 h-3.5"/> Refresh
            </button>
            <button onClick={() => navigate('/servers')} className="text-xs border border-border rounded-full px-3 py-1.5 hover:bg-accent font-bold uppercase tracking-wider">← Servidores</button>
          </div>
        }
      />

      {/* Status bar */}
      <div className={`px-5 py-2 border-b border-border flex items-center gap-3 shrink-0 text-xs font-bold uppercase tracking-wider ${server.status==='online'?'bg-green-50 dark:bg-green-950/20 text-green-700':'bg-yellow-50 text-yellow-700'}`}>
        <div className={`w-2 h-2 rounded-full ${server.status==='online'?'bg-green-500 animate-pulse':'bg-yellow-500'}`}/>
        {server.status==='online'?'● Online':'⚠ Mantenimiento'}
        <span className="text-[10px] opacity-60 font-mono">{server.ip}</span>
        {server.domain && <span className="text-[10px] opacity-60 font-mono">{server.domain}</span>}
        <span className="text-[10px] opacity-60">{server.provider} · {server.type}</span>
        {server.monthly_cost > 0 && <span className="text-[10px] opacity-60">${server.monthly_cost}/mo</span>}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-2 shrink-0 overflow-x-auto bg-background">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-[9px] font-bold border-b-2 transition-colors uppercase tracking-widest whitespace-nowrap ${activeTab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-background border border-border rounded-xl p-5 space-y-4">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">RECURSOS</p>
              <ResourceBar label="CPU" value={server.cpu||0} />
              <ResourceBar label="RAM" value={server.ram||0} color="bg-blue-500"/>
              <ResourceBar label="Disco" value={server.disk||0} color="bg-purple-500"/>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                {[{l:'SITIOS',v:linkedProjects.length||server.sites||0},{l:'CLIENTES',v:linkedCompanies.length},{l:'PLAN',v:server.plan||'Shared'}].map(s=>(
                  <div key={s.l} className="text-center"><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p><p className="text-lg font-bold mt-0.5">{s.v}</p></div>
                ))}
              </div>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 space-y-3">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">ACCESOS RÁPIDOS</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {l:'File Manager',icon:FolderOpen,tab:'files'},
                  {l:'Bases de datos',icon:Database,tab:'databases'},
                  {l:'DNS Records',icon:Globe,tab:'dns'},
                  {l:'SSL',icon:Shield,tab:'ssl'},
                  {l:'Email',icon:Mail,tab:'email'},
                  {l:'Error Logs',icon:FileText,tab:'logs'},
                ].map(a=>{
                  const Icon=a.icon
                  return(
                    <button key={a.l} onClick={()=>setActiveTab(a.tab)}
                      className="flex items-center gap-2.5 p-3 bg-muted/30 border border-border rounded-xl hover:border-foreground/30 hover:bg-accent/50 transition-all text-left">
                      <Icon className="w-4 h-4 text-muted-foreground"/>
                      <span className="text-xs font-bold">{a.l}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {linkedProjects.length > 0 && (
              <div className="bg-background border border-border rounded-xl p-5 lg:col-span-2">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">PROYECTOS EN ESTE SERVIDOR</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {linkedProjects.map(p=>(
                    <button key={p.id} onClick={()=>navigate(`/projects/${p.id}`)}
                      className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-xl hover:border-foreground/30 transition-all text-left group">
                      <FolderKanban className="w-4 h-4 text-muted-foreground group-hover:text-foreground"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.company}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground"/>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files'     && <FileManagerTab server={server} />}
        {activeTab === 'databases' && <DatabasesTab server={server} />}
        {activeTab === 'dns'       && <DNSTab />}
        {activeTab === 'ssl'       && <SSLTab server={server} />}
        {activeTab === 'email'     && <EmailTab />}
        {activeTab === 'logs'      && <LogsTab />}
        {activeTab === 'access'    && <AccessTab server={server} onUpdate={(data) => updateServer(server.id, data)} />}

        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedCompanies.length === 0 ? (
              <div className="col-span-2 border-2 border-dashed border-border rounded-2xl p-10 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sin clientes asociados</p>
              </div>
            ) : linkedCompanies.map(c => {
              const cProjects = linkedProjects.filter(p => p.company_id === c.id)
              const domain = cProjects.find(p => p.phases?.publication?.domain)?.phases?.publication?.domain || c.domain
              return (
                <div key={c.id} className="bg-background border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white" style={{backgroundColor:c.avatar_color}}>{c.name[0]}</div>
                    <div><p className="text-sm font-bold uppercase">{c.name}</p>{domain&&<p className="text-xs text-muted-foreground font-mono">{domain}</p>}</div>
                  </div>
                  {cProjects.length > 0 && (
                    <div className="space-y-1.5">
                      {cProjects.map(p=>(
                        <button key={p.id} onClick={()=>navigate(`/projects/${p.id}`)} className="flex items-center gap-2 w-full text-left hover:text-primary transition-colors">
                          <FolderKanban className="w-3.5 h-3.5 text-muted-foreground"/>
                          <span className="text-xs">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{p.phase}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={()=>navigate(`/clients/companies/${c.id}`)} className="flex-1 py-1.5 text-[10px] font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">Ver cliente</button>
                    {domain&&<a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="flex-1"><button className="w-full py-1.5 text-[10px] font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider flex items-center justify-center gap-1"><Globe className="w-3 h-3"/>Sitio</button></a>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
