import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Server, Globe, ExternalLink, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function PortalHosting() {
  const { profile, user } = useAuth()
  const [hosting, setHosting] = useState([]) // array of { server, order }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const email = profile?.email || user?.email
        if (!email) { setLoading(false); return }

        // 1. Find active Kit Digital orders for this client
        const { data: orders } = await supabase
          .from('orders')
          .select('id, plan_id, status, items, created_at')
          .eq('client_email', email)
          .in('plan_id', ['kit-digital', 'kit_digital'])
          .in('status', ['active', 'paid', 'trialing'])
          .order('created_at', { ascending: false })

        if (!orders?.length) { setLoading(false); return }

        const results = []
        for (const order of orders) {
          const serverId = order.items?.server_id
          let server = null

          if (serverId) {
            const { data: sv } = await supabase
              .from('servers')
              .select('*')
              .eq('id', serverId)
              .single()
            server = sv
          } else {
            // Try by client_email if column exists
            const { data: sv } = await supabase
              .from('servers')
              .select('*')
              .eq('client_email', email)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            server = sv
          }

          results.push({ order, server })
        }

        setHosting(results)
      } catch (err) {
        console.error('Portal hosting load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile?.email, user?.email])

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

      {!loading && hosting.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
          <Server className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">No tienes hosting activo aún</p>
          <p className="text-xs text-zinc-400 mt-1">
            Cuando actives tu plan Kit Digital, tu hosting aparecerá aquí automáticamente.
          </p>
        </div>
      )}

      {!loading && hosting.length > 0 && (
        <div className="space-y-4">
          {hosting.map(({ order, server }, i) => (
            <HostingCard key={order.id || i} order={order} server={server} />
          ))}
        </div>
      )}
    </div>
  )
}

function HostingCard({ order, server }) {
  const domain = server?.domain || order?.items?.hosting_domain || order?.items?.domain?.full || order?.items?.domain || null
  const isProvisioning = !server || server.status === 'pending'
  const isOnline = server?.status === 'online'

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-zinc-900 text-sm">
              {server?.name || `Kit Digital Hosting`}
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isOnline ? 'bg-green-100 text-green-700'
              : isProvisioning ? 'bg-amber-100 text-amber-700'
              : 'bg-zinc-100 text-zinc-500'
            }`}>
              {isOnline ? 'Activo' : 'Configurando...'}
            </span>
          </div>
          {domain && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Globe className="w-3.5 h-3.5" />
              <span>{domain}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
          <Server className="w-5 h-5 text-white" />
        </div>
      </div>

      {server && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <InfoTile label="Proveedor" value={server.provider || '20i'} />
          <InfoTile label="Plan" value={server.plan || 'Kit Digital'} />
          <InfoTile label="Tipo" value={server.type || 'Shared'} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isOnline && server?.cpanel_url && (
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
        {domain && (
          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            Ver sitio web
          </a>
        )}
      </div>

      {isProvisioning && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Tu hosting está siendo configurado. Puede tomar hasta 30 minutos. Te notificaremos cuando esté listo.</span>
        </div>
      )}

      {isOnline && (
        <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Hosting activo y funcionando. Accede a tu panel para gestionar tu sitio, emails y bases de datos.</span>
        </div>
      )}
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="bg-zinc-50 rounded-xl p-3">
      <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-bold text-zinc-800">{value}</p>
    </div>
  )
}
