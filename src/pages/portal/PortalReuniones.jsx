import { useState } from 'react'
import { Calendar, Clock, Link as LinkIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortalData } from '../../hooks/usePortalData'
import { db } from '../../lib/db'
import { toast } from 'sonner'

const STATUS_MAP = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-600',       icon: XCircle },
  done:      { label: 'Realizada',  color: 'bg-zinc-100 text-zinc-500',      icon: CheckCircle },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hNum = parseInt(h, 10)
  const suffix = hNum >= 12 ? 'pm' : 'am'
  const h12 = hNum % 12 || 12
  return `${h12}:${m} ${suffix}`
}

export default function PortalReuniones() {
  const { profile } = useAuth()
  const { meetings, loading } = usePortalData(profile?.contact_id)
  const [updating, setUpdating] = useState(null)

  const handleStatus = async (meetingId, status) => {
    setUpdating(meetingId)
    try {
      const { error } = await db.meetings.update(meetingId, { status })
      if (error) throw error
      toast.success(status === 'confirmed' ? 'Reunión confirmada' : 'Reunión cancelada')
      window.location.reload()
    } catch {
      toast.error('Error al actualizar la reunión')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        Cargando reuniones...
      </div>
    )
  }

  const sorted = [...(meetings || [])].sort((a, b) => a.date?.localeCompare(b.date))

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-black uppercase tracking-tight">Mis reuniones</h1>
        <p className="text-xs text-zinc-400 mt-0.5">{sorted.length} reunión{sorted.length !== 1 ? 'es' : ''} programada{sorted.length !== 1 ? 's' : ''}</p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Calendar className="w-10 h-10 text-zinc-200" />
          <p className="text-sm text-zinc-400">No tienes reuniones programadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(meeting => {
            const s = STATUS_MAP[meeting.status] || STATUS_MAP.pending
            const StatusIcon = s.icon
            const isPending = meeting.status === 'pending'
            const isUpdating = updating === meeting.id

            return (
              <div key={meeting.id} className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{meeting.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                      <p className="text-xs text-zinc-500 capitalize">{fmtDate(meeting.date)}</p>
                    </div>
                    {meeting.time && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                        <p className="text-xs text-zinc-500">
                          {fmtTime(meeting.time)}
                          {meeting.duration_min && ` · ${meeting.duration_min} min`}
                        </p>
                      </div>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${s.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {s.label}
                  </span>
                </div>

                {meeting.notes && (
                  <p className="text-xs text-zinc-500 bg-zinc-50 rounded-xl px-3 py-2 leading-relaxed">
                    {meeting.notes}
                  </p>
                )}

                {meeting.link && (
                  <a href={meeting.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Unirse a la videollamada</span>
                  </a>
                )}

                {isPending && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleStatus(meeting.id, 'confirmed')}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleStatus(meeting.id, 'cancelled')}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
