import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  Plus, ExternalLink, Globe, Shield, HardDrive,
  Server, Wifi, AlertTriangle, ChevronRight, Building2
} from 'lucide-react'

export default function ServersPage() {
  const { servers, addServer, companies, projects } = useStore()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'Shared', ip: '', plan: '', provider: 'Hostinger',
    monthly_cost: '', currency: 'USD', cpanel_url: '', domain: '',
    company_id: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = () => {
    if (!form.name || !form.ip) return
    addServer({
      ...form,
      status: 'online', cpu: 0, ram: 0, disk: 0, sites: 0,
      monthly_cost: parseFloat(form.monthly_cost) || 0,
      ssl_expiry: '', clients: form.company_id ? [form.company_id] : [],
    })
    setForm({ name: '', type: 'Shared', ip: '', plan: '', provider: 'Hostinger', monthly_cost: '', currency: 'USD', cpanel_url: '', domain: '', company_id: '' })
    setShowNew(false)
    toast.success('Servidor agregado')
  }

  // Group servers by client
  const serversWithCompany = servers.map(sv => {
    const linkedCompanies = companies.filter(c => (sv.clients || []).includes(c.id))
    const linkedProjects = projects.filter(p => p.server_id === sv.id && !p._deleted)
    return { ...sv, linkedCompanies, linkedProjects }
  })

  // Stats
  const totalMonthly = servers.reduce((s, sv) => s + (sv.monthly_cost || 0), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="SERVIDORES" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nuevo servidor
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: 'SERVIDORES', v: servers.length },
            { l: 'EN LÍNEA', v: servers.filter(s => s.status === 'online').length, color: 'text-green-600' },
            { l: 'CLIENTES', v: companies.filter(c => servers.some(s => (s.clients || []).includes(c.id))).length },
            { l: 'COSTO / MES', v: `$${totalMonthly}/mo` },
          ].map(s => (
            <div key={s.l} className="bg-background border border-border rounded-xl p-4">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
              <p className={`text-2xl font-bold mt-1 tabular-nums ${s.color || ''}`}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Server list — each card clickable to detail */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">TODOS LOS SERVIDORES</p>

          {serversWithCompany.map(sv => (
            <div key={sv.id}
              onClick={() => navigate(`/servers/${sv.id}`)}
              className="bg-background border border-border rounded-xl p-5 cursor-pointer hover:border-foreground/30 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Status indicator */}
                  <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${sv.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold uppercase tracking-tight">{sv.name}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sv.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {sv.status === 'online' ? '● ONLINE' : '⚠ OFFLINE'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{sv.ip}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{sv.type}</span>
                      <span>·</span>
                      <span>{sv.provider}</span>
                      {sv.plan && <><span>·</span><span>{sv.plan}</span></>}
                      {sv.monthly_cost > 0 && <><span>·</span><span className="font-bold">${sv.monthly_cost}/mo</span></>}
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                  {/* Linked clients */}
                  {sv.linkedCompanies.length > 0 && (
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">CLIENTES</p>
                      <div className="flex gap-1">
                        {sv.linkedCompanies.slice(0, 3).map(c => (
                          <div key={c.id} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ backgroundColor: c.avatar_color }} title={c.name}>
                            {c.name[0]}
                          </div>
                        ))}
                        {sv.linkedCompanies.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">
                            +{sv.linkedCompanies.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {sv.status === 'online' && (
                    <div className="hidden md:flex gap-4 text-xs">
                      {[{ l: 'CPU', v: sv.cpu }, { l: 'RAM', v: sv.ram }, { l: 'DISCO', v: sv.disk }].map(r => (
                        <div key={r.l} className="text-center">
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{r.l}</p>
                          <p className="font-bold tabular-nums">{r.v}%</p>
                          <div className="w-12 h-1 bg-muted rounded-full mt-1">
                            <div className={`h-full rounded-full ${r.v > 80 ? 'bg-red-500' : r.v > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${r.v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>

              {/* Projects */}
              {sv.linkedProjects.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">PROYECTOS:</p>
                  {sv.linkedProjects.map(p => (
                    <span key={p.id} className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium">{p.name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {servers.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
              <Server className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sin servidores</p>
              <p className="text-xs text-muted-foreground mt-1">Agrega tu primer servidor</p>
              <button onClick={() => setShowNew(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Agregar servidor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New server modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest">Nuevo servidor</h3>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: 'name', l: 'Nombre *', span: true, placeholder: 'VPS Principal Nithrox' },
                  { k: 'ip', l: 'IP *', placeholder: '45.67.89.100' },
                  { k: 'provider', l: 'Proveedor', placeholder: 'Hostinger' },
                  { k: 'plan', l: 'Plan', placeholder: '8GB RAM, 4 vCPU' },
                  { k: 'cpanel_url', l: 'URL cPanel', span: true, placeholder: 'https://ip:2083' },
                  { k: 'domain', l: 'Dominio', span: true, placeholder: 'server.nithrox.com' },
                  { k: 'monthly_cost', l: 'Costo mensual ($)', placeholder: '40' },
                ].map(f => (
                  <div key={f.k} className={`space-y-1 ${f.span ? 'col-span-2' : ''}`}>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{f.l}</label>
                    <input value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
                  </div>
                ))}

                {/* Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-primary">
                    {['Shared', 'VPS', 'Dedicado', 'Cloud'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Client */}
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cliente asociado</label>
                  <select value={form.company_id} onChange={e => set('company_id', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-primary">
                    <option value="">Sin cliente específico</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end px-6 pb-6">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.name || !form.ip}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-primary/90">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
