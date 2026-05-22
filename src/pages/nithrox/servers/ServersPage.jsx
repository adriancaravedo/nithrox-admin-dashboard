import { useState } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import { Plus, Search, Server, ExternalLink, Globe, HardDrive, Cpu, MemoryStick } from 'lucide-react'

export default function ServersPage() {
  const { servers, addServer, companies, projects } = useStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'Shared', ip: '', plan: '', provider: 'Hostinger',
    monthly_cost: '', currency: 'USD', cpanel_url: '', domain: '',
    company_id: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name || !form.ip) return
    try {
      const result = await addServer({
        name: form.name,
        type: form.type,
        ip: form.ip,
        plan: form.plan || null,
        provider: form.provider,
        domain: form.domain || null,
        cpanel_url: form.cpanel_url || null,
        monthly_cost: parseFloat(form.monthly_cost) || 0,
        currency: form.currency,
        status: 'online', cpu: 0, ram: 0, disk: 0, sites: 0,
        ssl_expiry: null,
        client_ids: form.company_id ? [form.company_id] : [],
      })
      if (!result) throw new Error('Sin respuesta del servidor')
      setForm({ name: '', type: 'Shared', ip: '', plan: '', provider: 'Hostinger', monthly_cost: '', currency: 'USD', cpanel_url: '', domain: '', company_id: '' })
      setShowNew(false)
      toast.success('Servidor agregado')
    } catch (err) {
      toast.error(err?.message || 'Error al crear servidor')
    }
  }

  const serversWithMeta = servers.map(sv => {
    const linkedCompanies = companies.filter(c => (sv.clients || []).includes(c.id))
    const linkedProjects = projects.filter(p => p.server_id === sv.id && !p._deleted)
    return { ...sv, linkedCompanies, linkedProjects }
  })

  const filtered = serversWithMeta.filter(sv =>
    sv.name.toLowerCase().includes(search.toLowerCase()) ||
    (sv.ip || '').includes(search) ||
    (sv.provider || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedServer = serversWithMeta.find(sv => sv.id === selected)

  const totalMonthly = servers.reduce((s, sv) => s + (sv.monthly_cost || 0), 0)
  const stats = {
    total: servers.length,
    online: servers.filter(s => s.status === 'online').length,
    offline: servers.filter(s => s.status !== 'online').length,
    cost: `$${totalMonthly}/mo`,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="SERVIDORES" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:bg-foreground/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nuevo servidor
        </button>
      } />

      <div className="flex-1 overflow-hidden p-4">
      <div className="h-full rounded-xl border border-border bg-background overflow-hidden shadow-sm flex">
        {/* Left panel */}
        <div className="w-[420px] shrink-0 flex flex-col border-r border-border">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-0 border-b border-border">
            {[
              { label: 'Total',     value: stats.total,   color: '' },
              { label: 'Online',    value: stats.online,  color: 'text-green-600' },
              { label: 'Offline',   value: stats.offline, color: 'text-yellow-600' },
              { label: 'Costo/mes', value: stats.cost,    color: '' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 border-r border-border last:border-0 text-center">
                <p className={`text-lg font-black truncate ${color}`}>{value}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar servidor, IP o proveedor..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background outline-none focus:border-foreground" />
            </div>
          </div>

          {/* Server list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.map(sv => (
              <button key={sv.id} onClick={() => setSelected(selected === sv.id ? null : sv.id)}
                className={`flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-accent/50 transition-colors ${selected === sv.id ? 'bg-accent/70 border-l-2 border-l-foreground' : ''}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${sv.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{sv.name}</p>
                  <p className="text-xs font-mono text-muted-foreground truncate">{sv.ip}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-[9px] text-muted-foreground">{sv.provider}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sv.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {sv.type}
                    </span>
                  </div>
                  {sv.monthly_cost > 0 && (
                    <p className="text-[10px] mt-0.5 text-muted-foreground">${sv.monthly_cost}/mo</p>
                  )}
                </div>
              </button>
            ))}

            {servers.length === 0 && (
              <div className="p-8 text-center">
                <Server className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-bold">Sin servidores</p>
                <p className="text-[10px] text-muted-foreground mt-1">Agrega tu primer servidor</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        {selectedServer ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-lg">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black">{selectedServer.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedServer.provider} · {selectedServer.type}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedServer.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selectedServer.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Info rows */}
              <div className="space-y-3">
                {[
                  { label: 'IP',         value: selectedServer.ip,           icon: Globe },
                  { label: 'Proveedor',  value: selectedServer.provider,     icon: Server },
                  { label: 'Plan',       value: selectedServer.plan || '—',  icon: HardDrive },
                  { label: 'Tipo',       value: selectedServer.type,         icon: Server },
                  { label: 'Costo/mes',  value: selectedServer.monthly_cost > 0 ? `$${selectedServer.monthly_cost}/mo` : '—', icon: Globe },
                  ...(selectedServer.cpanel_url ? [{ label: 'cPanel URL', value: selectedServer.cpanel_url, icon: Globe, mono: true }] : []),
                ].map(({ label, value, icon: Icon, mono }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <span className={`text-sm font-bold ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                  </div>
                ))}

                {/* Resources (only if online) */}
                {selectedServer.status === 'online' && (
                  <div className="px-4 py-3 bg-muted/30 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-3">Recursos</p>
                    <div className="space-y-2.5">
                      {[
                        { label: 'CPU',   value: selectedServer.cpu  || 0, Icon: Cpu },
                        { label: 'RAM',   value: selectedServer.ram  || 0, Icon: MemoryStick },
                        { label: 'Disco', value: selectedServer.disk || 0, Icon: HardDrive },
                      ].map(({ label, value, Icon }) => (
                        <div key={label} className="flex items-center gap-3">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground w-10 shrink-0">{label}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${value > 80 ? 'bg-red-500' : value > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${value}%` }} />
                          </div>
                          <span className="text-xs font-bold tabular-nums w-8 text-right">{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked clients */}
                {selectedServer.linkedCompanies.length > 0 && (
                  <div className="px-4 py-3 bg-muted/30 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Clientes vinculados</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedServer.linkedCompanies.map(c => (
                        <div key={c.id} className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ backgroundColor: c.avatar_color }} title={c.name}>
                            {c.name[0]}
                          </div>
                          <span className="text-xs">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked projects */}
                {selectedServer.linkedProjects.length > 0 && (
                  <div className="px-4 py-3 bg-muted/30 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Proyectos vinculados</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {selectedServer.linkedProjects.map(p => (
                        <span key={p.id} className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium">{p.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                {selectedServer.cpanel_url && (
                  <a href={selectedServer.cpanel_url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2.5 text-sm font-bold border border-border rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Abrir cPanel
                  </a>
                )}
                <button className="flex-1 py-2.5 text-sm border border-border rounded-xl hover:bg-accent transition-colors">
                  Editar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <Server className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">Selecciona un servidor</p>
              <p className="text-xs text-muted-foreground mt-1">Ver detalles, recursos y proyectos vinculados</p>
            </div>
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
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-foreground bg-background" />
                  </div>
                ))}

                {/* Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-foreground">
                    {['Shared', 'VPS', 'Dedicado', 'Cloud'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Client */}
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cliente asociado</label>
                  <select value={form.company_id} onChange={e => set('company_id', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-foreground">
                    <option value="">Sin cliente específico</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end px-6 pb-6">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.name || !form.ip}
                className="px-4 py-2 text-sm bg-foreground text-background rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-foreground/90">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
