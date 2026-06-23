import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Server, Globe, ExternalLink, Loader2, CheckCircle2, Clock } from 'lucide-react'

export default function PortalHosting() {
  const { profile, user } = useAuth()
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Find hosting linked to this client's email
        const email = profile?.email || user?.email
        if (!email) { setLoading(false); return }

        const { data } = await supabase
          .from('servers')
          .select('*')
          .eq('client_email', email)
          .order('created_at', { ascending: false })

        setServers(data || [])
      } catch (err) {
        console.error('Portal hosting load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile?.email, user?.email])

  const statusColor = (status) => {
    if (status === 'online') return 'bg-green-100 text-green-700'
    if (status === 'offline') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Server className="w-5 h-5 text-zinc-700" />
          <h1 className="text-lg font-bold text-zinc-900">Mi Hosting</h1>
        </div>
        <p className="text-xs text-zinc-500">Accede y administra tu hosting web desde aquí.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      )}

      {!loading && servers.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
          <Server className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">No tienes hosting activo aún</p>
          <p className="text-xs text-zinc-400 mt-1">
            Cuando actives tu plan Kit Digital, tu hosting aparecerá aquí automáticamente.
          </p>
        </div>
      )}

      {!loading && servers.length > 0 && (
        <div className="space-y-4">
          {servers.map(server => (
            <div key={server.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-zinc-900 text-sm">{server.name}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor(server.status)}`}>
                      {server.status === 'online' ? 'Activo' : server.status === 'offline' ? 'Inactivo' : 'Pendiente'}
                    </span>
                  </div>
                  {server.domain && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{server.domain}</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Proveedor</p>
                  <p className="text-xs font-bold text-zinc-800">{server.provider || '20i'}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Plan</p>
                  <p className="text-xs font-bold text-zinc-800">{server.plan || 'Shared'}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Tipo</p>
                  <p className="text-xs font-bold text-zinc-800">{server.type || 'Shared'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {server.cpanel_url && (
                  <a
                    href={server.cpanel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Acceder al panel
                  </a>
                )}
                {server.domain && (
                  <a
                    href={`https://${server.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-all"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Ver sitio web
                  </a>
                )}
              </div>

              {/* SSL / provisioning note */}
              {server.status !== 'online' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Tu hosting está siendo configurado. Puede tomar hasta 30 minutos.</span>
                </div>
              )}

              {server.status === 'online' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Hosting activo y funcionando correctamente.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
