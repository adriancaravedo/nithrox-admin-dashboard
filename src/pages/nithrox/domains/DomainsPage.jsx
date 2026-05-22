import { useState } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { Globe, Plus, Search, RefreshCw, Shield, AlertTriangle, Check, ChevronRight, ExternalLink, Clock } from 'lucide-react'

const STATUS = {
  active:   { label: 'Activo',    color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  expiring: { label: 'Por vencer', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  expired:  { label: 'Vencido',   color: 'bg-red-100 text-red-600',       dot: 'bg-red-500' },
  pending:  { label: 'Pendiente', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
}

const SAMPLE_DOMAINS = [
  { id: '1', domain: 'nithrox.com',        status: 'active',   expiry: '2026-03-15', registrar: 'Namecheap',         ssl: true,  autoRenew: true,  client: null,           ns: ['ns1.nithrox.com', 'ns2.nithrox.com'] },
  { id: '2', domain: 'tiendamax.pe',       status: 'active',   expiry: '2025-11-20', registrar: 'RealTimeRegister',  ssl: true,  autoRenew: false, client: 'Tienda Max',   ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'] },
  { id: '3', domain: 'coachmarco.com',     status: 'expiring', expiry: '2025-06-01', registrar: 'RealTimeRegister',  ssl: false, autoRenew: false, client: 'Marco Torres', ns: ['dns1.registrar-servers.com', 'dns2.registrar-servers.com'] },
  { id: '4', domain: 'consultoriaab.com',  status: 'expired',  expiry: '2025-04-10', registrar: 'RealTimeRegister',  ssl: false, autoRenew: false, client: 'AB Consultoría', ns: [] },
  { id: '5', domain: 'app.nithrox.io',     status: 'active',   expiry: '2026-08-22', registrar: 'Cloudflare',        ssl: true,  autoRenew: true,  client: null,           ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'] },
]

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DomainsPage() {
  const [domains, setDomains] = useState(SAMPLE_DOMAINS)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = domains.filter(d =>
    d.domain.includes(search.toLowerCase()) ||
    (d.client || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedDomain = domains.find(d => d.id === selected)

  const stats = {
    total: domains.length,
    active: domains.filter(d => d.status === 'active').length,
    expiring: domains.filter(d => d.status === 'expiring').length,
    expired: domains.filter(d => d.status === 'expired').length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="DOMINIOS" actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-full hover:bg-accent transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:bg-foreground/90 uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5" /> Registrar dominio
          </button>
        </div>
      } />

      <div className="flex-1 overflow-hidden p-4">
      <div className="h-full rounded-xl border border-border bg-background overflow-hidden shadow-sm flex">
        {/* List */}
        <div className="w-full lg:w-[420px] flex flex-col border-r border-border shrink-0">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-0 border-b border-border">
            {[
              { label: 'Total', value: stats.total, color: '' },
              { label: 'Activos', value: stats.active, color: 'text-green-600' },
              { label: 'Por vencer', value: stats.expiring, color: 'text-yellow-600' },
              { label: 'Vencidos', value: stats.expired, color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 border-r border-border last:border-0 text-center">
                <p className={`text-lg font-black ${color}`}>{value}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar dominio o cliente..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background outline-none focus:border-foreground" />
            </div>
          </div>

          {/* Domain list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.map(d => {
              const s = STATUS[d.status]
              const days = daysUntil(d.expiry)
              return (
                <button key={d.id} onClick={() => setSelected(selected === d.id ? null : d.id)}
                  className={`flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-accent/50 transition-colors ${selected === d.id ? 'bg-accent/70 border-l-2 border-l-foreground' : ''}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{d.domain}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {d.client ? `→ ${d.client}` : 'Nithrox'} · {d.registrar}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    <p className={`text-[10px] mt-0.5 ${days < 30 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                      {days > 0 ? `${days}d` : 'Vencido'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selectedDomain ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-lg">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black">{selectedDomain.domain}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedDomain.client ? `Asociado a ${selectedDomain.client}` : 'Dominio propio Nithrox'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS[selectedDomain.status].color}`}>
                  {STATUS[selectedDomain.status].label}
                </span>
              </div>

              <div className="space-y-3">
                {/* Info cards */}
                {[
                  { label: 'Registrador', value: selectedDomain.registrar, icon: Globe },
                  { label: 'Vencimiento', value: fmtDate(selectedDomain.expiry), icon: Clock, extra: daysUntil(selectedDomain.expiry) < 30 ? `(${daysUntil(selectedDomain.expiry)} días)` : null, warn: daysUntil(selectedDomain.expiry) < 30 },
                  { label: 'Auto-renovar', value: selectedDomain.autoRenew ? 'Activado' : 'Desactivado', icon: RefreshCw },
                  { label: 'SSL/HTTPS', value: selectedDomain.ssl ? 'Activo' : 'Sin SSL', icon: Shield, warn: !selectedDomain.ssl },
                ].map(({ label, value, icon: Icon, extra, warn }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-bold ${warn ? 'text-red-500' : ''}`}>{value}</span>
                      {extra && <span className="text-xs text-red-400">{extra}</span>}
                    </div>
                  </div>
                ))}

                {/* Nameservers */}
                <div className="px-4 py-3 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Nameservers</p>
                  {selectedDomain.ns.length > 0 ? (
                    <div className="space-y-1">
                      {selectedDomain.ns.map((ns, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500 shrink-0" />
                          <span className="text-xs font-mono">{ns}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-red-500">Sin nameservers configurados</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                {selectedDomain.status === 'expired' || selectedDomain.status === 'expiring' ? (
                  <button className="flex-1 py-2.5 text-sm font-bold bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors">
                    Renovar dominio
                  </button>
                ) : (
                  <button className="flex-1 py-2.5 text-sm font-bold border border-border rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Ir al panel
                  </button>
                )}
                <button className="flex-1 py-2.5 text-sm border border-border rounded-xl hover:bg-accent transition-colors">
                  Editar DNS
                </button>
              </div>

              {!selectedDomain.ssl && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">Este dominio no tiene SSL activo. El sitio web puede mostrarse como inseguro.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <Globe className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">Selecciona un dominio</p>
              <p className="text-xs text-muted-foreground mt-1">Integración con RealTimeRegister próximamente</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
